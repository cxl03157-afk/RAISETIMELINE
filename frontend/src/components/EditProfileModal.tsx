import { useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import type { UserResponse } from '../types/auth'

const AVATAR_COLORS = [
  '#1D9BF0', '#F4212E', '#00BA7C', '#FF7008', '#794BC4',
]

function avatarColor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

interface EditProfileModalProps {
  open: boolean
  user: UserResponse
  loading: boolean
  onClose: () => void
  onSubmit: (displayName: string, bio: string, avatarFile: File | null) => Promise<void>
}

export default function EditProfileModal({ open, user, loading, onClose, onSubmit }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName)
  const [bio, setBio] = useState(user.bio ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setSubmitError(null)
    e.target.value = ''
  }

  const canSubmit = displayName.trim().length > 0 && displayName.length <= 50 && bio.length <= 160 && !loading

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitError(null)
    try {
      await onSubmit(displayName.trim(), bio, avatarFile)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '更新に失敗しました')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <IconButton onClick={onClose} size="small" sx={{ color: '#536471' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ fontWeight: 700, fontSize: 18, flex: 1 }}>プロフィールを編集</Typography>
        <Button
          variant="contained"
          size="small"
          disabled={!canSubmit}
          onClick={handleSubmit}
          sx={{
            bgcolor: '#0f1419',
            color: '#fff',
            borderRadius: '9999px',
            textTransform: 'none',
            fontWeight: 700,
            px: 2,
            '&:hover': { bgcolor: '#272c30' },
            '&.Mui-disabled': { bgcolor: '#cfd9de', color: '#fff' },
          }}
        >
          保存
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {submitError && (
          <Alert severity="error" onClose={() => setSubmitError(null)} sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative', width: 72, height: 72 }}>
            <Avatar
              src={avatarPreview ?? user.avatarUrl ?? undefined}
              alt={user.displayName}
              sx={{
                width: 72,
                height: 72,
                bgcolor: avatarColor(user.displayName),
                fontSize: 28,
              }}
            >
              {user.displayName[0]}
            </Avatar>
            {/* カメラアイコンオーバーレイ */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.45)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            >
              <CameraAltIcon sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            {/* アバター全体を覆う透明な input — クリックで直接ファイル選択画面が開く */}
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleAvatarChange}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
              }}
            />
          </Box>
        </Box>

        <TextField
          label="表示名"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          fullWidth
          required
          slotProps={{ htmlInput: { maxLength: 50 }, formHelperText: { sx: { textAlign: 'right' } } }}
          helperText={`${displayName.length}/50`}
          sx={{ mb: 2 }}
        />

        <TextField
          label="自己紹介"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          fullWidth
          multiline
          rows={3}
          slotProps={{ htmlInput: { maxLength: 160 }, formHelperText: { sx: { textAlign: 'right' } } }}
          helperText={`${bio.length}/160`}
        />
      </DialogContent>
    </Dialog>
  )
}
