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
import { register } from '../api/auth'
import { saveAuth } from '../utils/storage'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    displayName: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const { username, displayName, email, password, passwordConfirm } = form

    if (!username || !displayName || !email || !password || !passwordConfirm) {
      setError('すべての項目を入力してください。')
      return
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError('ユーザー名は3〜20文字の英数字とアンダースコアのみ使えます。')
      return
    }
    if (displayName.length > 50) {
      setError('表示名は50文字以内にしてください。')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('正しいメールアドレスを入力してください。')
      return
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上にしてください。')
      return
    }
    if (password !== passwordConfirm) {
      setError('パスワードが一致しません。もう一度確認してください。')
      return
    }

    setLoading(true)
    try {
      const auth = await register({ username, displayName, email, password })
      saveAuth(auth)
      navigate('/home', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました。')
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
          アカウント作成
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="ユーザー名"
          value={form.username}
          onChange={update('username')}
          placeholder="alice_01"
          helperText="3〜20文字、英数字とアンダースコアのみ"
          fullWidth
          size="small"
          autoComplete="username"
        />

        <TextField
          label="表示名"
          value={form.displayName}
          onChange={update('displayName')}
          placeholder="Alice Yamamoto"
          helperText="1〜50文字"
          fullWidth
          size="small"
          autoComplete="name"
        />

        <TextField
          label="メールアドレス"
          type="email"
          value={form.email}
          onChange={update('email')}
          placeholder="you@example.com"
          fullWidth
          size="small"
          autoComplete="email"
        />

        <TextField
          label="パスワード"
          type="password"
          value={form.password}
          onChange={update('password')}
          placeholder="8文字以上"
          fullWidth
          size="small"
          autoComplete="new-password"
        />

        <TextField
          label="パスワード（確認）"
          type="password"
          value={form.passwordConfirm}
          onChange={update('passwordConfirm')}
          placeholder="もう一度入力してください"
          fullWidth
          size="small"
          autoComplete="new-password"
        />

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: '#0f1419',
            borderRadius: '9999px',
            fontWeight: 700,
            py: 1.5,
            '&:hover': { bgcolor: '#333', opacity: 0.85 },
          }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : '登録する'}
        </Button>

        <Typography variant="body2" sx={{ color: '#536471', textAlign: 'center' }}>
          すでにアカウントをお持ちの方は{' '}
          <Link
            to="/login"
            style={{ color: '#1D9BF0', fontWeight: 600, textDecoration: 'none' }}
          >
            ログインはこちら
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}
