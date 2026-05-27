import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PostCard from './PostCard'
import type { PostResponse } from '../types/post'

const basePost: PostResponse = {
  id: 1,
  content: 'テスト投稿内容',
  user: {
    id: 2,
    username: 'alice',
    displayName: 'Alice',
    avatarUrl: null,
    bio: null,
    createdAt: '2024-01-01T00:00:00Z',
  },
  imageUrls: [],
  likeCount: 5,
  commentCount: 2,
  likedByCurrentUser: false,
  createdAt: new Date().toISOString(),
  updatedAt: null,
}

interface RenderOptions {
  post?: Partial<PostResponse>
  currentUserId?: number
}

function renderCard(opts: RenderOptions = {}) {
  const post = { ...basePost, ...opts.post }
  const currentUserId = opts.currentUserId ?? 1
  return render(
    <MemoryRouter>
      <PostCard
        post={post}
        currentUserId={currentUserId}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onLike={vi.fn()}
        onCommentClick={vi.fn()}
      />
    </MemoryRouter>
  )
}

describe('PostCard', () => {
  it('投稿内容が表示される', () => {
    renderCard()
    expect(screen.getByText('テスト投稿内容')).toBeInTheDocument()
  })

  it('自分の投稿 → 「...」メニューボタンが存在する（MoreHorizIcon）', () => {
    renderCard({ currentUserId: 2 }) // post.user.id === 2
    // comment + like + (...) = 3 ボタン
    expect(screen.getAllByRole('button')).toHaveLength(3)
    expect(screen.getByTestId('MoreHorizIcon')).toBeInTheDocument()
  })

  it('他人の投稿 → 「...」メニューボタンが存在しない（デシジョンテーブル）', () => {
    renderCard({ currentUserId: 99 })
    // comment + like のみ = 2 ボタン
    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(screen.queryByTestId('MoreHorizIcon')).not.toBeInTheDocument()
  })

  it('likedByCurrentUser=false → FavoriteBorder アイコン（アウトライン）', () => {
    renderCard({ post: { likedByCurrentUser: false } })
    expect(screen.queryByTestId('FavoriteIcon')).not.toBeInTheDocument()
  })

  it('likedByCurrentUser=true → Favorite アイコン（塗りつぶし）', () => {
    renderCard({ post: { likedByCurrentUser: true } })
    expect(screen.getByTestId('FavoriteIcon')).toBeInTheDocument()
  })

  it('いいねクリック → onLike が呼ばれる', async () => {
    const onLike = vi.fn()
    const post = { ...basePost }
    render(
      <MemoryRouter>
        <PostCard
          post={post}
          currentUserId={1}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onLike={onLike}
          onCommentClick={vi.fn()}
        />
      </MemoryRouter>
    )
    // likeCount の数値 "5" のそばのボタン（いいねボタン）をクリック
    const likeCount = screen.getByText('5')
    await userEvent.click(likeCount.closest('button')!)
    expect(onLike).toHaveBeenCalledWith(post)
  })

  it('コメントクリック → onCommentClick が呼ばれる', async () => {
    const onCommentClick = vi.fn()
    const post = { ...basePost }
    render(
      <MemoryRouter>
        <PostCard
          post={post}
          currentUserId={1}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onLike={vi.fn()}
          onCommentClick={onCommentClick}
        />
      </MemoryRouter>
    )
    const commentCount = screen.getByText('2')
    await userEvent.click(commentCount.closest('button')!)
    expect(onCommentClick).toHaveBeenCalledWith(post)
  })

  it('いいね数・コメント数が表示される', () => {
    renderCard()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
