variable "aws_region" {
  description = "AWS リージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "allowed_ip" {
  description = "CloudFront アクセスを許可する自PCのパブリックIP（例: 1.2.3.4）。curl -s ifconfig.me で確認"
  type        = string
}
