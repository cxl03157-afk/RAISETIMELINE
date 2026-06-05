# インフラ構成

## 1. 概要

AWS を利用したクラウドインフラを構築する。インフラの管理は Terraform（IaC）で行う。

- **フロントエンド:** CloudFront + S3 による静的配信（SPA）
- **バックエンド:** ECS Fargate によるコンテナ化された Spring Boot アプリケーション
- **データベース:** RDS PostgreSQL（マネージド）
- **画像ストレージ:** S3 + Presigned URL

インフラコードの配置先: `infra/terraform/`

---

## 2. アーキテクチャ図

```
                         インターネット
                              │
                    ┌─────────────────┐
                    │   CloudFront    │  ← IP 許可リスト（CloudFront Function）
                    │  (HTTPS/HTTP)   │     PriceClass_200
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
   /api/* → ALB                   /* → S3 (フロントエンド)
              │                             │
    ┌─────────▼─────────┐       ┌───────────▼───────────┐
    │  ALB (HTTP :80)   │       │  S3 Bucket            │
    │  (Public Subnet)  │       │  (フロントエンド静的)  │
    └─────────┬─────────┘       │  CloudFront OAC のみ  │
              │                 └───────────────────────┘
    ┌─────────▼─────────┐
    │  ECS Fargate      │  ← Private Subnet (ap-northeast-1a)
    │  (Spring Boot)    │     CPU: 256 / Memory: 1024MB
    │  ポート :8080     │     desired: 1 タスク
    └─────────┬─────────┘
              │ NAT Gateway 経由でインターネットへ（ECR pull など）
    ┌─────────▼─────────────────────────────────────────┐
    │  RDS PostgreSQL 17 (db.t3.micro)                  │
    │  Private Subnet (ap-northeast-1a / 1c)            │
    │  Multi-AZ: 無効（学習用）                          │
    └───────────────────────────────────────────────────┘

    ┌───────────────────────────────────┐
    │  S3 Bucket（画像ストレージ）      │
    │  - posts/{postId}/{uuid}.{ext}    │
    │  - avatars/{userId}/{uuid}.{ext}  │
    │  ECS タスクロール経由でアクセス   │
    └───────────────────────────────────┘
```

---

## 3. 使用 AWS サービス

| サービス | 用途 | 備考 |
|---|---|---|
| CloudFront | フロントエンド配信・API プロキシ・IP 制限 | PriceClass_200、CloudFront Function で IP 許可リスト |
| S3（フロントエンド） | React ビルド成果物の静的ホスティング | CloudFront OAC のみアクセス可 |
| ALB（Application Load Balancer） | HTTP リクエストを ECS タスクへルーティング | Public Subnet に配置 |
| ECS Fargate | バックエンドコンテナの実行 | Private Subnet、CPU 256 / Memory 1024MB |
| ECR | Docker イメージのレジストリ | イメージタグ: latest（MUTABLE） |
| RDS（db.t3.micro, PostgreSQL 17） | マネージド DB | Private Subnet、公開アクセス無効 |
| S3（画像） | 投稿画像・アバター画像の保存 | Presigned URL で一時公開 |
| CloudWatch Logs | ECS コンテナログの収集 | `/ecs/raisetimeline-backend` |
| SSM Parameter Store | DB 接続情報・JWT シークレットの管理 | ECS タスク起動時に注入 |
| NAT Gateway | ECS からインターネットへの送信（ECR pull など） | Public Subnet に配置 |
| VPC | 仮想ネットワーク（10.0.0.0/16） | |
| Security Group | ECS・RDS・ALB 間のポート制御 | |
| IAM Role | ECS タスクロール（S3 アクセス）・実行ロール（SSM・ECR） | |

---

## 4. ネットワーク構成

| リソース | CIDR | AZ | 用途 |
|---|---|---|---|
| VPC | 10.0.0.0/16 | - | 全体ネットワーク |
| Public Subnet A | 10.0.1.0/24 | ap-northeast-1a | ALB・NAT Gateway 配置 |
| Public Subnet C | 10.0.2.0/24 | ap-northeast-1c | ALB（マルチ AZ 用） |
| Private Subnet A | 10.0.3.0/24 | ap-northeast-1a | ECS タスク・RDS（プライマリ） |
| Private Subnet C | 10.0.4.0/24 | ap-northeast-1c | RDS（サブネットグループ用） |

**ルーティング:**
- Public Subnet → Internet Gateway（直接インターネット通信）
- Private Subnet → NAT Gateway（送信のみ、ECS が ECR から pull する際に使用）

---

## 5. セキュリティ設計

### CloudFront

| 機能 | 内容 |
|---|---|
| IP 許可リスト | CloudFront Function（`cf_functions/`）によるアクセス制御 |
| S3 アクセス | OAC（Origin Access Control）経由のみ許可 |
| ALB 直接アクセス | CloudFront の IP レンジのみ ALB へのアクセスを許可（Security Group で制御） |

### ALB セキュリティグループ

| ポート | プロトコル | 送信元 | 用途 |
|---|---|---|---|
| 80 | TCP | CloudFront マネージドプレフィックスリスト | CloudFront からの HTTP のみ許可 |

### ECS セキュリティグループ

| ポート | プロトコル | 送信元 | 用途 |
|---|---|---|---|
| 8080 | TCP | ALB SG のみ | Spring Boot へのアクセス |

### RDS セキュリティグループ

| ポート | プロトコル | 送信元 | 用途 |
|---|---|---|---|
| 5432 | TCP | ECS SG のみ | PostgreSQL アクセス |

**重要ポイント:**
- RDS は `publicly_accessible = false`、ECS 経由でのみアクセス
- S3 はパブリックアクセスをブロック、ECS タスクロール経由でのみ操作
- `.tfstate` ファイルは `.gitignore` に追加し Git にコミットしない
- Terraform state は S3 backend（リモート管理）を使用

---

## 6. ECS Fargate 構成

| 項目 | 内容 |
|---|---|
| クラスター | raisetimeline |
| タスク定義 | raisetimeline-backend |
| CPU | 256 (0.25 vCPU) |
| Memory | 1024 MB |
| ネットワークモード | awsvpc |
| 起動タイプ | FARGATE |
| 希望タスク数 | 1 |
| コンテナイメージ | ECR リポジトリ（`:latest`） |
| ヘルスチェック | `/actuator/health`（startPeriod: 180s） |
| ログ | CloudWatch Logs（`/ecs/raisetimeline-backend`） |
| 設定注入 | SSM Parameter Store 経由（DB 接続情報・JWT シークレット） |

**デプロイ設定:**

| 項目 | 値 | 理由 |
|---|---|---|
| `deployment_minimum_healthy_percent` | 100 | デプロイ中もダウンタイムなし |
| `deployment_maximum_percent` | 200 | 新旧タスクを一時並走 |
| `health_check_grace_period_seconds` | 200 | Spring Boot 起動（約 136 秒）中の ALB ヘルスチェック失敗を無視 |

---

## 7. CloudFront 構成

| 項目 | 内容 |
|---|---|
| Price Class | PriceClass_200（日本・北米・欧州） |
| オリジン 1 | S3（フロントエンド静的ファイル）← OAC |
| オリジン 2 | ALB（`/api/*` パスのみ転送） |
| IP 制限 | CloudFront Function による許可リスト方式 |
| SPA フォールバック | 404/403 エラー → `/index.html` にリダイレクト |

**キャッシュポリシー:**

| パス | ポリシー | 理由 |
|---|---|---|
| `/api/*` | キャッシュ無効（Cache-Disabled） | API レスポンスをキャッシュしない |
| `/assets/*` | キャッシュ最適化（Cache-Optimized） | ハッシュ付き静的ファイルは長期キャッシュ |
| `/*`（デフォルト） | キャッシュ無効 | `index.html` をキャッシュしない |

---

## 8. RDS 構成

| 項目 | 内容 |
|---|---|
| エンジン | PostgreSQL 17 |
| インスタンスタイプ | db.t3.micro |
| ストレージ | 20GB gp2 |
| マルチ AZ | 無効（学習用、Single AZ） |
| 公開アクセス | 無効（`publicly_accessible = false`） |
| マイグレーション | Flyway（Spring Boot 起動時に自動実行） |
| 認証情報管理 | SSM Parameter Store（`/raisetimeline/db_*`） |

---

## 9. S3 構成

### 画像ストレージ

| 項目 | 内容 |
|---|---|
| バケットアクセス | プライベート（パブリックアクセスブロック有効） |
| アクセス方法 | ECS タスクロール経由（IAM ロール） |
| ファイルパス規則 | `posts/{postId}/{uuid}.{ext}`、`avatars/{userId}/{uuid}.{ext}` |
| URL 公開 | Presigned URL（有効期限 60 分） |

### フロントエンド静的ファイル

| 項目 | 内容 |
|---|---|
| バケットアクセス | プライベート（CloudFront OAC 経由のみ） |
| デプロイ | GitHub Actions が `aws s3 sync` で自動デプロイ |

---

## 10. Terraform ファイル構成

```
infra/terraform/
├── main.tf          # プロバイダー設定・S3 backend
├── variables.tf     # 変数定義
├── outputs.tf       # 出力値（CloudFront URL・ALB DNS・ECR URL など）
├── vpc.tf           # VPC・サブネット・IGW・NAT Gateway・ルートテーブル
├── security.tf      # セキュリティグループ（ALB・ECS・RDS）
├── alb.tf           # ALB・ターゲットグループ・リスナー
├── ecr.tf           # ECR リポジトリ・ライフサイクルポリシー
├── ecs.tf           # ECS クラスター・タスク定義・サービス
├── rds.tf           # RDS・DB サブネットグループ
├── s3.tf            # S3 バケット（画像・フロントエンド）・バケットポリシー
├── cloudfront.tf    # CloudFront ディストリビューション・OAC
├── iam.tf           # IAM ロール（ECS 実行ロール・タスクロール）
├── ssm.tf           # SSM Parameter Store（DB 接続情報・JWT シークレット）
├── logs.tf          # CloudWatch Log Group
├── random.tf        # ランダムパスワード生成
└── cf_functions/    # CloudFront Function（IP 許可リスト）
    └── ip_allowlist.js
```

---

## 11. CI/CD パイプライン

### バックエンドデプロイ（`.github/workflows/cd-backend.yml`）

```
main ブランチへの push
  ↓
Docker ビルド（Amazon Corretto 25-al2023）
  ↓
ECR へ push（:latest タグ）
  ↓
ECS タスク定義を新バージョンで登録
  ↓
ECS サービスを新タスク定義で更新
（wait-for-service-stability: false → 完了待ちなし）
```

### フロントエンドデプロイ（`.github/workflows/cd-frontend.yml`）

```
main ブランチへの push
  ↓
npm run build（Vite）
  ↓
aws s3 sync → S3 バケットへアップロード
  ↓
CloudFront キャッシュ無効化（/*）
```

---

## 12. デプロイ手順

### 初回インフラ構築

```bash
cd infra/terraform

# 1. 初期化（S3 backend 設定）
terraform init -backend-config="bucket=<tfstate-bucket>" \
               -backend-config="key=raisetimeline/terraform.tfstate" \
               -backend-config="region=ap-northeast-1"

# 2. 実行計画の確認
terraform plan -var-file=terraform.tfvars

# 3. インフラの構築（apply 成功を確認してから PR をマージする）
terraform apply -var-file=terraform.tfvars
```

### バックエンド手動デプロイ（緊急時）

```bash
# ECR ログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin <ECR_URL>

# Docker ビルド & push
docker build -t raisetimeline-backend:latest ./backend
docker tag raisetimeline-backend:latest <ECR_URL>:latest
docker push <ECR_URL>:latest

# ECS サービス強制更新
aws ecs update-service \
  --cluster raisetimeline \
  --service raisetimeline-backend \
  --force-new-deployment
```

### ECS デプロイ競合の解消

```bash
# 複数の ACTIVE デプロイが競合している場合
aws ecs update-service \
  --cluster raisetimeline \
  --service raisetimeline-backend \
  --force-new-deployment \
  --deployment-configuration minimumHealthyPercent=0

# デプロイ状況の確認
aws ecs describe-services \
  --cluster raisetimeline \
  --services raisetimeline-backend \
  --query 'services[0].{running:runningCount,deployments:deployments[*].{status:status,running:runningCount,taskDef:taskDefinition}}'
```

---

## 13. 注意事項

- `.tfstate` は絶対に Git にコミットしない（S3 backend でリモート管理）
- AWS 無料枠の制限に注意: ECS Fargate（vCPU・GB-時間）、RDS db.t3.micro（月 750h）、S3（5GB）
- ECS デプロイ後、Spring Boot の起動に約 136 秒かかる（`health_check_grace_period_seconds=200` で対応済み）
- Terraform の `lifecycle { ignore_changes = [container_definitions] }` により、CD パイプラインが更新する Docker イメージは Terraform 管理外
- インフラ変更は `terraform apply` の成功を確認してから PR をマージする
