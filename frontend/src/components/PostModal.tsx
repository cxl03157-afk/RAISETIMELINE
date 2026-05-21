import { useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface PostModalProps {
  open: boolean
  mode: 'create' | 'edit'
  initialContent?: string
  loading: boolean
  onClose: () => void
  onSubmit: (content: string) => void
}

export default function PostModal({
  open,
  mode,
  initialContent = '',
  loading,
  onClose,
  onSubmit,
}: PostModalProps) {
  const [text, setText] = useState(initialContent)

  const len = text.length
  const isDisabled = text.trim().length === 0 || len > 280 || loading

  const counterColor =
    len > 280 ? 'error.main' : len > 260 ? 'warning.main' : 'text.secondary'

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 0,
          fontWeight: 700,
        }}
      >
        {mode === 'create' ? '新しい投稿' : '投稿を編集'}
        <IconButton onClick={onClose} disabled={loading} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <TextField
          multiline
          fullWidth
          minRows={4}
          maxRows={10}
          placeholder="いまどうしてる？"
          value={text}
          onChange={(e) => setText(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 280 } }}
          variant="standard"
          sx={{ fontSize: 18 }}
          autoFocus
        />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: counterColor }}>
            {len} / 280
          </Typography>
          <Button
            variant="contained"
            disabled={isDisabled}
            onClick={() => onSubmit(text)}
            sx={{
              bgcolor: '#0f1419',
              borderRadius: '9999px',
              fontWeight: 700,
              px: 3,
              minWidth: 80,
              '&:hover': { bgcolor: '#333' },
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : mode === 'create' ? (
              '投稿する'
            ) : (
              '更新する'
            )}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
