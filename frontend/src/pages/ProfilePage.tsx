import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { likePost, unlikePost } from '../api/likes'
import { deletePost } from '../api/posts'
import { getUserProfile, getUserPosts, updateProfile, uploadAvatar, followUser, unfollowUser } from '../api/users'
import { getUser, updateStoredUser } from '../utils/storage'
import type { UserResponse } from '../types/auth'
import type { PostResponse } from '../types/post'

import AppNavbar from '../components/AppNavbar'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import EditProfileModal from '../components/EditProfileModal'
import PostCard from '../components/PostCard'
import { logout } from '../api/auth'
import { clearAuth, getRefreshToken } from '../utils/storage'

const AVATAR_COLORS = [
  '#1D9BF0', '#F4212E', '#00BA7C', '#FF7008', '#794BC4',
]

function avatarColor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const currentUser = getUser()

  const [profile, setProfile] = useState<UserResponse | null>(null)
  const [posts, setPosts] = useState<PostResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PostResponse | null>(null)

  // AppNavbar 再描画用に currentUser を state で持つ
  const [navUser, setNavUser] = useState(currentUser)

  const isOwn = currentUser?.username === username

  const loadedUsernameRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!username || loadedUsernameRef.current === username) return
    loadedUsernameRef.current = username
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [profileData, postsData] = await Promise.all([
          getUserProfile(username!),
          getUserPosts(username!),
        ])
        if (cancelled) return
        setProfile(profileData)
        setPosts(postsData)
      } catch {
        if (!cancelled) navigate('/home', { replace: true })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [username, navigate])

  // username が変わったらロード済みフラグをリセット
  useEffect(() => {
    loadedUsernameRef.current = undefined
  }, [username])

  async function handleLogout() {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try { await logout(refreshToken) } catch { /* ignore */ }
    }
    clearAuth()
    navigate('/login', { replace: true })
  }

  async function handleFollow() {
    if (!profile) return
    setFollowLoading(true)
    const wasFollowing = profile.followedByMe
    try {
      if (wasFollowing) { await unfollowUser(profile.username) } else { await followUser(profile.username) }
      setProfile(prev => prev && {
        ...prev,
        followedByMe: !wasFollowing,
        followersCount: prev.followersCount + (wasFollowing ? -1 : 1),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'フォロー操作に失敗しました')
    } finally {
      setFollowLoading(false)
    }
  }

  async function handleEditSubmit(displayName: string, bio: string, avatarFile: File | null) {
    setEditLoading(true)
    try {
      if (avatarFile) {
        const avatarUpdated = await uploadAvatar(avatarFile)
        setProfile(prev => prev && { ...prev, ...avatarUpdated })
        setPosts(prev => prev.map(p =>
          p.user.id === currentUser!.id
            ? { ...p, user: { ...p.user, avatarUrl: avatarUpdated.avatarUrl } }
            : p
        ))
      }
      const updated = await updateProfile(displayName, bio)
      setProfile(prev => prev && { ...prev, ...updated })
      updateStoredUser(updated)
      setNavUser(updated)
      setEditModalOpen(false)
    } finally {
      setEditLoading(false)
    }
  }

  async function handleLike(post: PostResponse) {
    const liked = post.likedByCurrentUser
    setPosts(prev => prev.map(p =>
      p.id === post.id
        ? { ...p, likedByCurrentUser: !liked, likeCount: p.likeCount + (liked ? -1 : 1) }
        : p
    ))
    try {
      if (liked) { await unlikePost(post.id) } else { await likePost(post.id) }
    } catch {
      setPosts(prev => prev.map(p =>
        p.id === post.id
          ? { ...p, likedByCurrentUser: liked, likeCount: p.likeCount + (liked ? 1 : -1) }
          : p
      ))
      setError('いいね操作に失敗しました')
    }
  }

  if (!currentUser || !navUser) {
    navigate('/login', { replace: true })
    return null
  }

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#f0f2f5', minHeight: '100vh' }}>
        <AppNavbar user={navUser} onLogout={handleLogout} />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#1D9BF0' }} />
        </Box>
      </Box>
    )
  }

  if (!profile) return null

  return (
    <Box sx={{ bgcolor: '#f0f2f5', minHeight: '100vh' }}>
      <AppNavbar user={navUser} onLogout={handleLogout} />

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
        {/* ヘッダーバー */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: '10px', borderBottom: '1px solid #eff3f4' }}>
          <Button
            onClick={() => (window.history.length <= 1 ? navigate('/home') : navigate(-1))}
            startIcon={<ArrowBackIcon />}
            sx={{ color: '#0f1419', textTransform: 'none', fontWeight: 700, fontSize: 15, minWidth: 0, p: '4px 8px' }}
          >
            プロフィール
          </Button>
        </Box>

        {/* エラー */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* カバー */}
        <Box sx={{ bgcolor: '#cfd9de', height: 120, position: 'relative' }} />

        {/* アバター・ボタン行 */}
        <Box sx={{ px: 2, pt: 1, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Avatar
            src={profile.avatarUrl ?? undefined}
            alt={profile.displayName}
            sx={{
              width: 80,
              height: 80,
              bgcolor: avatarColor(profile.displayName),
              fontSize: 32,
              border: '4px solid #fff',
              mt: '-40px',
            }}
          >
            {profile.displayName[0]}
          </Avatar>

          {isOwn ? (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setEditModalOpen(true)}
              sx={{
                mt: 1,
                borderRadius: '9999px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 14,
                color: '#0f1419',
                borderColor: '#cfd9de',
                px: 2,
                '&:hover': { bgcolor: 'rgba(15,20,25,0.1)', borderColor: '#cfd9de' },
              }}
            >
              プロフィールを編集
            </Button>
          ) : (
            <Button
              variant={profile.followedByMe ? 'contained' : 'outlined'}
              size="small"
              disabled={followLoading}
              onClick={handleFollow}
              sx={{
                mt: 1,
                borderRadius: '9999px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 14,
                px: 2,
                ...(profile.followedByMe
                  ? { bgcolor: '#0f1419', color: '#fff', borderColor: '#0f1419', '&:hover': { bgcolor: '#272c30' } }
                  : { color: '#0f1419', borderColor: '#cfd9de', '&:hover': { bgcolor: 'rgba(15,20,25,0.1)', borderColor: '#cfd9de' } }
                ),
              }}
            >
              {profile.followedByMe ? 'フォロー中' : 'フォローする'}
            </Button>
          )}
        </Box>

        {/* ユーザー情報 */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0f1419', lineHeight: 1.3 }}>
            {profile.displayName}
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#536471', mb: 1 }}>
            @{profile.username}
          </Typography>
          {profile.bio && (
            <Typography sx={{ fontSize: 15, color: '#0f1419', mb: 1, lineHeight: 1.5 }}>
              {profile.bio}
            </Typography>
          )}

          {/* フォロー中/フォロワー */}
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Box
              component="button"
              onClick={() => navigate(`/users/${profile.username}/following`)}
              sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0, display: 'flex', gap: '4px', alignItems: 'center' }}
            >
              <Typography component="span" sx={{ fontWeight: 700, fontSize: 14, color: '#0f1419' }}>
                {profile.followingCount}
              </Typography>
              <Typography component="span" sx={{ fontSize: 14, color: '#536471' }}>
                フォロー中
              </Typography>
            </Box>
            <Box
              component="button"
              onClick={() => navigate(`/users/${profile.username}/followers`)}
              sx={{ background: 'none', border: 'none', cursor: 'pointer', p: 0, display: 'flex', gap: '4px', alignItems: 'center' }}
            >
              <Typography component="span" sx={{ fontWeight: 700, fontSize: 14, color: '#0f1419' }}>
                {profile.followersCount}
              </Typography>
              <Typography component="span" sx={{ fontSize: 14, color: '#536471' }}>
                フォロワー
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 投稿一覧 */}
        {posts.length === 0 ? (
          <Typography sx={{ textAlign: 'center', color: '#536471', py: 6 }}>
            投稿がありません
          </Typography>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser.id}
              onEdit={() => {}}
              onDelete={(p) => setDeleteTarget(p)}
              onLike={handleLike}
              onCommentClick={(p) => navigate(`/posts/${p.id}`)}
              onUserClick={(p) => navigate(`/users/${p.user.username}`)}
            />
          ))
        )}
      </Box>

      {/* プロフィール編集モーダル */}
      {editModalOpen && (
        <EditProfileModal
          open={editModalOpen}
          user={profile}
          loading={editLoading}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleEditSubmit}
        />
      )}

      {/* 削除確認ダイアログ（自分の投稿削除） */}
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        loading={false}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await deletePost(deleteTarget.id)
            setPosts(prev => prev.filter(p => p.id !== deleteTarget.id))
          } catch (e) {
            setError(e instanceof Error ? e.message : '削除に失敗しました')
          } finally {
            setDeleteTarget(null)
          }
        }}
      />
    </Box>
  )
}
