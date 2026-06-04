variable "aws_region" {
  description = "AWS リージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "github_org" {
  description = "GitHub 組織またはユーザー名"
  type        = string
  default     = "cxl03157-afk"
}

variable "github_repo" {
  description = "GitHub リポジトリ名"
  type        = string
  default     = "RAISETIMELINE"
}
