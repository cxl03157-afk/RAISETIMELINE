import { fetchWithAuth } from './auth'
import type { CommentResponse } from '../types/comment'

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

export async function fetchComments(postId: number): Promise<CommentResponse[]> {
  const res = await fetchWithAuth(`/api/posts/${postId}/comments`)
  return handleResponse<CommentResponse[]>(res)
}

export async function createComment(postId: number, content: string): Promise<CommentResponse> {
  const res = await fetchWithAuth(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  return handleResponse<CommentResponse>(res)
}

export async function deleteComment(postId: number, commentId: number): Promise<void> {
  const res = await fetchWithAuth(`/api/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  })
  return handleResponse<void>(res)
}
