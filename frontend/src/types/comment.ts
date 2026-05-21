export interface CommentAuthor {
  id: number
  username: string
  displayName: string
  avatarUrl: string | null
}

export interface CommentResponse {
  id: number
  content: string
  user: CommentAuthor
  createdAt: string
}
