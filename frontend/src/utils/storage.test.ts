import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveAuth,
  getAccessToken,
  getRefreshToken,
  getUser,
  updateTokens,
  clearAuth,
  updateStoredUser,
  isAuthenticated,
} from './storage'
import type { AuthResponse, UserResponse } from '../types/auth'

const dummyUser: UserResponse = {
  id: 1,
  username: 'alice',
  displayName: 'Alice',
  avatarUrl: null,
  bio: null,
  followingCount: 0,
  followersCount: 0,
  followedByMe: false,
  createdAt: '2024-01-01T00:00:00Z',
}

const dummyAuth: AuthResponse = {
  token: 'access-token-abc',
  refreshToken: 'refresh-token-xyz',
  user: dummyUser,
}

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // ─── saveAuth / get ──────────────────────────────────────────────────

  it('saveAuth: アクセストークンが保存・取得できる', () => {
    saveAuth(dummyAuth)
    expect(getAccessToken()).toBe('access-token-abc')
  })

  it('saveAuth: リフレッシュトークンが保存・取得できる', () => {
    saveAuth(dummyAuth)
    expect(getRefreshToken()).toBe('refresh-token-xyz')
  })

  it('saveAuth: ユーザー情報が保存・取得できる', () => {
    saveAuth(dummyAuth)
    const user = getUser()
    expect(user).not.toBeNull()
    expect(user!.username).toBe('alice')
  })

  // ─── 未保存状態 ───────────────────────────────────────────────────────

  it('getAccessToken: 未保存の場合 null を返す（境界値: 0件）', () => {
    expect(getAccessToken()).toBeNull()
  })

  it('getUser: 未保存の場合 null を返す', () => {
    expect(getUser()).toBeNull()
  })

  // ─── isAuthenticated ──────────────────────────────────────────────────

  it('isAuthenticated: トークンあり → true', () => {
    saveAuth(dummyAuth)
    expect(isAuthenticated()).toBe(true)
  })

  it('isAuthenticated: トークンなし → false', () => {
    expect(isAuthenticated()).toBe(false)
  })

  // ─── updateTokens ─────────────────────────────────────────────────────

  it('updateTokens: アクセストークンが更新される', () => {
    saveAuth(dummyAuth)
    updateTokens('new-access', 'new-refresh')
    expect(getAccessToken()).toBe('new-access')
    expect(getRefreshToken()).toBe('new-refresh')
  })

  // ─── clearAuth ────────────────────────────────────────────────────────

  it('clearAuth: 全トークン・ユーザーが削除される', () => {
    saveAuth(dummyAuth)
    clearAuth()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    expect(getUser()).toBeNull()
  })

  it('clearAuth: 認証済み状態が解除される', () => {
    saveAuth(dummyAuth)
    clearAuth()
    expect(isAuthenticated()).toBe(false)
  })

  // ─── updateStoredUser ─────────────────────────────────────────────────

  it('updateStoredUser: ユーザー情報が上書きされる', () => {
    saveAuth(dummyAuth)
    const updated: UserResponse = { ...dummyUser, displayName: 'Alice Updated' }
    updateStoredUser(updated)
    expect(getUser()!.displayName).toBe('Alice Updated')
  })
})
