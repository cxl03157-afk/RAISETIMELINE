import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { logout } from '../api/auth'
import { getFollowers, getFollowing, followUser, unfollowUser } from '../api/users'
import { clearAuth, getRefreshToken, getUser } from '../utils/storage'
import type { UserResponse } from '../types/auth'

import AppNavbar from '../components/AppNavbar'
import UserCard from '../components/UserCard'

export default function FollowListPage() {
  const { username } = useParams<{ username: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const currentUser = getUser()

  const isFollowing = location.pathname.endsWith('/following')
  const title = isFollowing ? 'フォロー中' : 'フォロワー'
  const emptyMessage = isFollowing ? 'フォロー中のユーザーはいません' : 'フォロワーはいません'

  const [users, setUsers] = useState<UserResponse[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isLastPage, setIsLastPage] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // 初回ロード
  useEffect(() => {
    if (!username) return
    let cancelled = false

    async function initialLoad() {
      setInitialLoading(true)
      setError(null)
      try {
        const page = isFollowing
          ? await getFollowing(username!, 0)
          : await getFollowers(username!, 0)
        if (cancelled) return
        setUsers(page.content)
        setCurrentPage(0)
        setIsLastPage(page.last)
      } catch {
        if (!cancelled) navigate('/home', { replace: true })
      } finally {
        if (!cancelled) setInitialLoading(false)
      }
    }

    initialLoad()
    return () => { cancelled = true }
  }, [username, isFollowing, navigate])

  const loadMore = useCallback(async () => {
    if (loading || isLastPage || !username) return
    setLoading(true)
    try {
      const nextPage = currentPage + 1
      const page = isFollowing
        ? await getFollowing(username, nextPage)
        : await getFollowers(username, nextPage)
      setUsers(prev => [...prev, ...page.content])
      setCurrentPage(nextPage)
      setIsLastPage(page.last)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [username, isFollowing, currentPage, isLastPage, loading])

  // IntersectionObserver
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

  async function handleFollowToggle(targetUsername: string, nowFollowing: boolean) {
    setUsers(prev => prev.map(u =>
      u.username === targetUsername
        ? { ...u, followedByMe: nowFollowing, followersCount: u.followersCount + (nowFollowing ? 1 : -1) }
        : u
    ))
    try {
      if (nowFollowing) { await followUser(targetUsername) } else { await unfollowUser(targetUsername) }
    } catch (e) {
      setUsers(prev => prev.map(u =>
        u.username === targetUsername
          ? { ...u, followedByMe: !nowFollowing, followersCount: u.followersCount + (nowFollowing ? -1 : 1) }
          : u
      ))
      setError(e instanceof Error ? e.message : 'フォロー操作に失敗しました')
    }
  }

  async function handleLogout() {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try { await logout(refreshToken) } catch { /* ignore */ }
    }
    clearAuth()
    navigate('/login', { replace: true })
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
        {/* ヘッダーバー */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: '10px', borderBottom: '1px solid #eff3f4' }}>
          <Button
            onClick={() => (window.history.length <= 1 ? navigate('/home') : navigate(-1))}
            startIcon={<ArrowBackIcon />}
            sx={{ color: '#0f1419', textTransform: 'none', fontWeight: 700, fontSize: 15, minWidth: 0, p: '4px 8px' }}
          >
            {title}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {initialLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#1D9BF0' }} />
          </Box>
        )}

        {!initialLoading && (
          <>
            {users.length === 0 && (
              <Typography sx={{ textAlign: 'center', color: '#536471', py: 6 }}>
                {emptyMessage}
              </Typography>
            )}

            {users.map(user => (
              <UserCard
                key={user.id}
                user={user}
                currentUserId={currentUser.id}
                onFollowToggle={handleFollowToggle}
              />
            ))}

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} sx={{ color: '#1D9BF0' }} />
              </Box>
            )}

            {!isLastPage && <div ref={sentinelRef} style={{ height: 1 }} />}

            {isLastPage && users.length > 0 && (
              <Typography sx={{ textAlign: 'center', color: '#536471', py: 4, fontSize: 14 }}>
                すべて表示しました
              </Typography>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
