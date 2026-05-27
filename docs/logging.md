# ログ設計書

## 1. 設計方針

RAISETIMELINE のログは以下の原則に従って設計する。

- **可観測性（Observability）**: ログ単体で障害の原因追跡ができること
- **traceId による追跡**: 1リクエストの処理全体を単一の ID で追跡可能にする
- **個人情報保護**: パスワード・メールアドレス・トークン値はログに出力しない
- **環境分離**: 開発環境は人が読みやすいカラーコンソール、本番は機械処理可能な JSON

---

## 2. ログフォーマット

### 2.1 開発環境（dev / default プロファイル）

カラー付きコンソール出力。例：

```
2026-05-27 10:23:45.123  INFO 12345 --- [http-nio-1] c.r.filter.RequestLoggingFilter : [traceId=abc123def456] POST /api/auth/login 200 45ms
```

### 2.2 本番環境（production プロファイル）

JSON 形式で標準出力（CloudWatch Logs / ECS などで収集）。

```json
{
  "@timestamp": "2026-05-27T01:23:45.123Z",
  "@version": "1",
  "message": "POST /api/auth/login 200 45ms",
  "logger_name": "com.raisetimeline.filter.RequestLoggingFilter",
  "thread_name": "http-nio-8080-exec-1",
  "level": "INFO",
  "level_value": 20000,
  "service": "raisetimeline",
  "traceId": "abc123def456789012345678901234ab"
}
```

### 2.3 JSON フィールド定義

| フィールド | 型 | 内容 | 常に存在 |
|---|---|---|---|
| `@timestamp` | string | ISO 8601 UTC（例: `2026-05-27T01:23:45.123Z`） | yes |
| `message` | string | ログ本文 | yes |
| `level` | string | INFO / WARN / ERROR / DEBUG | yes |
| `service` | string | `raisetimeline`（固定） | yes |
| `traceId` | string | リクエスト追跡 ID（32文字 UUID v4 ハイフンなし） | リクエスト処理中のみ |
| `logger_name` | string | 出力元クラスの完全修飾名 | yes |
| `thread_name` | string | スレッド名 | yes |
| `stack_trace` | string | スタックトレース | エラー時のみ |

---

## 3. ログレベル運用基準

| レベル | 使用基準 | 例 |
|---|---|---|
| **ERROR** | サービス継続に影響する予期しない障害。アラート対象 | 予期しない例外、S3 接続失敗 |
| **WARN** | 正常ではないが処理継続可能。要監視 | JWT 検証失敗、ログイン失敗、4xx エラー |
| **INFO** | 正常な業務イベント。運用上重要な事実 | ログイン成功、投稿作成、アクセスログ |
| **DEBUG** | 開発時のデバッグ情報。本番では出力しない | 認証成功詳細、DB クエリ詳細 |

**ログレベル設定（application.yml）：**

```yaml
logging:
  level:
    root: INFO
    com.raisetimeline: INFO
    org.hibernate.SQL: WARN        # 本番では WARN（開発時のみ DEBUG にして SQL 確認）
    org.springframework.security: WARN
    software.amazon.awssdk: WARN
```

---

## 4. traceId の仕組みと使い方

### 4.1 仕組み

```
クライアントリクエスト
    │
    ▼
RequestLoggingFilter（@Order(1) — Spring Security より前に実行）
    ├── X-Trace-Id ヘッダーがあれば引き継ぐ（ALB 連携）
    ├── なければ UUID（ハイフンなし32文字）を生成
    ├── MDC.put("traceId", value)
    └── X-Trace-Id レスポンスヘッダーに設定
            │
            ▼
        Spring Security FilterChain
            └── JwtFilter → Controller → Service → Repository
                ※ これらすべてのログに traceId が自動付与される
            │
            ▼
        finally: MDC.clear() ← スレッドプール汚染防止
```

### 4.2 エラーレスポンスへの traceId 付与

`GlobalExceptionHandler` のすべてのエラーレスポンスに `traceId` が含まれる：

```json
{
  "message": "メールアドレスまたはパスワードが正しくありません",
  "traceId": "abc123def456789012345678901234ab"
}
```

クライアントはこの `traceId` を使ってサーバーログを検索できる。

### 4.3 traceId を使ったデバッグ手順

1. クライアントのエラーレスポンスに含まれる `traceId` を確認
2. ログを検索：

```sql
-- CloudWatch Logs Insights
fields @timestamp, level, message, logger_name
| filter traceId = "abc123def456789012345678901234ab"
| sort @timestamp asc
```

```bash
# 開発環境（grep）
grep "abc123def456" application.log
```

3. 同じ `traceId` を持つログ一覧から処理の流れを時系列で追跡する

---

## 5. 個人情報マスク方針

以下の情報はログに**出力しない**。

| 情報 | 理由 | 代替表現 |
|---|---|---|
| メールアドレス | 個人情報 | `username` または `userId` を使用 |
| パスワード（平文・ハッシュ問わず） | 認証情報 | 出力禁止 |
| JWT トークン値 | 認証情報 | `"JWT validation failed"` のみ記録 |
| リフレッシュトークン値 | 認証情報 | 出力禁止 |
| S3 Presigned URL | 一時的な署名付き URL | `imageKey` のみ記録 |

**認証失敗ログの方針：**
- ログイン失敗（email 未存在）→ `Login failed: user not found`（email も username も出さない）
- ログイン失敗（パスワード不一致）→ `Login failed: bad credentials`（username enumeration 防止）
- JWT 検証失敗 → `JWT validation failed: path=... method=...`（token 値は絶対に出さない）

---

## 6. アクセスログのフォーマット

`RequestLoggingFilter` が INFO レベルで以下の形式を出力する：

```
METHOD PATH STATUS DURATIONms
```

例：
```
POST /api/posts 201 123ms
GET  /api/posts?page=0&size=20 200 45ms
DELETE /api/posts/42 204 67ms
```

スキップされるパス（ノイズ削減のため）：
- `/swagger-ui/**`
- `/v3/api-docs/**`
- `/actuator/**`

---

## 7. ログ保持期間の推奨

| 環境 | 保持期間 | 保存先 |
|---|---|---|
| 本番 | 90日間 | CloudWatch Logs（Log Group のリテンション設定） |
| 開発 | 7日間 または rotate | コンソール / ローカルファイル |

**CloudWatch Logs の設定例（Terraform）：**

```hcl
resource "aws_cloudwatch_log_group" "app" {
  name              = "/raisetimeline/application"
  retention_in_days = 90
}
```
