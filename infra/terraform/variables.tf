variable "aws_region" {
  description = "AWS リージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "allowed_ipv4" {
  description = "CloudFront 許可 IPv4（curl -4 -s ifconfig.me で確認）"
  type        = string
}

variable "allowed_ipv6" {
  description = "CloudFront 許可 IPv6（curl -s ifconfig.me で確認。IPv6 不要なら空文字可）"
  type        = string
  default     = ""
}
