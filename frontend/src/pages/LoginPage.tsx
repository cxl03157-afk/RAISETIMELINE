import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material'
import { login } from '../api/auth'
import { saveAuth } from '../utils/storage'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください。')
      return
    }

    setLoading(true)
    try {
      const auth = await login({ email, password })
      saveAuth(auth)
      navigate('/home', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#ffffff',
        px: 3,
      }}
    >
      <Typography
        variant="h5"
        sx={{ fontWeight: 800, color: '#1D9BF0', letterSpacing: '-0.5px', mb: 1 }}
      >
        RAISETIMELINE
      </Typography>
      <Typography variant="body2" sx={{ color: '#536471', mb: 4 }}>
        学習用SNSアプリのプロトタイプ
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          ログイン
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="メールアドレス"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          fullWidth
          size="small"
          autoComplete="email"
        />

        <TextField
          label="パスワード"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8文字以上"
          fullWidth
          size="small"
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: '#1D9BF0',
            borderRadius: '9999px',
            fontWeight: 700,
            py: 1.5,
            '&:hover': { bgcolor: '#1a8cd8' },
          }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : 'ログイン'}
        </Button>

        <Typography variant="body2" sx={{ color: '#536471', textAlign: 'center' }}>
          アカウントをお持ちでない方は{' '}
          <Link
            to="/register"
            style={{ color: '#1D9BF0', fontWeight: 600, textDecoration: 'none' }}
          >
            新規登録はこちら
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}
