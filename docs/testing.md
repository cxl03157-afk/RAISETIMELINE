# テスト設計

## 1. テスト戦略

テストピラミッドに基づき、以下の4層でテストを構成する。

```
        ┌─────────────────────┐
        │   CD後スモークテスト  │  ← 本番デプロイ後の動作確認
        ├─────────────────────┤
        │    E2E テスト       │  ← Playwright（ブラウザ操作）
        ├─────────────────────┤
        │  パフォーマンステスト  │  ← k6（API負荷）/ Playwright（Web Vitals）
        ├─────────────────────┤
        │   単体・統合テスト   │  ← JUnit 5 / Vitest（最も多い）
        └─────────────────────┘
```

| 層 | ツール | CI 組み込み | 目的 |
|---|---|---|---|
| 単体・統合テスト | JUnit 5 / Vitest | ✅ 必須 | ロジック・コンポーネントの正確性 |
| E2E テスト | Playwright | ✅ 必須（パスフィルター付き） | ユーザー操作の結合動作確認 |
| パフォーマンステスト | k6 / Playwright | ❌ 手動実行のみ | スループット・レイテンシの確認 |
| CD 後スモークテスト | curl / Playwright MCP | ❌ 手動実行のみ | 本番デプロイ後の疎通確認 |

---

## 2. バックエンド単体・統合テスト（JUnit 5）

### テスト構成

```
backend/src/test/java/com/raisetimeline/
├── controller/         # API 層（MockMvc + @WebMvcTest）
│   ├── AuthControllerTest.java
│   ├── PostControllerTest.java
│   ├── CommentControllerTest.java
│   ├── LikeControllerTest.java
│   └── UserControllerTest.java
├── service/            # ビジネスロジック層（@ExtendWith(MockitoExtension)）
│   ├── AuthServiceTest.java
│   ├── PostServiceTest.java
│   ├── CommentServiceTest.java
│   ├── LikeServiceTest.java
│   ├── FollowServiceTest.java
│   ├── UserServiceTest.java
│   └── RefreshTokenServiceTest.java
└── repository/         # DB 層（@DataJpaTest + H2）
    ├── UserRepositoryTest.java
    ├── PostRepositoryTest.java
    ├── CommentRepositoryTest.java
    ├── LikeRepositoryTest.java
    └── FollowRepositoryTest.java
```

### アノテーション使い分け

| アノテーション | 対象層 | 特徴 |
|---|---|---|
| `@WebMvcTest` | Controller | MockMvc で HTTP リクエストをテスト。Service は `@MockBean` でモック |
| `@ExtendWith(MockitoExtension)` | Service | 依存関係をすべて Mockito でモック。Spring コンテキスト不要で高速 |
| `@DataJpaTest` | Repository | H2 インメモリ DB でリポジトリのクエリをテスト |

### 実行コマンド

```bash
cd backend
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-25.jdk/Contents/Home ./gradlew test

# テストレポート確認
open build/reports/tests/test/index.html
```

### Checkstyle（静的解析）

```bash
cd backend
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-25.jdk/Contents/Home ./gradlew checkstyleMain checkstyleTest
```

設定ファイル: `backend/config/checkstyle/checkstyle.xml`

---

## 3. フロントエンド単体テスト（Vitest）

### テスト構成

```
frontend/src/
├── components/
│   ├── PostCard.test.tsx          # 投稿カードの表示・いいね・コメント数
│   ├── PostModal.test.tsx         # 投稿モーダルのバリデーション
│   ├── ImageGrid.test.tsx         # 画像グリッドのレイアウト
│   ├── UserCard.test.tsx          # ユーザーカードの表示・フォローボタン
│   ├── NewPostsBanner.test.tsx    # 新着バナーの表示・クリック動作
│   └── DeleteConfirmDialog.test.tsx  # 削除確認ダイアログ
└── utils/
    ├── formatTime.test.ts         # 「1分前」等の時刻フォーマット
    └── storage.test.ts            # JWT トークンのローカルストレージ操作
```

### 実行コマンド

```bash
cd frontend
npm test              # ウォッチモード
npm test -- --run     # 一回実行して終了（CI 向け）
```

### 重点テストケース

**`formatTime.test.ts`** — タイムゾーン対応の確認
- UTC タイムスタンプ（`Z` サフィックス付き）が正しく「n分前」に変換されるか
- `@JsonFormat(timezone="UTC")` 修正後の動作確認として重要

**`PostModal.test.tsx`** — バリデーション
- 280 文字上限のカウント表示
- 空文字で投稿ボタンが disabled になるか

---

## 4. E2E テスト（Playwright）

### テスト構成

```
e2e/scenarios/
├── auth.spec.ts        # 認証フロー（登録・ログイン・バリデーション）
├── timeline.spec.ts    # タイムライン操作（投稿・いいね・コメント・フォロー）
└── accessibility/
    └── a11y.spec.ts    # アクセシビリティ（axe-core）
```

### 主なシナリオ

**`auth.spec.ts`:**
- 正常登録 → `/home` にリダイレクト
- 未入力フィールドあり → クライアントエラー表示
- 正常ログイン → `/home` にリダイレクト

**`timeline.spec.ts`:**
- 投稿作成 → タイムラインに反映
- いいね → カウント増加
- コメント投稿・削除
- フォロー → フォロー中タブに反映

### 実行コマンド

```bash
# ローカル（バックエンド・フロントエンド起動済みが前提）
cd e2e
npx playwright test

# レポート確認
npx playwright show-report
```

### CI でのパスフィルター設定

E2E は重いため、ソースコード変更時のみ実行するようパスフィルターを設定している。

```yaml
# .github/workflows/ci-e2e.yml
on:
  pull_request:
    paths:
      - 'frontend/src/**'   # frontend/** ではなく src/** に絞る
      - 'backend/src/**'    # Dockerfile・設定ファイル変更ではスキップ
      - 'e2e/**'
      - '.github/workflows/ci-e2e.yml'
```

**ポイント:** `backend/**` ではなく `backend/src/**` に絞ることで、Dockerfile や `application.yml` の変更では E2E がスキップされ、実行時間を節約できる。

---

## 5. パフォーマンステスト（k6 + Playwright）

CI には組み込まず、任意のタイミングで**手動実行**する。

### k6 シナリオ構成

```
perf/scenarios/
├── 01-auth.js          # 認証 API（登録・ログイン）: 50 VU × 30s
├── 02-timeline.js      # タイムライン取得: 複数 VU
├── 03-post-write.js    # 投稿作成（書き込み負荷）
└── 04-full-journey.js  # フルジャーニー（ログイン→タイムライン→投稿→いいね）
                        # 10 VU → 20 VU のステージ構成
```

### しきい値（共通）

| メトリクス | しきい値 |
|---|---|
| `http_req_duration` p(95) | < 500ms |
| `http_req_duration` p(99) | < 1500ms |
| `http_req_failed` | < 1% |

### 実行コマンド

```bash
cd perf

# 個別シナリオ
k6 run scenarios/01-auth.js
k6 run scenarios/04-full-journey.js

# ブラウザテスト（Web Vitals）
npm run test:browser
```

### Playwright によるブラウザパフォーマンス計測

```bash
cd perf
npm run test:browser   # LCP・FCP・CLS 等の Web Vitals を計測
```

---

## 6. CI での自動テスト

### ワークフロー構成

| ワークフロー | ファイル | トリガー | 必須 |
|---|---|---|---|
| Backend CI | `ci-backend.yml` | 全 PR | ✅ |
| Frontend CI | `ci-frontend.yml` | `frontend/src/**` 変更時 | ✅ |
| E2E Tests | `ci-e2e.yml` | `backend/src/**` / `frontend/src/**` 変更時 | ✅ |
| CI - Infrastructure | `ci-infra.yml` | `infra/**` 変更時 | ❌（レビュー補助のみ） |

### ブランチ保護との連携

main ブランチへのマージには `backend` ジョブの通過のみを必須としている。

```
PR 作成
  ↓
Backend CI（JUnit + Checkstyle）→ 必須 ✅
E2E Tests（Playwright）        → 任意（失敗してもマージ可能）
Frontend CI（ESLint + Vitest + Vite build）→ 任意（失敗してもマージ可能）
  ↓
Backend CI 通過 → マージ可能
```

**`frontend` と `e2e` を必須にしない理由:**
- `frontend` CI はパスフィルター（`frontend/src/**`）により backend のみ変更した PR では実行されない。必須にするとマージがブロックされる
- `e2e` も同様にパスフィルター付きのため、実行されない PR ではブロックされる
- 将来的には `e2e` の必須化を検討（パスフィルターと GitHub の「スキップ = 通過とみなす」設定を組み合わせる）

> **運用ルール:** ブランチ保護は `backend` のみ必須だが、**マージ前に PR の「Checks」タブで実行された全 CI の結果を目視確認すること**。`frontend` や `e2e` が実行されていて失敗している場合はマージしない。GitHub PR ページの Checks タブ、または `gh pr view <番号> --json statusCheckRollup` で確認できる。

---

## 7. CD 後スモークテスト

GitHub Actions の CD 完了後、本番環境が正常に動作しているかを確認する。

### 自動確認チェックリスト

CD 完了直後に以下を確認する。

```bash
# 1. ECS サービスの安定確認（running=1, pending=0, deployments=1）
aws ecs describe-services \
  --cluster raisetimeline \
  --services raisetimeline-backend \
  --query 'services[0].{running:runningCount,pending:pendingCount,deployments:deployments[*].status}'

# 2. API 疎通確認（401 が返れば CloudFront → ALB → ECS が正常）
curl -s -o /dev/null -w "%{http_code}" https://d17tofagnll1ob.cloudfront.net/api/posts
# → 401 が期待値

# 3. フロントエンド確認（200 が返ればS3 + CloudFront が正常）
curl -s -o /dev/null -w "%{http_code}" https://d17tofagnll1ob.cloudfront.net/
# → 200 が期待値

# 4. コンテナヘルスチェック確認
aws ecs describe-services \
  --cluster raisetimeline \
  --services raisetimeline-backend \
  --query 'services[0].deployments[0].{status:status,running:runningCount,failedTasks:failedTasks}'
```

### 手動ブラウザ確認（主要フロー）

| # | 確認項目 | 期待結果 |
|---|---------|---------|
| 1 | ログイン | `/home` にリダイレクト |
| 2 | タイムライン表示 | 投稿一覧が表示される |
| 3 | 投稿作成 | タイムラインに即時反映、タイムスタンプが「数秒前」と表示 |
| 4 | いいね | カウントが即時更新 |
| 5 | プロフィール画像 | S3 Presigned URL で画像が表示される |

**タイムスタンプ確認が重要な理由:** API レスポンスの `createdAt` に `Z` サフィックス（UTC 明示）がついていれば修正が正常に適用されている。`Z` がない場合はデプロイされているイメージが古い可能性がある。

```bash
# API レスポンスのタイムスタンプ形式を直接確認
TOKEN=$(curl -s -X POST https://d17tofagnll1ob.cloudfront.net/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"<email>","password":"<password>"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')

curl -s "https://d17tofagnll1ob.cloudfront.net/api/posts?page=0&size=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c \
  'import sys,json; d=json.load(sys.stdin); print(d["content"][0]["createdAt"])'
# → "2026-06-05T06:45:13.764659Z" のように Z サフィックスがあれば正常
```

### デプロイ失敗時のトラブルシューティング

ECS タスクが起動しない・ヘルスチェックに失敗する場合は [docs/infrastructure.md](infrastructure.md) の「ECS デプロイ競合の解消」セクションを参照。

---

## 8. 将来の改善案

| 改善内容 | 優先度 | 理由 |
|---------|--------|------|
| CD 後に curl スモークテストを自動実行（`cd-backend.yml` に追加） | 🔴 高 | 現在は手動確認のみで抜け漏れが起きやすい |
| Playwright による本番環境 E2E（ヘッドレス） | 🟡 中 | デプロイ後の機能確認を自動化できる |
| `@DataJpaTest` で TestContainers（PostgreSQL）に移行 | 🟡 中 | H2 では PostgreSQL 固有の挙動（ENUM・配列型等）を検証できない |
| フロントエンドの MSW（Mock Service Worker）導入 | 🟢 低 | API モックをより現実的にしてコンポーネントテストの信頼性を向上 |
