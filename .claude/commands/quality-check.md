# 品質チェックルール

このプロジェクトの品質担保のために、機能実装後に以下のチェックを実施すること。

## フロントエンド

### ESLint チェック（必須）
```bash
cd frontend
npm run lint
```
エラー 0 件を確認すること。

### TypeScript 型チェック（必須）
```bash
cd frontend
npx tsc --noEmit
```

### チェックポイント
- [ ] `useEffect` 内で `setState` を同期呼びしていないか（`react-hooks/set-state-in-effect`）
- [ ] 無駄な変数初期化がないか（`no-useless-assignment`）
- [ ] 使われていない型・コンポーネント・ファイルが残っていないか
- [ ] `fetch` のレスポンスに `if (!r.ok) throw` のステータスチェックがあるか
- [ ] 非同期処理の `catch` でユーザーへエラーを通知しているか（サイレント失敗になっていないか）

---

## バックエンド

### テスト実行（必須）
```bash
cd backend
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-25.jdk/Contents/Home ./gradlew test
```
全テストパスを確認すること。

### チェックポイント
- [ ] 読み取り専用メソッドに `@Transactional(readOnly = true)` が付いているか
- [ ] `IllegalArgumentException` など業務例外が適切な HTTP ステータス（400）で返るか
- [ ] 新しいエンドポイントの HTTP メソッドが `CorsConfig` に追加されているか
- [ ] `application.yml` の開発専用設定（`show-sql: true` 等）にコメントがあるか

### SNS 固有チェックポイント（RAISETIMELINE）
- [ ] Spring Security の JWT フィルターが未認証エンドポイント（`/api/auth/**`）を正しく許可しているか
- [ ] 保護エンドポイントへ無効トークンでアクセスした際に 401 が返るか
- [ ] S3 アップロード時に IAM ロールのパーミッションエラーが発生していないか（ログで確認）
- [ ] 画像削除（投稿削除時）に S3 ファイルも連動削除されているか
- [ ] `likes` テーブルの UNIQUE 制約（`post_id`, `user_id`）で二重いいねが防止されているか
- [ ] `follows` テーブルの UNIQUE 制約（`follower_id`, `followee_id`）で二重フォローが防止されているか
- [ ] `follows` テーブルの CHECK 制約（`follower_id <> followee_id`）で自己フォローが防止されているか

---

## ドキュメント整合チェック

- [ ] `README.md` の機能一覧が実装と一致しているか
- [ ] `docs/tech-stack.md` の技術スタックが実際に使用されているか
- [ ] 使われていない技術がドキュメントに残っていないか
- [ ] `index.html` の `lang` 属性・`<title>` がアプリに合っているか

---

## Terraform チェック

### フォーマットチェック（必須）
```bash
cd infra/terraform
terraform fmt -check
```
差分が出た場合は `terraform fmt` で修正すること。

### 設定の検証（必須）
```bash
cd infra/terraform
terraform validate
```
`Success! The configuration is valid.` を確認すること。

### チェックポイント
- [ ] パスワード等の機密情報がコード内にハードコードされていないか（変数・環境変数を使用しているか）
- [ ] `.gitignore` に `*.tfstate`・`*.tfstate.backup`・`*.pem` が含まれているか
- [ ] セキュリティグループのインバウンドルールが最小権限になっているか
- [ ] RDS に `publicly_accessible = false` が設定されているか
- [ ] RDS がパブリックサブネットではなくプライベートサブネットに配置されているか
- [ ] S3 バケットのパブリックアクセスブロックが有効になっているか

---

## 過去に発見した問題（再発防止）

| 問題 | 原因 | 対策 |
|------|------|------|
| `spring.jackson.serialization.write-dates-as-timestamps: false` が Spring Boot 4 で起動エラー | `LenientObjectToEnumConverterFactory` の IllegalArgumentException | この設定は使わない。DTO の `LocalDateTime` フィールドに `@JsonFormat(timezone="UTC")` を付与する |
| ECS タスクが起動中に ALB ヘルスチェックで落とされる | `health_check_grace_period_seconds` が未設定で Spring Boot 起動前に unhealthy 判定 | `aws_ecs_service` に `health_check_grace_period_seconds = 200` を設定する |
| ECS デプロイが競合して新タスクが即停止するループ | `wait-for-service-stability: true` がタイムアウトして旧デプロイが ACTIVE のまま残存 | `cd-backend.yml` で `wait-for-service-stability` を削除する |
| Amazon Linux 2023 で `xargs` がない | AL2023 に `findutils` が未インストール | Dockerfile に `RUN dnf install -y findutils shadow-utils` を追加する |
| Amazon Linux 2023 で `adduser` コマンドがない | AL2023 では `useradd` を使う | `shadow-utils` をインストールして `useradd -u 1000 -M -s /sbin/nologin appuser` で作成 |
