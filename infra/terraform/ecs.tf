resource "aws_ecs_cluster" "main" {
  name = "raisetimeline"

  setting {
    name  = "containerInsights"
    value = "disabled"
  }
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "raisetimeline-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "backend"
    image     = "${aws_ecr_repository.backend.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = 8080
      hostPort      = 8080
      protocol      = "tcp"
    }]

    environment = [
      { name = "SPRING_PROFILES_ACTIVE", value = "production" },
      { name = "AWS_S3_BUCKET", value = aws_s3_bucket.images.bucket },
    ]

    secrets = [
      { name = "SPRING_DATASOURCE_URL", valueFrom = aws_ssm_parameter.db_url.arn },
      { name = "SPRING_DATASOURCE_USERNAME", valueFrom = aws_ssm_parameter.db_username.arn },
      { name = "SPRING_DATASOURCE_PASSWORD", valueFrom = aws_ssm_parameter.db_password.arn },
      { name = "JWT_SECRET", valueFrom = aws_ssm_parameter.jwt_secret.arn },
    ]

    healthCheck = {
      command     = ["CMD-SHELL", "curl -sf http://localhost:8080/actuator/health | grep -q UP || exit 1"]
      interval    = 30
      timeout     = 10
      retries     = 3
      startPeriod = 180
    }

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs_backend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  # CD パイプラインが image タグを更新するため container_definitions の変更は無視する
  lifecycle {
    ignore_changes = [container_definitions]
  }
}

resource "aws_ecs_service" "backend" {
  name            = "raisetimeline-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  network_configuration {
    subnets          = [aws_subnet.private_a.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8080
  }

  # CD パイプラインが task_definition を更新するため変更は無視する
  lifecycle {
    ignore_changes = [task_definition]
  }

  depends_on = [aws_lb_listener.http]
}
