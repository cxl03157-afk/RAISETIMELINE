import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { likePost, unlikePost } from '../api/likes'
import {
  Alert,
  Box,
  CircularProgress,
  Fab,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

import { logout } from '../api/auth'
import { createPost, deletePost, fetchTimeline, updatePost } from '../api/posts'
import { clearAuth, getRefreshToken, getUser } from '../utils/storage'
import type { PostResponse } from '../types/post'

import AppNavbar from '../components/AppNavbar'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import NewPostsBanner from '../components/NewPostsBanner'
import PostCard from '../components/PostCard'
import PostModal from '../components/PostModal'

const POLL_INTERVAL_MS = 60_000

export default function TimelinePage() {
  const navigate = useNavigate()
  const currentUser = getUser()

  // タブ
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all')

  // 投稿リスト
  const [posts, setPosts] = useState<PostResponse[]>([])

  // ページネーション
  const [currentPage, setCurrentPage] = useState(0)
  const [isLastPage, setIsLastPage] = useState(false)

  // ロード状態
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 新着バナー
  const [bannerVisible, setBannerVisible] = useState(false)
  const baselineIdRef = useRef<number>(0)

  // 投稿モーダル
  const [postModalOpen, setPostModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<PostResponse | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // 削除ダイアログ
  const [deleteTarget, setDeleteTarget] = useState<PostResponse | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 無限スクロール sentinel
  const sentinelRef = useRef<HTMLDivElement>(null)

  // --- 初回ロード ---
  useEffect(() => {
    let cancelled = false

    async function initialLoad() {
      setInitialLoading(true)
      setError(null)
      try {
        const page = await fetchTimeline(activeTab, 0)
        if (cancelled) return
        setPosts(page.content)
        setCurrentPage(0)
        setIsLastPage(page.last)
        if (page.content.length > 0) {
          baselineIdRef.current = page.content[0].id
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'データの取得に失敗しました')
      } finally {
        if (!cancelled) setInitialLoading(false)
      }
    }

    initialLoad()
    return () => { cancelled = true }
  }, [activeTab])

  // --- 追加ロード ---
  const loadMore = useCallback(async () => {
    if (loading || isLastPage) return
    setLoading(true)
    try {
      const nextPage = currentPage + 1
      const page = await fetchTimeline(activeTab, nextPage)
      setPosts((prev) => [...prev, ...page.content])
      setCurrentPage(nextPage)
      setIsLastPage(page.last)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [activeTab, currentPage, isLastPage, loading])

  // --- IntersectionObserver ---
  useEffect(() => {
    if (initialLoading) return
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore, initialLoading])

  // --- ポーリング（新着確認） ---
  useEffect(() => {
    const poll = async () => {
      try {
        const result = await fetchTimeline(activeTab, 0, 1)
        if (result.content[0]?.id > baselineIdRef.current) {
          setBannerVisible(true)
        }
      } catch (e) {
        console.warn('新着確認に失敗:', e)
      }
    }
    const timerId = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(timerId)
  }, [activeTab])

  // --- タイムライン再読み込み（バナークリック時） ---
  async function reloadTimeline() {
    setBannerVisible(false)
    setInitialLoading(true)
    setError(null)
    try {
      const page = await fetchTimeline(activeTab, 0)
      setPosts(page.content)
      setCurrentPage(0)
      setIsLastPage(page.last)
      if (page.content.length > 0) {
        baselineIdRef.current = page.content[0].id
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データの取得に失敗しました')
    } finally {
      setInitialLoading(false)
    }
  }

  // --- ログアウト ---
  async function handleLogout() {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try { await logout(refreshToken) } catch { /* ignore */ }
    }
    clearAuth()
    navigate('/login', { replace: true })
  }

  // --- 投稿作成・編集 ---
  async function handleSubmitPost(content: string, files: File[]) {
    setSubmitLoading(true)
    try {
      if (editingPost) {
        const updated = await updatePost(editingPost.id, content)
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      } else {
        const created = await createPost(content, files)
        setPosts((prev) => [created, ...prev])
        // 自分の投稿後にバナーが出ないようbaselineを更新
        baselineIdRef.current = created.id
      }
      setPostModalOpen(false)
      setEditingPost(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '投稿に失敗しました')
    } finally {
      setSubmitLoading(false)
    }
  }

  // --- いいね（楽観的更新） ---
  async function handleLike(post: PostResponse) {
    const liked = post.likedByCurrentUser
    setPosts((prev) => prev.map((p) =>
      p.id === post.id
        ? { ...p, likedByCurrentUser: !liked, likeCount: p.likeCount + (liked ? -1 : 1) }
        : p
    ))
    try {
      if (liked) { await unlikePost(post.id) } else { await likePost(post.id) }
    } catch {
      setPosts((prev) => prev.map((p) =>
        p.id === post.id
          ? { ...p, likedByCurrentUser: liked, likeCount: p.likeCount + (liked ? 1 : -1) }
          : p
      ))
      setError('いいね操作に失敗しました')
    }
  }

  // --- 投稿削除 ---
  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deletePost(deleteTarget.id)
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!currentUser) {
    navigate('/login', { replace: true })
    return null
  }

  return (
    <Box sx={{ bgcolor: '#f0f2f5', minHeight: '100vh' }}>
      <AppNavbar user={currentUser} onLogout={handleLogout} />

      {/* 新着バナー */}
      <NewPostsBanner
        visible={bannerVisible}
        onClick={async () => {
          await reloadTimeline()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      {/* タイムライン本体 */}
      <Box
        sx={{
          maxWidth: 600,
          mx: 'auto',
          bgcolor: '#fff',
          minHeight: 'calc(100vh - 64px)',
          borderLeft: '1px solid #eff3f4',
          borderRight: '1px solid #eff3f4',
        }}
      >
        {/* タブ */}
        <Tabs
          value={activeTab}
          onChange={(_, v: 'all' | 'following') => setActiveTab(v)}
          sx={{
            borderBottom: '1px solid #eff3f4',
            '& .MuiTabs-indicator': { bgcolor: '#1D9BF0', height: 3, borderRadius: 2 },
          }}
        >
          <Tab
            value="all"
            label="全体"
            sx={{
              flex: 1,
              fontWeight: 700,
              fontSize: 15,
              color: '#536471',
              '&.Mui-selected': { color: '#0f1419' },
            }}
          />
          <Tab
            value="following"
            label="フォロー中"
            sx={{
              flex: 1,
              fontWeight: 700,
              fontSize: 15,
              color: '#536471',
              '&.Mui-selected': { color: '#0f1419' },
            }}
          />
        </Tabs>

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* 初回ローディング */}
        {initialLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#1D9BF0' }} />
          </Box>
        )}

        {/* 投稿リスト */}
        {!initialLoading && (
          <>
            {posts.length === 0 && (
              <Typography sx={{ textAlign: 'center', color: '#536471', py: 6 }}>
                投稿がありません
              </Typography>
            )}
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUser.id}
                onEdit={(p) => { setEditingPost(p); setPostModalOpen(true) }}
                onDelete={(p) => setDeleteTarget(p)}
                onLike={handleLike}
                onCommentClick={(p) => navigate(`/posts/${p.id}`)}
                onUserClick={(p) => navigate(`/users/${p.user.username}`)}
              />
            ))}

            {/* 追加ロード中スピナー */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} sx={{ color: '#1D9BF0' }} />
              </Box>
            )}

            {/* 無限スクロール sentinel */}
            {!isLastPage && <div ref={sentinelRef} style={{ height: 1 }} />}

            {/* 末尾メッセージ */}
            {isLastPage && posts.length > 0 && (
              <Typography sx={{ textAlign: 'center', color: '#536471', py: 4, fontSize: 14 }}>
                すべての投稿を表示しました
              </Typography>
            )}
          </>
        )}
      </Box>

      {/* 投稿 FAB */}
      <Fab
        variant="extended"
        onClick={() => { setEditingPost(null); setPostModalOpen(true) }}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 'max(16px, calc(50% - 300px + 16px))',
          bgcolor: '#1D9BF0',
          color: '#fff',
          '&:hover': { bgcolor: '#1a8cd8' },
          boxShadow: '0 4px 14px rgba(29,155,240,0.45)',
          fontWeight: 700,
          fontSize: 15,
          px: 3,
          gap: 1,
        }}
      >
        <AddIcon />
        投稿
      </Fab>

      {/* 投稿作成・編集モーダル（key でリマウントして initialContent をリセット） */}
      <PostModal
        key={editingPost?.id ?? 'new'}
        open={postModalOpen}
        mode={editingPost ? 'edit' : 'create'}
        initialContent={editingPost?.content ?? ''}
        loading={submitLoading}
        onClose={() => { setPostModalOpen(false); setEditingPost(null) }}
        onSubmit={handleSubmitPost}
      />

      {/* 削除確認ダイアログ */}
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        loading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  )
}
