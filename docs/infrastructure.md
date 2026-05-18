# インフラ構成

## 1. 概要

AWS を利用したクラウドインフラを構築する。インフラの管理は Terraform（IaC）で行う。  
画像ストレージには AWS S3 を使用し、ロードバランサーとして ALB を配置する。

インフラコードの配置先: `infra/terraform/`

---

## 2. アーキテクチャ図

```
                          インターネット
                              │
                    ┌─────────────────┐
                    │   Internet GW   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  ALB            │  ← Public Subnet (10.0.1.0/24 / ap-northeast-1a)
                    │  (HTTP :80)     │     ※ 将来的に HTTPS :443 へ
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                                     │
┌─────────▼─────────┐               ┌───────────────────────┐
│  EC2 (t2.micro)   │               │  S3 Bucket            │
│  Amazon Linux 2023│               │  (画像ストレージ)      │
│  Nginx 1.28       │◀──IAMロール──▶│  - posts/{postId}/    │
│  Spring Boot :8080│               │  - avatars/{userId}/  │
└─────────┬─────────┘               └───────────────────────┘
          │ Private Subnet のみ接続可
          │
┌─────────▼─────────────────────────────────────────────────┐
│  RDS PostgreSQL 16 (db.t3.micro)                          │
│  Private Subnet (10.0.2.0/24, 10.0.3.0/24)               │
│  Multi-AZ: シングル AZ（学習用）                           │
└────────────────────────────────────────────────────────────┘
```

---

## 3. 使用 AWS サービス

| サービス | 用途 | 備考 |
|---|---|---|
| VPC | 仮想ネットワーク（10.0.0.0/16） | |
| Internet Gateway | VPC からインターネットへの出口 | |
| ALB（Application Load Balancer） | HTTP リクエストを EC2 へルーティング | Public Subnet に配置 |
| EC2（t2.micro） | アプリケーションサーバー（Nginx + Spring Boot） | Public Subnet に配置 |
| RDS（db.t3.micro, PostgreSQL 16） | マネージド DB | Private Subnet に配置、公開アクセス無効 |
| S3 | 投稿画像・アバター画像の保存 | バケットポリシーで非公開、EC2 から IAM ロールでアクセス |
| Security Group | EC2・RDS 間のポート制御 | |
| IAM Role | EC2 から S3 へのアクセス権限 | |

---

## 4. ネットワーク構成

| リソース | CIDR / AZ | 用途 |
|---|---|---|
| VPC | 10.0.0.0/16 | 全体ネットワーク |
| Public Subnet | 10.0.1.0/24 / ap-northeast-1a | ALB・EC2 配置 |
| Private Subnet 1 | 10.0.2.0/24 / ap-northeast-1a | RDS（プライマリ） |
| Private Subnet 2 | 10.0.3.0/24 / ap-northeast-1c | RDS（サブネットグループ用） |

---

## 5. セキュリティ設計

### EC2 セキュリティグループ

| ポート | プロトコル | 送信元 | 用途 |
|---|---|---|---|
| 22 | TCP | 管理者 IP のみ | SSH アクセス |
| 80 | TCP | 0.0.0.0/0 | ALB からの HTTP（将来: ALB SG のみに制限） |
| 8080 | TCP | ALB SG のみ | Spring Boot アクセス |

### RDS セキュリティグループ

| ポート | プロトコル | 送信元 | 用途 |
|---|---|---|---|
| 5432 | TCP | EC2 SG のみ | PostgreSQL アクセス |

**重要ポイント:**
- RDS は `publicly_accessible = false` とし、EC2 経由でのみアクセスする
- S3 バケットはパブリックアクセスをブロックし、EC2 の IAM ロール経由でのみ操作する
- `.tfstate` ファイルおよび `.pem` ファイルは `.gitignore` に追加する

---

## 6. EC2 サーバー構成

| 項目 | 内容 |
|---|---|
| AMI | Amazon Linux 2023 |
| インスタンスタイプ | t2.micro（AWS 無料枠対象） |
| Java | Amazon Corretto 21 |
| Web サーバー | Nginx 1.28（リバースプロキシ） |
| アプリ | Spring Boot 3.5.14（ポート 8080） |
| Node.js | 22 LTS（フロントエンドビルド用） |

**Nginx 設定（概要）:**
- `:80` でリクエストを受け、Spring Boot（`:8080`）へプロキシ
- React ビルド成果物（`/var/www/html`）をスタティック配信

---

## 7. RDS 構成

| 項目 | 内容 |
|---|---|
| エンジン | PostgreSQL 16 |
| インスタンスタイプ | db.t3.micro（AWS 無料枠対象） |
| ストレージ | 20GB gp2 |
| マルチ AZ | 無効（学習用、Single AZ） |
| 公開アクセス | 無効（publicly_accessible = false） |
| マイグレーション | Flyway（Spring Boot 起動時に自動実行） |

---

## 8. S3 構成

| 項目 | 内容 |
|---|---|
| バケットアクセス | プライベート（パブリックアクセスブロック有効） |
| アクセス方法 | EC2 に付与した IAM ロール経由 |
| ファイルパス規則 | `posts/{postId}/{uuid}.{ext}`、`avatars/{userId}/{uuid}.{ext}` |
| URL 公開 | Presigned URL（一時署名 URL）または CloudFront 経由で配信（将来検討） |

---

## 9. Terraform ファイル構成（想定）

```
infra/terraform/
├── main.tf          # プロバイダー設定・backend
├── variables.tf     # 変数定義
├── outputs.tf       # 出力値
├── vpc.tf           # VPC・サブネット・IGW・ルートテーブル
├── security.tf      # セキュリティグループ
├── ec2.tf           # EC2・Elastic IP・IAM ロール
├── rds.tf           # RDS・DB サブネットグループ・パラメータグループ
├── s3.tf            # S3 バケット・バケットポリシー
├── alb.tf           # ALB・ターゲットグループ・リスナー
└── user_data.sh     # EC2 初期化スクリプト
```

---

## 10. デプロイ手順（概要）

```bash
# 1. Terraform 初期化
cd infra/terraform
terraform init

# 2. 実行計画の確認
terraform plan

# 3. インフラの構築
terraform apply

# 4. フロントエンドビルド（ローカル）
cd frontend
npm run build

# 5. バックエンドビルド（ローカル）
cd backend
./gradlew build

# 6. EC2 へ転送・起動
scp -i <key.pem> ...  # ビルド成果物を EC2 へ転送

# 7. インフラの削除（費用節約）
terraform destroy
```

---

## 11. 注意事項

- Elastic IP は使用しない（EC2 再起動ごとに IP が変わることに注意）
- `.tfstate` および `.pem` は絶対に Git にコミットしない
- AWS 無料枠の制限（EC2 t2.micro 月 750h、RDS db.t3.micro 月 750h、S3 5GB）に注意する
- 現時点ではサーバー構成の最終確定が未定のため、必要に応じて Terraform 設定を変更する
