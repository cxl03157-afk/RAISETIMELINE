import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

import { logout } from '../api/auth'
import { searchUsers, followUser, unfollowUser } from '../api/users'
import { clearAuth, getRefreshToken, getUser } from '../utils/storage'
import type { UserResponse } from '../types/auth'

import AppNavbar from '../components/AppNavbar'
import UserCard from '../components/UserCard'

export default function SearchPage() {
  const navigate = useNavigate()
  const currentUser = getUser()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newQuery = e.target.value
    setQuery(newQuery)
    if (!newQuery.trim()) {
      setResults([])
      setSearched(false)
    }
  }

  // query が空でない場合のみデバウンス検索（setLoading は setTimeout 内で呼ぶ）
  useEffect(() => {
    if (!query.trim()) return
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchUsers(query.trim())
        setResults(data)
        setSearched(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : '検索に失敗しました')
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  async function handleFollowToggle(username: string, nowFollowing: boolean) {
    setResults(prev => prev.map(u =>
      u.username === username
        ? { ...u, followedByMe: nowFollowing, followersCount: u.followersCount + (nowFollowing ? 1 : -1) }
        : u
    ))
    try {
      if (nowFollowing) { await followUser(username) } else { await unfollowUser(username) }
    } catch (e) {
      setResults(prev => prev.map(u =>
        u.username === username
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
        <Box sx={{ p: 2, borderBottom: '1px solid #eff3f4' }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="ユーザー名または表示名で検索..."
            value={query}
            onChange={handleQueryChange}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#536471' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '9999px',
                bgcolor: '#eff3f4',
                '& fieldset': { border: 'none' },
                '&.Mui-focused': { bgcolor: '#fff', boxShadow: '0 0 0 2px #1D9BF0', '& fieldset': { border: 'none' } },
              },
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: '#1D9BF0' }} />
          </Box>
        )}

        {!loading && searched && results.length === 0 && query.trim() && (
          <Typography sx={{ textAlign: 'center', color: '#536471', py: 6 }}>
            ユーザーが見つかりませんでした
          </Typography>
        )}

        {!loading && results.map(user => (
          <UserCard
            key={user.id}
            user={user}
            currentUserId={currentUser.id}
            onFollowToggle={handleFollowToggle}
          />
        ))}
      </Box>
    </Box>
  )
}
