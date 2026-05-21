export interface PostAuthor {
  id: number
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  createdAt: string
}

export interface PostResponse {
  id: number
  content: string
  user: PostAuthor
  imageUrls: string[]
  likeCount: number
  commentCount: number
  createdAt: string
  updatedAt: string | null
}

export interface PageResponse<T> {
  content: T[]
  last: boolean
  number: number
  totalElements: number
}
