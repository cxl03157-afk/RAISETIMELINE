import { fetchWithAuth } from './auth'
import type { UserResponse } from '../types/auth'
import type { PageResponse } from '../types/post'
import type { PostResponse } from '../types/post'

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204 || res.status === 201) return undefined as T
    return res.json() as Promise<T>
  }
  let message = `エラーが発生しました (${res.status})`
  try {
    const body = await res.json()
    if (body?.message) message = body.message
  } catch { /* ignore */ }
  throw new Error(message)
}

export async function getUserProfile(username: string): Promise<UserResponse> {
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(username)}`)
  return handleResponse<UserResponse>(res)
}

export async function updateProfile(displayName: string, bio: string): Promise<UserResponse> {
  const res = await fetchWithAuth('/api/users/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, bio }),
  })
  return handleResponse<UserResponse>(res)
}

export async function searchUsers(query: string): Promise<UserResponse[]> {
  const res = await fetchWithAuth(`/api/users/search?q=${encodeURIComponent(query)}`)
  return handleResponse<UserResponse[]>(res)
}

export async function followUser(username: string): Promise<void> {
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(username)}/follow`, {
    method: 'POST',
  })
  return handleResponse<void>(res)
}

export async function unfollowUser(username: string): Promise<void> {
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(username)}/follow`, {
    method: 'DELETE',
  })
  return handleResponse<void>(res)
}

export async function getFollowing(username: string, page: number, size = 20): Promise<PageResponse<UserResponse>> {
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(username)}/following?page=${page}&size=${size}`)
  return handleResponse<PageResponse<UserResponse>>(res)
}

export async function getFollowers(username: string, page: number, size = 20): Promise<PageResponse<UserResponse>> {
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(username)}/followers?page=${page}&size=${size}`)
  return handleResponse<PageResponse<UserResponse>>(res)
}

export async function getUserPosts(username: string): Promise<PostResponse[]> {
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(username)}/posts`)
  return handleResponse<PostResponse[]>(res)
}

export async function uploadAvatar(file: File): Promise<UserResponse> {
  const formData = new FormData()
  formData.append('avatar', file)
  const res = await fetchWithAuth('/api/users/me/avatar', { method: 'PUT', body: formData })
  return handleResponse<UserResponse>(res)
}
