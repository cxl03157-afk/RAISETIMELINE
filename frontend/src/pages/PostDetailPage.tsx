import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'

import { logout } from '../api/auth'
import { likePost, unlikePost } from '../api/likes'
import { getPost } from '../api/posts'
import { fetchComments, createComment, deleteComment } from '../api/comments'
import { clearAuth, getRefreshToken, getUser } from '../utils/storage'
import type { PostResponse } from '../types/post'
import type { CommentResponse } from '../types/comment'

import AppNavbar from '../components/AppNavbar'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import PostCard from '../components/PostCard'

const AVATAR_COLORS = [
  '#1D9BF0', '#F4212E', '#00BA7C', '#FF7008', '#794BC4',
]

function avatarColor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = getUser()

  const [post, setPost] = useState<PostResponse | null>(null)
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CommentResponse | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser || !id) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [fetchedPost, fetchedComments] = await Promise.all([
          getPost(Number(id)),
          fetchComments(Number(id)),
        ])
        if (cancelled) return
        setPost(fetchedPost)
        setComments(fetchedComments)
      } catch {
        if (!cancelled) navigate('/home', { replace: true })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleLogout() {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try { await logout(refreshToken) } catch { /* ignore */ }
    }
    clearAuth()
    navigate('/login', { replace: true })
  }

  function handleBack() {
    if (window.history.length <= 1) {
      navigate('/home', { replace: true })
    } else {
      navigate(-1)
    }
  }

  async function handleLike(p: PostResponse) {
    const liked = p.likedByCurrentUser
    setPost((prev) => prev && {
      ...prev,
      likedByCurrentUser: !liked,
      likeCount: prev.likeCount + (liked ? -1 : 1),
    })
    try {
      if (liked) { await unlikePost(p.id) } else { await likePost(p.id) }
    } catch {
      setPost((prev) => prev && {
        ...prev,
        likedByCurrentUser: liked,
        likeCount: prev.likeCount + (liked ? 1 : -1),
      })
      setError('いいね操作に失敗しました')
    }
  }

  async function handleSubmitComment() {
    if (!post || !commentText.trim()) return
    setSubmitLoading(true)
    try {
      const newComment = await createComment(post.id, commentText.trim())
      setComments((prev) => [...prev, newComment])
      setPost((prev) => prev && { ...prev, commentCount: prev.commentCount + 1 })
      setCommentText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'コメントの投稿に失敗しました')
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || !post) return
    setDeleteLoading(true)
    try {
      await deleteComment(post.id, deleteTarget.id)
      setComments((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setPost((prev) => prev && { ...prev, commentCount: prev.commentCount - 1 })
      setDeleteTarget(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'コメントの削除に失敗しました')
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
        {/* ヘッダー */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderBottom: '1px solid #eff3f4',
            position: 'sticky',
            top: 64,
            bgcolor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            zIndex: 1,
          }}
        >
          <IconButton onClick={handleBack} size="small" sx={{ color: '#0f1419' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 700, fontSize: 18, color: '#0f1419' }}>
            投稿
          </Typography>
        </Box>

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* ローディング */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#1D9BF0' }} />
          </Box>
        )}

        {/* コンテンツ */}
        {!loading && post && (
          <>
            {/* 投稿カード */}
            <PostCard
              post={post}
              currentUserId={currentUser.id}
              onEdit={() => {}}
              onDelete={() => {}}
              onLike={handleLike}
              onCommentClick={() => {}}
            />

            <Divider />

            {/* コメントセクション */}
            <Box sx={{ px: 2, py: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#0f1419', mb: 2 }}>
                コメント（{comments.length}件）
              </Typography>

              {/* コメント入力フォーム */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                <Avatar
                  src={currentUser.avatarUrl ?? undefined}
                  alt={currentUser.displayName}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: avatarColor(currentUser.displayName),
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {currentUser.displayName[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    multiline
                    minRows={2}
                    fullWidth
                    placeholder="コメントを追加..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value.slice(0, 280))}
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: 14,
                        '& fieldset': { borderColor: '#eff3f4' },
                        '&:hover fieldset': { borderColor: '#1D9BF0' },
                        '&.Mui-focused fieldset': { borderColor: '#1D9BF0' },
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || submitLoading}
                      sx={{
                        borderRadius: '9999px',
                        bgcolor: '#1D9BF0',
                        fontWeight: 700,
                        fontSize: 13,
                        px: 2,
                        '&:hover': { bgcolor: '#1a8cd8' },
                        '&.Mui-disabled': { bgcolor: '#8ecdf8', color: '#fff' },
                      }}
                    >
                      {submitLoading ? <CircularProgress size={16} color="inherit" /> : 'コメントする'}
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* コメント一覧 */}
              {comments.length === 0 && (
                <Typography sx={{ textAlign: 'center', color: '#536471', py: 4, fontSize: 14 }}>
                  コメントはまだありません
                </Typography>
              )}
              {comments.map((comment) => (
                <Box
                  key={comment.id}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    py: 2,
                    borderBottom: '1px solid #eff3f4',
                  }}
                >
                  <Avatar
                    src={comment.user.avatarUrl ?? undefined}
                    alt={comment.user.displayName}
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: avatarColor(comment.user.displayName),
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {comment.user.displayName[0]}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mb: '2px' }}>
                      <Typography
                        component="span"
                        sx={{ fontWeight: 700, fontSize: 14, color: '#0f1419', whiteSpace: 'nowrap' }}
                      >
                        {comment.user.displayName}
                      </Typography>
                      <Typography
                        component="span"
                        sx={{ fontSize: 13, color: '#536471', whiteSpace: 'nowrap' }}
                      >
                        @{comment.user.username}
                      </Typography>
                      {comment.user.id === currentUser.id && (
                        <IconButton
                          size="small"
                          onClick={() => setDeleteTarget(comment)}
                          sx={{ ml: 'auto', color: '#536471', p: '2px', '&:hover': { color: '#f4212e' } }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </Box>
                    <Typography sx={{ fontSize: 14, color: '#0f1419', wordBreak: 'break-word', lineHeight: 1.5 }}>
                      {comment.content}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>

      {/* コメント削除確認ダイアログ */}
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        loading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  )
}
