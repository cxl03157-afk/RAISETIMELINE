# 技術スタック

スクール指定の技術スタックに準拠する。

## フロントエンド

| 技術 | バージョン | 用途 |
|---|---|---|
| Node.js | 25.9.0 | JavaScript ランタイム |
| React | 19 | UI フレームワーク |
| TypeScript | 5.9 | 型安全な JavaScript |
| Vite | 8 | ビルドツール・開発サーバー |
| Material UI | 7 | UI コンポーネントライブラリ |
| fetch API | ブラウザ標準 | バックエンド API 通信 |

## バックエンド

| 技術 | バージョン | 用途 |
|---|---|---|
| Java (Amazon Corretto) | 25 | 実行環境 |
| Spring Boot | 4.0 | Web フレームワーク |
| Gradle | 9.5.0 | ビルドツール |
| Spring Data JPA + Hibernate | Spring Boot 同梱 | ORM・DB アクセス |
| Flyway | Spring Boot 同梱 | DB マイグレーション管理 |
| JUnit 5 | Spring Boot 同梱 | ユニットテスト |
| Spring Security + JWT | Spring Boot 同梱 ※ | 認証・認可（Bearer トークン） |
| AWS SDK for Java v2（S3） | 最新安定版 | S3 への画像アップロード |

※ Spring Security は Spring Boot に含まれるが、JWT ライブラリ（`jjwt` 等）は別途依存関係として追加する。

## データベース

| 技術 | バージョン | 用途 |
|---|---|---|
| PostgreSQL | 17 | リレーショナルデータベース（AWS RDS） |
| Docker (ローカル開発) | postgres:17-alpine | ローカル開発用 DB コンテナ |

## ストレージ・インフラ

| 技術 | バージョン | 用途 |
|---|---|---|
| AWS S3 | — | 投稿画像・アバター画像の保存 |
| AWS EC2 | — | アプリケーションサーバー |
| AWS RDS (PostgreSQL) | — | マネージド DB |
| AWS ALB | — | ロードバランサー（HTTP → EC2 ルーティング） |
| Terraform | 1.15.2 | インフラ as Code（IaC） |
| AWS CLI | 2.34.45 | AWS 操作 CLI |
| Amazon Linux 2023 | — | EC2 OS |
| Nginx | 1.28 | リバースプロキシ（EC2 上） |

## 開発ツール

| 技術 | バージョン | 用途 |
|---|---|---|
| Docker Desktop | 29.4.1 | ローカル開発用コンテナ実行環境 |
| GitHub CLI | 2.92.0 | GitHub 操作 CLI |
| Git | 2.50.1 | バージョン管理 |
| npm | 11.12.1 | パッケージマネージャー |
