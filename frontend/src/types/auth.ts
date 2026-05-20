export interface UserResponse {
  id: number
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  createdAt: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: UserResponse
}
