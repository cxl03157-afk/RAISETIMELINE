output "bucket_name" {
  description = "tfstate 用 S3 バケット名"
  value       = aws_s3_bucket.tfstate.bucket
}

output "dynamodb_table_name" {
  description = "tfstate ロック用 DynamoDB テーブル名"
  value       = aws_dynamodb_table.tfstate_lock.name
}

output "github_actions_role_arn" {
  description = "GitHub Actions 統合 IAM ロール ARN"
  value       = aws_iam_role.github_actions.arn
}
