import { fetchWithAuth } from './auth'

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

export async function likePost(postId: number): Promise<void> {
  const res = await fetchWithAuth(`/api/posts/${postId}/likes`, { method: 'POST' })
  return handleResponse<void>(res)
}

export async function unlikePost(postId: number): Promise<void> {
  const res = await fetchWithAuth(`/api/posts/${postId}/likes`, { method: 'DELETE' })
  return handleResponse<void>(res)
}
