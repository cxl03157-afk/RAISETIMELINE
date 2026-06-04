resource "aws_db_subnet_group" "main" {
  name       = "raisetimeline"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_c.id]

  tags = { Name = "raisetimeline" }
}

resource "aws_db_instance" "postgres" {
  identifier             = "raisetimeline"
  engine                 = "postgres"
  engine_version         = "17"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  storage_type           = "gp2"
  db_name                = "raisetimeline"
  username               = "raisetimeline_admin"
  password               = random_password.db_password.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az                = false
  publicly_accessible     = false
  backup_retention_period = 0
  deletion_protection     = false
  skip_final_snapshot     = true

  tags = { Name = "raisetimeline" }
}
