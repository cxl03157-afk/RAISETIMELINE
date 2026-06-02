import { useEffect, useRef, useState } from 'react'
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
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'

const MAX_IMAGES = 4

interface PreviewItem {
  url: string
  file: File
}

interface PostModalProps {
  open: boolean
  mode: 'create' | 'edit'
  initialContent?: string
  loading: boolean
  onClose: () => void
  onSubmit: (content: string, files: File[]) => void
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
  const [previews, setPreviews] = useState<PreviewItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  // useRef で objectURL リストを追跡（空依存配列のクリーンアップでも最新値を参照できる）
  const objectUrlsRef = useRef<string[]>([])

  // モーダルが開くたびに入力内容・画像をリセット
  // （親が key={editingPost?.id ?? 'new'} で管理する意図的なリセットパターン）
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText(initialContent)
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
      objectUrlsRef.current = []
      setPreviews([])
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // アンマウント時に残っている objectURL を全解放
  // ref オブジェクト自体（安定した参照）をキャプチャし、cleanup で .current を参照する
  useEffect(() => {
    const ref = objectUrlsRef
    return () => {
      ref.current.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  const len = text.length
  const hasContent = text.trim().length > 0
  const hasImages = previews.length > 0
  const isDisabled = (!hasContent && !hasImages) || len > 280 || loading

  const counterColor =
    len > 280 ? 'error.main' : len > 260 ? 'warning.main' : 'text.secondary'

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length === 0) return

    const remaining = MAX_IMAGES - previews.length
    const toAdd = selected.slice(0, remaining)

    const newItems: PreviewItem[] = toAdd.map(file => {
      const url = URL.createObjectURL(file)
      objectUrlsRef.current.push(url)
      return { url, file }
    })

    setPreviews(prev => [...prev, ...newItems])
    // 同じファイルを連続選択できるようリセット
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(index: number) {
    const url = objectUrlsRef.current[index]
    URL.revokeObjectURL(url)
    objectUrlsRef.current.splice(index, 1)
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  function handleClose() {
    if (loading) return
    onClose()
  }

  function handleSubmit() {
    onSubmit(text, previews.map(p => p.file))
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
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
        <IconButton onClick={handleClose} disabled={loading} size="small" aria-label="閉じる">
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
          variant="standard"
          sx={{ fontSize: 18 }}
          autoFocus
        />

        {/* 画像プレビュー */}
        {previews.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: previews.length === 1 ? '1fr' : '1fr 1fr',
              gap: 0.5,
              mt: 1.5,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            {previews.map((item, idx) => (
              <Box key={idx} sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={item.url}
                  alt={`preview-${idx}`}
                  sx={{
                    width: '100%',
                    height: previews.length === 1 ? 240 : 140,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <IconButton
                  size="small"
                  aria-label="画像を削除"
                  onClick={() => removeImage(idx)}
                  disabled={loading}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                    width: 24,
                    height: 24,
                  }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* 画像追加ボタン（編集モードでは非表示） */}
            {mode === 'create' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <IconButton
                  size="small"
                  aria-label="画像を追加"
                  disabled={loading || previews.length >= MAX_IMAGES}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ color: '#1D9BF0' }}
                >
                  <ImageOutlinedIcon fontSize="small" />
                </IconButton>
                {previews.length > 0 && (
                  <Typography variant="caption" sx={{ color: '#536471' }}>
                    {previews.length} / {MAX_IMAGES}
                  </Typography>
                )}
              </>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: counterColor }}>
              {len} / 280
            </Typography>
            <Button
              variant="contained"
              disabled={isDisabled}
              onClick={handleSubmit}
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
        </Box>
      </DialogContent>
    </Dialog>
  )
}
