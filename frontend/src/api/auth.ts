import type { AuthResponse } from '../types/auth'
import { getAccessToken, getRefreshToken, updateTokens, clearAuth } from '../utils/storage'

export interface RegisterData {
  username: string
  displayName: string
  email: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  }
  let message = `エラーが発生しました (${res.status})`
  try {
    const body = await res.json()
    if (body?.message) message = body.message
  } catch { /* ignore */ }
  throw new Error(message)
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<AuthResponse>(res)
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<AuthResponse>(res)
}

export async function logout(refreshToken: string): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
}

export async function refreshTokens(): Promise<AuthResponse> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('リフレッシュトークンがありません')
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  return handleResponse<AuthResponse>(res)
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  let res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    try {
      const refreshed = await refreshTokens()
      updateTokens(refreshed.token, refreshed.refreshToken)
      const retryHeaders: HeadersInit = {
        ...(options.headers as Record<string, string>),
        Authorization: `Bearer ${refreshed.token}`,
      }
      res = await fetch(url, { ...options, headers: retryHeaders })
    } catch {
      clearAuth()
      window.location.href = '/login'
      throw new Error('セッションが切れました。再ログインしてください。')
    }
  }

  return res
}

