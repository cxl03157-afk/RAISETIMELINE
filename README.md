# RAISETIMELINE

X/Twitter 類似の SNS アプリ。学習目的でフルスタック開発（React + Spring Boot + PostgreSQL + AWS）を実践する。

## 主な機能

| 機能 | 概要 |
|---|---|
| ログイン・認証 | ユーザー登録・ログイン・ログアウト・JWT 認証 |
| タイムライン・投稿 | 全ユーザーの投稿を新着順に表示・テキスト投稿の作成・削除 |
| コメント | 投稿へのコメント追加・削除・件数表示 |
| いいね | 投稿へのいいね・取り消し・件数表示 |
| 画像投稿 | 投稿に画像を添付（最大 4 枚）・AWS S3 保存 |
| フォロー・フォロワー | ユーザー検索・フォロー管理・フォロー/フォロワー一覧表示 |

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React 19 / TypeScript 5.9 / Vite 7 / Material UI 7 |
| バックエンド | Java 25 / Spring Boot 4.0 / Spring Security + JWT / Gradle |
| データベース | PostgreSQL 17 (AWS RDS) |
| ストレージ | AWS S3（投稿画像・アバター画像） |
| インフラ | AWS EC2 + RDS + ALB + S3 / Terraform 1.15.2 / Nginx 1.28 |

## ドキュメント

| ドキュメント | 内容 |
|---|---|
| [要件定義書](docs/requirements.md) | プロジェクト概要・非機能要件・スコープ外 |
| [機能一覧](docs/features.md) | 全機能の概要サマリー |
| [機能定義書: ログイン・認証](docs/features/01_auth.md) | 登録・ログイン・JWT・プロフィール編集 |
| [機能定義書: タイムライン・投稿](docs/features/02_timeline.md) | 投稿CRUD・タイムライン表示 |
| [機能定義書: コメント](docs/features/03_comment.md) | コメントの追加・削除・件数表示 |
| [機能定義書: いいね](docs/features/04_like.md) | いいね・取り消し・件数表示 |
| [機能定義書: 画像投稿](docs/features/05_image.md) | 画像添付・S3保存・表示 |
| [機能定義書: フォロー・フォロワー](docs/features/06_follow.md) | ユーザー検索・フォロー管理 |
| [画面設計](docs/screens.md) | 全 9 画面のワイヤーフレームと遷移図 |
| [データベース設計](docs/database.md) | ER 図・テーブル定義 |
| [技術スタック](docs/tech-stack.md) | 使用技術とバージョン一覧 |
| [インフラ構成](docs/infrastructure.md) | AWS 構成図・Terraform 設計 |

## プロジェクト構成（予定）

```
RAISETIMELINE/
├── frontend/        # React + TypeScript
├── backend/         # Spring Boot
├── infra/
│   └── terraform/   # AWS インフラ as Code
├── docs/            # 設計ドキュメント
└── docker-compose.yml  # ローカル開発用 PostgreSQL
```
