# RAISETIMELINE

X/Twitter 類似のシンプルなタイムライン SNS アプリ。React + Spring Boot + AWS で構築する学習目的プロジェクト。  
テキスト投稿・画像添付・いいね・コメント・フォローといった SNS の基本機能を、複数ユーザーが利用できる環境で実装する。

インプレッション表示・リツイートは意図的にスコープ外とし、シンプルな構成を維持している。

## 機能概要

| カテゴリ | 機能 |
|---------|------|
| 認証 | ユーザー登録・ログイン・ログアウト（JWT + リフレッシュトークン） |
| タイムライン | 全体表示・フォロー中表示をタブで切り替え・新着通知バナー（ポーリング） |
| 投稿 | テキスト投稿（最大 280 文字）・画像添付（最大 4 枚、AWS S3 保存）・編集・削除 |
| コメント | コメント投稿・削除・コメント数表示 |
| いいね | いいね・取り消し・いいね数表示 |
| フォロー | フォロー・解除・フォロー中 / フォロワー一覧 |
| ユーザー検索 | ユーザー名（部分一致）で検索・フォロー状態を表示 |
| プロフィール | アバター画像・表示名・自己紹介の表示と編集 |

機能の詳細定義は [docs/features.md](docs/features.md) を参照。

## 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|----------|
| 言語（バックエンド） | Java (Amazon Corretto) | 25 |
| バックエンド | Spring Boot | 4.0.6 |
| ビルドツール | Gradle | 9.5.0 |
| 認証 | Spring Security + JWT (jjwt) | Spring Boot 同梱 |
| DB マイグレーション | Flyway | Spring Boot 同梱 |
| 画像ストレージ | AWS SDK for Java v2 (S3) | 最新安定版 |
| API ドキュメント | SpringDoc OpenAPI (Swagger UI) | 最新安定版 |
| 言語（フロントエンド） | TypeScript | 6.0.2 |
| UI フレームワーク | React | 19.2.6 |
| フロントエンドビルド | Vite | 8.0.12 |
| UI コンポーネント | Material UI | 9.0.1 |
| データベース | PostgreSQL | 17 |
| コンテナ | Docker (Amazon Corretto 25-al2023) | — |
| インフラ | AWS ECS Fargate / RDS / ALB / S3 / CloudFront | — |
| IaC | Terraform | >= 1.6 |

採用理由・詳細は [docs/tech-stack.md](docs/tech-stack.md) を参照。

## 動作確認

確認日: 2026-06-05 / 環境: AWS 本番（CloudFront + ECS Fargate）

### 認証

| 確認項目 | 結果 |
|---------|------|
| ユーザー登録 | ✅ |
| ログイン・ログアウト | ✅ |

| ログイン画面 | 新規登録画面 |
|------------|-----------|
| ![ログイン](doc/screenshots/スクリーンショット%202026-06-05%2011.27.10.png) | ![新規登録](doc/screenshots/スクリーンショット%202026-06-05%2011.28.07.png) |

### タイムライン・投稿

| 確認項目 | 結果 |
|---------|------|
| タイムライン表示（全体 / フォロー中タブ切り替え） | ✅ |
| 投稿作成（テキスト） | ✅ |
| 投稿削除 | ✅ |
| いいね・取り消し | ✅ |
| タイムスタンプが正しい時刻で表示（UTC 対応） | ✅ |

| 全体タブ | フォロー中タブ |
|---------|-------------|
| ![タイムライン全体](doc/screenshots/スクリーンショット%202026-06-05%2015.49.11.png) | ![フォロー中](doc/screenshots/スクリーンショット%202026-06-05%2015.49.38.png) |

### コメント・フォロー・プロフィール

| 確認項目 | 結果 |
|---------|------|
| コメント投稿 | ✅ |
| ユーザー検索 | ✅ |
| フォロー・解除 | ✅ |
| プロフィール編集（表示名・自己紹介・アバター） | ✅ |

| 投稿詳細・コメント | プロフィール編集 |
|-----------------|---------------|
| ![投稿詳細](doc/screenshots/スクリーンショット%202026-06-05%2015.50.01.png) | ![プロフィール編集](doc/screenshots/スクリーンショット%202026-06-05%2011.30.42.png) |

### インフラ

| 確認項目 | 結果 |
|---------|------|
| SPA ディープリンク（直接 URL アクセス） | ✅ |
| ALB 直接アクセスの遮断（CloudFront 経由のみ許可） | ✅ |

## ローカル開発セットアップ

### 必要な環境

- **Java 25**（JDK — `./gradlew` が使用）
- **Node.js 22+** と **npm**
- **Docker Desktop**（Docker Compose で PostgreSQL を起動）

### 1. PostgreSQL を起動

```bash
docker compose up -d
```

`docker-compose.yml` の設定で PostgreSQL 17 をポート 5432 で起動する。

### 2. バックエンドを起動

```bash
cd backend
./gradlew bootRun
```

API は `http://localhost:8080` で利用可能。起動時に Flyway が DB マイグレーションを自動実行する。  
Swagger UI は `http://localhost:8080/swagger-ui.html` で確認できる。

### 3. フロントエンドを起動

```bash
cd frontend
npm install   # 初回のみ
npm run dev
```

UI は `http://localhost:5173` で利用可能。Vite が `/api/*` リクエストをバックエンド（8080）へプロキシする。

### ポート一覧

| サービス | ポート |
|---------|--------|
| PostgreSQL | 5432 |
| バックエンド（Spring Boot） | 8080 |
| フロントエンド（Vite） | 5173 |

## テスト

```bash
# バックエンド単体テスト（JUnit 5）
cd backend && ./gradlew test

# フロントエンド単体テスト（Vitest）
cd frontend && npm test

# E2E テスト（Playwright）
cd e2e && npx playwright test
```

## プロジェクト構成

```
RAISETIMELINE/
├── backend/                    # Spring Boot アプリケーション
│   ├── src/main/java/          # Java ソース（controllers, services, repositories）
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/       # Flyway SQL マイグレーション（V1__, V2__, ...）
│   ├── build.gradle
│   └── Dockerfile              # マルチステージビルド（Corretto 25-al2023）
├── frontend/                   # React + Vite アプリケーション
│   ├── src/                    # TypeScript ソース（components, pages, api）
│   └── package.json
├── e2e/                        # Playwright E2E テスト
├── perf/                       # k6 パフォーマンステスト
├── infra/
│   └── terraform/              # AWS インフラ as Code
│       ├── ecs.tf / ecr.tf     # ECS Fargate / ECR
│       ├── cloudfront.tf       # CloudFront + S3
│       ├── alb.tf / rds.tf     # ALB / RDS
│       └── cf_functions/       # CloudFront Function（IP 許可リスト）
├── docs/                       # 設計ドキュメント
├── doc/screenshots/            # 動作確認スクリーンショット
└── docker-compose.yml          # ローカル開発用 PostgreSQL
```

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [docs/requirements.md](docs/requirements.md) | プロジェクト概要・機能スコープ・非機能要件 |
| [docs/features.md](docs/features.md) | 全機能の概要サマリー |
| [docs/screens.md](docs/screens.md) | 全画面のワイヤーフレームと遷移図 |
| [docs/database.md](docs/database.md) | ER 図・テーブル定義 |
| [docs/tech-stack.md](docs/tech-stack.md) | 使用技術・バージョン・採用理由 |
| [docs/infrastructure.md](docs/infrastructure.md) | AWS 構成・ECS Fargate / CloudFront・Terraform 設計・デプロイ手順 |
| [docs/logging.md](docs/logging.md) | ログ設計（フォーマット・レベル・traceId） |
| [docs/monitoring.md](docs/monitoring.md) | 監視設計（SLI/SLO・CloudWatch アラート） |

## データモデル

6 テーブル構成：

```
users ──< posts ──< post_images
  │         │
  │         ├──< comments
  │         └──< likes
  │
  └──< follows >── users（自己参照）
```

詳細は [docs/database.md](docs/database.md) の ER 図を参照。
