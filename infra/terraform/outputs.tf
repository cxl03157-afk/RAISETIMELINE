output "cloudfront_url" {
  description = "CloudFront URL"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID（cd-frontend.yml の invalidation 用）"
  value       = aws_cloudfront_distribution.main.id
}

output "frontend_bucket_name" {
  description = "フロントエンド S3 バケット名"
  value       = aws_s3_bucket.frontend.bucket
}

output "alb_dns_name" {
  description = "ALB DNS 名（直接アクセスは CloudFront 経由のみ許可）"
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "ECR リポジトリ URL（cd-backend.yml の docker push 用）"
  value       = aws_ecr_repository.backend.repository_url
}
