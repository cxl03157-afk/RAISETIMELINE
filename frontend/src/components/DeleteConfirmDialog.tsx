import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'

interface DeleteConfirmDialogProps {
  open: boolean
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteConfirmDialog({
  open,
  loading,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>投稿を削除しますか？</DialogTitle>
      <DialogContent>
        <DialogContentText>この操作は取り消せません。</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading} sx={{ color: '#536471' }}>
          キャンセル
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          sx={{ borderRadius: '9999px', fontWeight: 700, minWidth: 88 }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : '削除する'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
