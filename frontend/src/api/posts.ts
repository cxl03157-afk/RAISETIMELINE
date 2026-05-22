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

export async function createPost(content: string, images: File[] = []): Promise<PostResponse> {
  const formData = new FormData()
  formData.append('content', content.trim())
  images.forEach(img => formData.append('images', img))
  // Content-Type は指定しない → ブラウザが multipart/form-data + boundary を自動設定
  const res = await fetchWithAuth('/api/posts', {
    method: 'POST',
    body: formData,
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

export async function getPost(postId: number): Promise<PostResponse> {
  const res = await fetchWithAuth(`/api/posts/${postId}`)
  return handleResponse<PostResponse>(res)
}

export async function deletePost(postId: number): Promise<void> {
  const res = await fetchWithAuth(`/api/posts/${postId}`, { method: 'DELETE' })
  return handleResponse<void>(res)
}
