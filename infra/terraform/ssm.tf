resource "aws_ssm_parameter" "db_url" {
  name  = "/raisetimeline/db_url"
  type  = "String"
  value = "jdbc:postgresql://${aws_db_instance.postgres.endpoint}/raisetimeline"
}

resource "aws_ssm_parameter" "db_username" {
  name  = "/raisetimeline/db_username"
  type  = "String"
  value = "raisetimeline_admin"
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/raisetimeline/db_password"
  type  = "SecureString"
  value = random_password.db_password.result
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/raisetimeline/jwt_secret"
  type  = "SecureString"
  value = random_password.jwt_secret.result
}
