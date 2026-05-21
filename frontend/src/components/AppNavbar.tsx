import { useState } from 'react'
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material'
import type { UserResponse } from '../types/auth'

const AVATAR_COLORS = [
  '#1D9BF0', '#F4212E', '#00BA7C', '#FF7008', '#794BC4',
]

function avatarColor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

interface AppNavbarProps {
  user: UserResponse
  onLogout: () => void
}

export default function AppNavbar({ user, onLogout }: AppNavbarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #eff3f4',
        color: '#0f1419',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 600, width: '100%', mx: 'auto', px: 2 }}>
        <Typography
          sx={{ fontWeight: 800, fontSize: 18, color: '#1D9BF0', letterSpacing: '-0.5px' }}
        >
          RAISETIMELINE
        </Typography>

        <Box>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
            <Avatar
              src={user.avatarUrl ?? undefined}
              alt={user.displayName}
              sx={{
                width: 32,
                height: 32,
                bgcolor: avatarColor(user.displayName),
                fontSize: 13,
              }}
            >
              {user.displayName[0]}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled sx={{ fontSize: 14, opacity: 1, fontWeight: 700 }}>
              @{user.username}
            </MenuItem>
            <MenuItem
              onClick={() => { setAnchorEl(null); onLogout() }}
              sx={{ fontSize: 14, color: '#f4212e' }}
            >
              ログアウト
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
