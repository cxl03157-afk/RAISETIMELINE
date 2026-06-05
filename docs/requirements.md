# 要件定義書

## 1. プロジェクト概要

| 項目 | 内容 |
|---|---|
| プロジェクト名 | RAISETIMELINE |
| 目的 | X/Twitter 類似の SNS アプリを学習目的で開発し、フルスタック開発の実践スキルを習得する |
| 対象ユーザー | 受講生・個人（複数ユーザーが利用することを前提とする） |
| 作成日 | 2026-05-18 |

---

## 2. 背景・学習目的

本プロジェクトは、以下の技術スタックを実践的に習得することを目的とする。

| レイヤー | 学習テーマ | 詳細ドキュメント |
|---|---|---|
| フロントエンド | React コンポーネント設計、TypeScript、状態管理、fetch API | [技術スタック](tech-stack.md) |
| バックエンド | Spring Boot REST API 設計、Spring Security（JWT 認証）、JPA / Hibernate | [技術スタック](tech-stack.md) |
| データベース | PostgreSQL スキーマ設計、Flyway マイグレーション | [データベース設計](database.md) |
| ストレージ | AWS S3 を用いた画像ファイル管理 | [インフラ構成](infrastructure.md) |
| インフラ | AWS（ECS Fargate・RDS・ALB・S3・CloudFront）の構築・運用、Terraform による IaC | [インフラ構成](infrastructure.md) |
| コンテナ | Docker によるバックエンドコンテナ化、ECR へのイメージ管理 | [インフラ構成](infrastructure.md) |
| CI/CD | GitHub Actions によるテスト自動化・ECS デプロイパイプライン構築 | [インフラ構成](infrastructure.md) |
| テスト | Playwright による E2E テスト、k6 によるパフォーマンステスト | [機能一覧](features.md) |

---

## 3. 機能要件（概要）

機能の詳細は各ドキュメントを参照。

| # | 機能名 | 概要 | 詳細ドキュメント |
|---|---|---|---|
| 1 | ログイン・認証 | ユーザー登録・ログイン・ログアウト・JWT 認証 | [features/01_auth.md](features/01_auth.md) |
| 2 | タイムライン・投稿 | 全ユーザーの投稿を新着順に表示・投稿の作成・編集・削除・全体/フォロー中タブ切替 | [features/02_timeline.md](features/02_timeline.md) |
| 3 | コメント | 投稿へのコメント追加・削除・件数表示 | [features/03_comment.md](features/03_comment.md) |
| 4 | いいね | 投稿へのいいね・取り消し・件数表示 | [features/04_like.md](features/04_like.md) |
| 5 | 画像投稿 | 投稿に画像を添付（最大 4 枚）・S3 保存・表示 | [features/05_image.md](features/05_image.md) |
| 6 | フォロー・フォロワー | ユーザー検索・フォロー管理・一覧表示 | [features/06_follow.md](features/06_follow.md) |

機能一覧の概要サマリーは [features.md](features.md) を参照。

---

## 4. 非機能要件

| 項目 | 要件 |
|---|---|
| データ永続化 | PostgreSQL（AWS RDS）にデータを保存する |
| 画像ストレージ | 投稿画像は AWS S3 に保存し、URL を DB 管理する |
| 認証 | JWT トークンによるステートレス認証を採用する |
| 対応ブラウザ | PC ブラウザ（Chrome・Safari）を対象とする |
| レスポンシブ対応 | 本フェーズでは不要（PC ブラウザのみ対応） |
| パフォーマンス | タイムラインのページネーション（1 ページ 20 件）を実装する |
| 可用性 | CloudFront + ALB + ECS Fargate によるコンテナ化構成。ローリングデプロイでダウンタイムなし |

---

## 5. セキュリティ要件

| 項目 | 対策 |
|---|---|
| 認証・認可 | JWT トークンを使用し、有効期限・署名検証を実施 |
| パスワード管理 | BCrypt でパスワードをハッシュ化して保存 |
| XSS 対策 | React の標準エスケープ処理に依存（dangerouslySetInnerHTML は使用しない） |
| CORS 設定 | Spring Boot でフロントエンドのオリジンのみを許可する |
| SQL インジェクション対策 | Spring Data JPA のパラメータバインディングを使用する |
| S3 アクセス制御 | S3 バケットは非公開とし、ECS タスクロール（IAM）経由でのみアクセスする。フロントエンド用 S3 は CloudFront OAC 経由のみ許可 |
| HTTPS | CloudFront で TLS 終端を行い、CloudFront → ALB → ECS の通信は HTTP（VPC 内） |
| アクセス制限 | CloudFront Function による IP 許可リスト方式でアクセスを制御 |

---

## 6. 関連ドキュメント

| ドキュメント | 内容 |
|---|---|
| [機能一覧](features.md) | 全機能の概要サマリー |
| [機能定義書: ログイン・認証](features/01_auth.md) | 登録・ログイン・JWT・プロフィール編集 |
| [機能定義書: タイムライン・投稿](features/02_timeline.md) | 投稿 CRUD・タイムライン表示 |
| [機能定義書: コメント](features/03_comment.md) | コメントの追加・削除・件数表示 |
| [機能定義書: いいね](features/04_like.md) | いいね・取り消し・件数表示 |
| [機能定義書: 画像投稿](features/05_image.md) | 画像添付・S3 保存・表示 |
| [機能定義書: フォロー・フォロワー](features/06_follow.md) | ユーザー検索・フォロー管理 |
| [画面設計](screens.md) | 全 9 画面のワイヤーフレームと遷移図 |
| [データベース設計](database.md) | ER 図・テーブル定義 |
| [技術スタック](tech-stack.md) | 使用技術とバージョン一覧 |
| [インフラ構成](infrastructure.md) | AWS 構成図・ECS Fargate・CloudFront・Terraform 設計・デプロイ手順 |
| [ログ設計](logging.md) | ログフォーマット・ログレベル・traceId |
| [監視設計](monitoring.md) | SLI/SLO・CloudWatch アラート・ダッシュボード |
| [インシデント対応](operations/incident-response.md) | 障害発生時の対応フロー |

---

## 7. スコープ外

本プロジェクトでは以下の機能は**実装しない**。

| 機能 | 理由 |
|---|---|
| インプレッション数（閲覧数）表示 | X との差別化ポイント |
| リツイート / 引用ポスト | X との差別化ポイント |
| ダイレクトメッセージ（DM） | 学習スコープ外 |
| 通知機能（プッシュ通知・リアルタイム） | WebSocket / FCM 等の実装は本フェーズ対象外 |
| プロフィール画像のトリミング | 画像アップロードのみ対応 |
| ハッシュタグ・メンション機能 | 学習スコープ外 |
| 管理者画面 | 学習スコープ外 |
| モバイルアプリ（iOS / Android） | Web のみ対応 |
