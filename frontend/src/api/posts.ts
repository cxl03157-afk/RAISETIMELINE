import { fetchWithAuth } from './auth'
import type { PageResponse, PostResponse } from '../types/post'

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

export async function fetchTimeline(
  tab: 'all' | 'following',
  page: number,
  size = 20,
): Promise<PageResponse<PostResponse>> {
  const path = tab === 'following' ? '/api/posts/following' : '/api/posts'
  const res = await fetchWithAuth(`${path}?page=${page}&size=${size}`)
  return handleResponse<PageResponse<PostResponse>>(res)
}

export async function createPost(content: string): Promise<PostResponse> {
  const res = await fetchWithAuth('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  return handleResponse<PostResponse>(res)
}

export async function updatePost(
  postId: number,
  content: string,
): Promise<PostResponse> {
  const res = await fetchWithAuth(`/api/posts/${postId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  return handleResponse<PostResponse>(res)
}

export async function deletePost(postId: number): Promise<void> {
  const res = await fetchWithAuth(`/api/posts/${postId}`, { method: 'DELETE' })
  return handleResponse<void>(res)
}
