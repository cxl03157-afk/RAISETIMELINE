data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_security_group" "alb" {
  name        = "raisetimeline-alb"
  description = "ALB: CloudFront からの HTTP のみ許可"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from CloudFront"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "raisetimeline-alb" }
}

resource "aws_security_group" "ecs" {
  name        = "raisetimeline-ecs"
  description = "ECS: ALB からの 8080 のみ許可"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "8080 from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "raisetimeline-ecs" }
}

resource "aws_security_group" "rds" {
  name        = "raisetimeline-rds"
  description = "RDS: ECS からの 5432 のみ許可"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  tags = { Name = "raisetimeline-rds" }
}
