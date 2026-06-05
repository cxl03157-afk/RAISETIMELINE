resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "raisetimeline-frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_function" "ip_allowlist" {
  name    = "raisetimeline-ip-allowlist"
  runtime = "cloudfront-js-2.0"
  publish = true
  code = templatefile("${path.module}/cf_functions/ip_allowlist.js.tftpl", {
    allowed_ipv4 = var.allowed_ipv4
    allowed_ipv6 = var.allowed_ipv6
  })
}

locals {
  cache_disabled         = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
  cache_optimized        = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
  origin_request_no_host = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # AllViewerExceptHostHeader
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_200"

  # S3 フロントエンド Origin
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # ALB バックエンド Origin
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "alb-backend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # /api/* → ALB（キャッシュなし、全ヘッダー転送）
  ordered_cache_behavior {
    path_pattern             = "/api/*"
    target_origin_id         = "alb-backend"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = local.cache_disabled
    origin_request_policy_id = local.origin_request_no_host

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.ip_allowlist.arn
    }
  }

  # /assets/* → S3（Vite content-hash 付きファイル、長期キャッシュ）
  ordered_cache_behavior {
    path_pattern           = "/assets/*"
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = local.cache_optimized

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.ip_allowlist.arn
    }
  }

  # /* → S3（デフォルト、index.html は S3 の Cache-Control: no-cache に従う）
  default_cache_behavior {
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = local.cache_disabled

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.ip_allowlist.arn
    }
  }

  # SPA フォールバック（React Router ディープリンク対応）
  # 注意: IP制限の403はCloudFront Functionが返すため custom_error_response より前に処理される
  custom_error_response {
    error_code            = 404
    response_page_path    = "/index.html"
    response_code         = 200
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 403
    response_page_path    = "/index.html"
    response_code         = 200
    error_caching_min_ttl = 0
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
