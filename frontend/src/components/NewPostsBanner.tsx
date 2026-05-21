import { Fade, Paper, Typography } from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'

interface NewPostsBannerProps {
  visible: boolean
  onClick: () => void
}

export default function NewPostsBanner({ visible, onClick }: NewPostsBannerProps) {
  return (
    <Fade in={visible} unmountOnExit>
      <Paper
        onClick={onClick}
        elevation={3}
        sx={{
          position: 'fixed',
          top: 70,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          cursor: 'pointer',
          borderRadius: '9999px',
          bgcolor: '#1D9BF0',
          color: '#fff',
          px: 2.5,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          boxShadow: '0 4px 14px rgba(29,155,240,0.45)',
          '&:hover': { bgcolor: '#1a8cd8' },
          transition: 'background 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        <ArrowUpwardIcon sx={{ fontSize: 18 }} />
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
          新しい投稿があります
        </Typography>
      </Paper>
    </Fade>
  )
}
