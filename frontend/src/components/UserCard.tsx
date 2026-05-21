import { useNavigate } from 'react-router-dom'
import { Avatar, Box, Button, Typography } from '@mui/material'
import type { UserResponse } from '../types/auth'

const AVATAR_COLORS = [
  '#1D9BF0', '#F4212E', '#00BA7C', '#FF7008', '#794BC4',
]

function avatarColor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

interface UserCardProps {
  user: UserResponse
  currentUserId: number
  onFollowToggle: (username: string, nowFollowing: boolean) => void
}

export default function UserCard({ user, currentUserId, onFollowToggle }: UserCardProps) {
  const navigate = useNavigate()
  const isOwn = user.id === currentUserId

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2,
        py: '12px',
        borderBottom: '1px solid #eff3f4',
        '&:hover': { bgcolor: '#f7f9f9' },
      }}
    >
      <Avatar
        src={user.avatarUrl ?? undefined}
        alt={user.displayName}
        onClick={() => navigate(`/users/${user.username}`)}
        sx={{
          width: 44,
          height: 44,
          bgcolor: avatarColor(user.displayName),
          fontSize: 17,
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        {user.displayName[0]}
      </Avatar>

      <Box
        sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
        onClick={() => navigate(`/users/${user.username}`)}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#0f1419', lineHeight: 1.3 }}>
          {user.displayName}
        </Typography>
        <Typography sx={{ fontSize: 14, color: '#536471' }}>
          @{user.username}
        </Typography>
        {user.bio && (
          <Typography sx={{ fontSize: 13, color: '#536471', mt: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.bio}
          </Typography>
        )}
      </Box>

      {!isOwn && (
        <Button
          variant={user.followedByMe ? 'contained' : 'outlined'}
          size="small"
          onClick={() => onFollowToggle(user.username, !user.followedByMe)}
          sx={{
            borderRadius: '9999px',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: 14,
            px: 2,
            flexShrink: 0,
            ...(user.followedByMe
              ? { bgcolor: '#0f1419', color: '#fff', borderColor: '#0f1419', '&:hover': { bgcolor: '#272c30' } }
              : { color: '#0f1419', borderColor: '#cfd9de', '&:hover': { bgcolor: 'rgba(15,20,25,0.1)', borderColor: '#cfd9de' } }
            ),
          }}
        >
          {user.followedByMe ? 'フォロー中' : 'フォローする'}
        </Button>
      )}
    </Box>
  )
}
