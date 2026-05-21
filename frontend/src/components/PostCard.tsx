import { useState } from 'react'
import {
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import type { PostResponse } from '../types/post'
import { formatRelativeTime } from '../utils/formatTime'
import ImageGrid from './ImageGrid'

const AVATAR_COLORS = [
  '#1D9BF0', '#F4212E', '#00BA7C', '#FF7008', '#794BC4',
]

function avatarColor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

interface PostCardProps {
  post: PostResponse
  currentUserId: number
  onEdit: (post: PostResponse) => void
  onDelete: (post: PostResponse) => void
}

export default function PostCard({ post, currentUserId, onEdit, onDelete }: PostCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const isOwn = post.user.id === currentUserId

  return (
    <Box
      sx={{
        display: 'flex',
        gap: '12px',
        px: 2,
        py: '14px',
        borderBottom: '1px solid #eff3f4',
        '&:hover': { bgcolor: '#f7f9f9' },
      }}
    >
      {/* アバター */}
      <Avatar
        src={post.user.avatarUrl ?? undefined}
        alt={post.user.displayName}
        sx={{
          width: 40,
          height: 40,
          bgcolor: avatarColor(post.user.displayName),
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {post.user.displayName[0]}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* ヘッダー行 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexWrap: 'wrap',
            mb: '2px',
          }}
        >
          <Typography
            component="span"
            sx={{ fontWeight: 700, fontSize: 15, color: '#0f1419', whiteSpace: 'nowrap' }}
          >
            {post.user.displayName}
          </Typography>
          <Typography
            component="span"
            sx={{ fontSize: 14, color: '#536471', whiteSpace: 'nowrap' }}
          >
            @{post.user.username}
          </Typography>
          <Typography component="span" sx={{ fontSize: 14, color: '#536471' }}>
            ·
          </Typography>
          <Typography component="span" sx={{ fontSize: 14, color: '#536471', whiteSpace: 'nowrap' }}>
            {formatRelativeTime(post.createdAt)}
          </Typography>

          {/* 「...」メニュー（自分の投稿のみ） */}
          {isOwn && (
            <Box sx={{ ml: 'auto' }}>
              <IconButton
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{ color: '#536471', p: '4px' }}
              >
                <MoreHorizIcon fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem
                  onClick={() => { setAnchorEl(null); onEdit(post) }}
                  sx={{ fontSize: 14 }}
                >
                  編集
                </MenuItem>
                <MenuItem
                  onClick={() => { setAnchorEl(null); onDelete(post) }}
                  sx={{ fontSize: 14, color: '#f4212e' }}
                >
                  削除
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>

        {/* 本文 */}
        <Typography
          sx={{
            fontSize: 15,
            lineHeight: 1.5,
            color: '#0f1419',
            wordBreak: 'break-word',
            mb: post.imageUrls.length > 0 ? 0 : 1,
          }}
        >
          {post.content}
        </Typography>

        {/* 画像グリッド */}
        {post.imageUrls.length > 0 && (
          <ImageGrid imageUrls={post.imageUrls} />
        )}

        {/* アクション（表示のみ） */}
        <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#536471',
              fontSize: 13,
              pointerEvents: 'none',
            }}
          >
            <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 18 }} />
            <span>{post.commentCount}</span>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#536471',
              fontSize: 13,
              pointerEvents: 'none',
            }}
          >
            <FavoriteBorderIcon sx={{ fontSize: 18 }} />
            <span>{post.likeCount}</span>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
