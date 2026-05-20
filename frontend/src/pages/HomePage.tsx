import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
} from '@mui/material'
import { logout } from '../api/auth'
import { getUser, getRefreshToken, clearAuth } from '../utils/storage'

export default function HomePage() {
  const navigate = useNavigate()
  const user = getUser()

  async function handleLogout() {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await logout(refreshToken)
      } catch { /* ignore */ }
    }
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f0f2f5',
        px: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 400,
          p: 4,
          borderRadius: 3,
          border: '1px solid #e1e8ed',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: '#1D9BF0', letterSpacing: '-0.5px' }}
        >
          RAISETIMELINE
        </Typography>

        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f1419' }}>
          ログイン成功！
        </Typography>

        <Divider />

        {user && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {user.displayName}
            </Typography>
            <Typography variant="body2" sx={{ color: '#536471' }}>
              @{user.username}
            </Typography>
          </Box>
        )}

        <Button
          variant="contained"
          onClick={handleLogout}
          sx={{
            mt: 1,
            bgcolor: '#f4212e',
            borderRadius: '9999px',
            fontWeight: 700,
            py: 1.5,
            '&:hover': { bgcolor: '#d01020' },
          }}
        >
          ログアウト
        </Button>
      </Paper>
    </Box>
  )
}
