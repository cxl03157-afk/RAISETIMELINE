resource "aws_cloudwatch_log_group" "ecs_backend" {
  name              = "/ecs/raisetimeline-backend"
  retention_in_days = 7
}
