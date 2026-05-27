# インシデント対応ガイド

## 1. インシデント重要度定義

| Priority | 条件 | 影響範囲 | MTTD 目標 | MTTR 目標 |
|---|---|---|---|---|
| **P1 - Critical** | サービス全体停止 / 全ユーザーが認証不可 / データ損失の可能性 | 全ユーザー | 5分以内 | 2時間以内 |
| **P2 - High** | 主要機能（投稿/認証）の一部が機能しない / P99 > 5s | 多数ユーザー | 15分以内 | 8時間以内 |
| **P3 - Medium** | 軽微な機能劣化 / 一部ユーザーへの影響 | 一部ユーザー | 翌営業日 | 翌営業日 |

---

## 2. インシデント対応フロー

```
1. 検知（Detection）
   ├── CloudWatch アラート
   ├── ユーザー報告
   └── 定期監視

        ↓

2. トリアージ（Triage）
   ├── 優先度（P1/P2/P3）の判定
   ├── 影響範囲の特定
   └── インシデント起票（GitHub Issue）

        ↓

3. 調査（Investigation）
   ├── ログ確認（traceId で追跡）
   ├── メトリクス確認
   └── 根本原因の仮説立案

        ↓

4. 緩和（Mitigation）
   ├── 暫定対応（サービス継続優先）
   └── ステータス更新

        ↓

5. 解決（Resolution）
   ├── 恒久対応の実施
   ├── 動作確認
   └── アラート解除

        ↓

6. ポストモーテム（Post-mortem）
   ├── タイムライン作成（24時間以内）
   └── 再発防止策策定（1週間以内）
```

---

## 3. 検知・トリアージ手順

### 3.1 ログ確認（CloudWatch Logs Insights）

```sql
-- 直近 15 分のエラーログ確認
fields @timestamp, level, message, traceId, logger_name
| filter level = "ERROR"
| sort @timestamp desc
| limit 50

-- 特定 traceId の全ログ追跡
fields @timestamp, level, message, logger_name
| filter traceId = "YOUR_TRACE_ID_HERE"
| sort @timestamp asc
```

### 3.2 影響範囲の確認

```sql
-- エンドポイント別エラー率（直近 1 時間）
fields @timestamp, message
| parse message "* * * *ms" as method, path, status, duration
| stats count(*) as total,
        sum(toint(status) >= 500) as errors
  by path
| extend errorRate = errors / total * 100
| sort errorRate desc
```

---

## 4. 機能別 Runbook

### 4.1 認証エラー急増

**症状:** `/api/auth/login` の 5xx エラー急増、または `JWT validation failed` WARN ログの急増

**調査手順:**

1. ログで認証エラーの種類を確認：
   ```sql
   fields @timestamp, message, traceId
   | filter message like /JWT validation failed/ or message like /Login failed/
   | stats count() by bin(1min)
   ```

2. `level=ERROR` のログを確認（DB 接続障害の可能性）：
   ```sql
   fields @timestamp, message, stack_trace
   | filter level = "ERROR" and logger_name like /AuthService/
   | sort @timestamp desc
   ```

3. RDS 接続状態を確認（CloudWatch メトリクス: `DatabaseConnections`）

**対応:**
- JWT 有効期限切れによる大量エラー → フロントエンドのトークン更新ロジックを確認
- DB 接続エラー → **4.3 データベース障害** の手順に移行
- ブルートフォース攻撃の疑い（同一 traceId 帯から大量失敗） → Nginx / ALB でレートリミット実施

---

### 4.2 投稿 API 障害

**症状:** `POST /api/posts` / `GET /api/posts` の成功率低下、レスポンスタイム急増

**調査手順:**

1. アクセスログでエラーパターンを確認：
   ```sql
   fields @timestamp, message
   | parse message "* /api/posts* * *ms" as method, path, status, duration
   | filter toint(status) >= 400
   | stats count() by status, method
   ```

2. エラーの種類を特定：
   - `400 Bad Request` → バリデーションエラー（クライアント側の問題）
   - `500 Internal Server Error` → `level=ERROR` ログでスタックトレースを確認
   - タイムアウト → DB クエリ遅延または S3 API 遅延

3. PostService のエラーログを確認：
   ```sql
   fields @timestamp, message, traceId, stack_trace
   | filter logger_name like /PostService/ and level = "ERROR"
   | sort @timestamp desc
   ```

**対応:**
- DB クエリ遅延 → **4.3 データベース障害** の手順
- S3 遅延 → **4.4 S3 接続障害** の手順
- OOM / ヒープ枯渇 → EC2 インスタンス再起動（暫定）→ JVM ヒープサイズ調整（恒久）

---

### 4.3 データベース障害

**症状:** `HikariPool` タイムアウトログ、`CannotGetJdbcConnectionException`

**調査手順:**

1. DB 接続エラーログを確認：
   ```sql
   fields @timestamp, message, stack_trace
   | filter message like /HikariPool/ or message like /Unable to acquire JDBC Connection/
   ```

2. RDS メトリクス確認（CloudWatch）：
   - `DatabaseConnections`: 接続数の推移
   - `CPUUtilization`: CPU 使用率
   - `FreeStorageSpace`: ストレージ残量

3. RDS インスタンス状態を確認：
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier raisetimeline-db \
     --query 'DBInstances[0].DBInstanceStatus'
   ```

**暫定対応:**
- 接続枯渇 → アプリケーション再起動でコネクションプールリセット
- RDS 停止 → AWS コンソールから手動起動
- ストレージフル → スナップショット取得後、ストレージスケールアップ

---

### 4.4 S3 接続障害

**症状:** S3 アップロード失敗ログ、画像が表示されない

**調査手順:**

1. S3 関連エラーログを確認：
   ```sql
   fields @timestamp, message, traceId
   | filter message like /S3へのアップロードに失敗/ or message like /S3削除失敗/
   | sort @timestamp desc
   ```

2. AWS S3 サービス状態を確認：
   - AWS Service Health Dashboard: https://health.aws.amazon.com/

3. IAM ロールの権限を確認（EC2 から実行）：
   ```bash
   aws sts get-caller-identity
   aws s3 ls s3://raisetimeline-images-865091756032/
   ```

**対応:**
- S3 リージョン障害 → 画像アップロード機能を一時的に無効化（テキスト投稿のみ許可）
- IAM ロールの問題 → IAM ポリシーを再確認・再アタッチ

---

### 4.5 EC2 サーバーダウン

**症状:** ALB ヘルスチェック失敗、全 API が応答しない

**対応:**

1. EC2 インスタンス状態を確認：
   ```bash
   aws ec2 describe-instances \
     --filters "Name=tag:Name,Values=raisetimeline-ec2" \
     --query 'Reservations[*].Instances[*].State.Name'
   ```

2. インスタンスが停止中の場合：
   ```bash
   aws ec2 start-instances --instance-ids i-XXXXXXXX
   ```

3. アプリケーションが起動していない場合（SSH 接続後）：
   ```bash
   sudo systemctl status raisetimeline
   sudo journalctl -u raisetimeline -n 100
   sudo systemctl start raisetimeline
   ```

4. Spring Boot 起動失敗の場合：
   - ログで Flyway マイグレーション失敗がないか確認
   - 環境変数（`JWT_SECRET`, `AWS_S3_BUCKET` 等）が設定されているか確認

---

## 5. ポストモーテムテンプレート

```markdown
# インシデント ポストモーテム

## 概要

| 項目 | 内容 |
|---|---|
| インシデント ID | INC-YYYY-MM-DD-NNN |
| 優先度 | P1 / P2 / P3 |
| 発生日時 | YYYY-MM-DD HH:MM JST |
| 解決日時 | YYYY-MM-DD HH:MM JST |
| 影響時間 | XX 分 |
| 担当者 | 氏名 |

## 影響の概要

（どの機能が、どのユーザーに、どの程度影響したか）

## タイムライン

| 時刻 | 出来事 |
|---|---|
| HH:MM | アラート発火 / 最初の異常検知 |
| HH:MM | 担当者が対応開始 |
| HH:MM | 根本原因の特定 |
| HH:MM | 暫定対応を実施 |
| HH:MM | サービス復旧確認 |
| HH:MM | 対応完了 |

## 根本原因 (Root Cause)

**直接原因:**
（例: RDS のディスク容量が枯渇し、新規レコードの INSERT が失敗した）

**根本原因:**
（例: ディスク使用量のアラートが未設定だった）

## 対応内容

### 暫定対応

### 恒久対応

## 再発防止策 (Action Items)

| # | アクション | 担当 | 期限 | 状態 |
|---|---|---|---|---|
| 1 | | | YYYY-MM-DD | 未着手 |

## 学んだこと

- 良かった点:
- 改善点:
- 監視・アラートの改善点:
```

---

## 6. 定期確認チェックリスト

### 日次確認

- [ ] CloudWatch の ERROR レベルログ件数が前日比で異常増加していないか
- [ ] API P99 レイテンシが SLO 内か
- [ ] EC2 CPU / RDS CPU が正常範囲内か

### 週次確認

- [ ] SLO 達成率のレビュー
- [ ] ログのストレージ使用量の確認
- [ ] セキュリティ: JWT 認証失敗の異常なパターンがないか

### 月次確認

- [ ] 全インシデントのポストモーテム Action Items の完了状況確認
- [ ] SLO 見直しの検討
- [ ] CloudWatch アラートの有効性レビュー
