import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import UserCard from './UserCard'
import type { UserResponse } from '../types/auth'

const baseUser: UserResponse = {
  id: 2,
  username: 'bob',
  displayName: 'Bob',
  avatarUrl: null,
  bio: null,
  followingCount: 0,
  followersCount: 0,
  followedByMe: false,
  createdAt: '2024-01-01T00:00:00Z',
}

function renderCard(overrides: Partial<UserResponse> = {}, currentUserId = 1) {
  const user = { ...baseUser, ...overrides }
  return render(
    <MemoryRouter>
      <UserCard user={user} currentUserId={currentUserId} onFollowToggle={vi.fn()} />
    </MemoryRouter>
  )
}

describe('UserCard', () => {
  it('ユーザー名・displayName が表示される', () => {
    renderCard()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('@bob')).toBeInTheDocument()
  })

  it('未フォローユーザー → 「フォローする」ボタン表示', () => {
    renderCard({ followedByMe: false })
    expect(screen.getByRole('button', { name: 'フォローする' })).toBeInTheDocument()
  })

  it('フォロー済みユーザー → 「フォロー中」ボタン表示', () => {
    renderCard({ followedByMe: true })
    expect(screen.getByRole('button', { name: 'フォロー中' })).toBeInTheDocument()
  })

  it('自分のカード (currentUserId === user.id) → フォローボタンが表示されない', () => {
    renderCard({}, 2) // user.id === currentUserId === 2
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('フォローボタンクリック → onFollowToggle が呼ばれる', async () => {
    const onFollowToggle = vi.fn()
    const user = { ...baseUser, followedByMe: false }
    render(
      <MemoryRouter>
        <UserCard user={user} currentUserId={1} onFollowToggle={onFollowToggle} />
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('button', { name: 'フォローする' }))
    expect(onFollowToggle).toHaveBeenCalledWith('bob', true)
  })

  it('bio がある場合、bio が表示される', () => {
    renderCard({ bio: '自己紹介文' })
    expect(screen.getByText('自己紹介文')).toBeInTheDocument()
  })
})
