# 監視設計書

> **スコープ注記:**
> 本ドキュメントは**ログベースの監視設計**を対象とする。
> メトリクス収集（Spring Boot Actuator / Micrometer）および APM（Datadog APM / トレーシング）は後続フェーズで別途整備する。

---

## 1. 監視の目的

本番環境の RAISETIMELINE において、以下を達成するための監視を構築する。

- ユーザーに影響する障害を早期に検知する
- パフォーマンス劣化を SLO 違反前に検知する
- 障害の根本原因を迅速に特定できるデータを蓄積する

---

## 2. SLI / SLO 定義

### 2.1 可用性 (Availability)

| 指標 (SLI) | 目標 (SLO) | 計算式 |
|---|---|---|
| API 成功率 | 99.5% / 月 | `(2xx+3xx+4xx レスポンス数) / 全リクエスト数` ※ 5xx のみ失敗とカウント |
| 認証 API 成功率 | 99.9% / 月 | `/api/auth/**` エンドポイントの 5xx 率 |

### 2.2 レイテンシ (Latency)

| 指標 (SLI) | 目標 (SLO) | 計算式 |
|---|---|---|
| API P50 レスポンスタイム | < 200ms | アクセスログの duration 中央値 |
| API P99 レスポンスタイム | < 2000ms | アクセスログの duration 99パーセンタイル |
| タイムライン取得 P50 | < 300ms | `GET /api/posts` のレスポンスタイム中央値 |

### 2.3 エラー率 (Error Rate)

| 指標 (SLI) | 目標 (SLO) | 計算式 |
|---|---|---|
| 5xx エラー率 | < 0.5% / 時間 | `5xx レスポンス数 / 全リクエスト数` |
| JWT 認証失敗率 | < 5% / 時間 | WARN ログ `JWT validation failed` 件数 / 認証付きリクエスト数 |

---

## 3. ゴールデンシグナル監視

Google SRE の 4 つのゴールデンシグナルに基づいた監視設計。

### 3.1 Latency（レイテンシ）

`RequestLoggingFilter` が出力するアクセスログの duration 値を集計する。

```sql
-- CloudWatch Logs Insights: P50/P95/P99 の時系列
fields @timestamp, message
| parse message "* * * *ms" as method, path, status, duration
| stats pct(toint(duration), 50) as p50,
        pct(toint(duration), 95) as p95,
        pct(toint(duration), 99) as p99
  by bin(5min)
```

**アラート条件:** P99 が 2000ms を 5分間超え続けた場合 → P2 アラート

### 3.2 Traffic（トラフィック）

```sql
fields @timestamp, message
| filter ispresent(message)
| stats count() as requestCount by bin(1min)
```

**監視指標:**
- リクエスト数の急増（通常の 3 倍以上）→ スパイク / 攻撃の可能性
- リクエスト数の急減（通常の 50% 以下）→ サービス停止の可能性

### 3.3 Errors（エラー）

```sql
-- 5xx エラー件数の時系列
fields @timestamp, message
| parse message "* * * *ms" as method, path, status, duration
| filter toint(status) >= 500
| stats count() as errorCount by bin(1min)
```

**アラート条件:** 5xx エラーが 1分間に 10件以上 → P2 アラート

### 3.4 Saturation（飽和度）

EC2 の CloudWatch メトリクス（将来的に Actuator / Micrometer で詳細化）：

| メトリクス | 閾値 | アラート種別 |
|---|---|---|
| EC2 CPU 使用率 | > 80% が 10分継続 | P2 |
| RDS CPU 使用率 | > 70% が 5分継続 | P2 |
| RDS 接続数 | 最大数の 80% | P2 |

---

## 4. アラート設計

### 4.1 重要度定義

| Priority | 定義 | 対応時間 | 通知先 |
|---|---|---|---|
| **P1** | サービス全体が停止・認証不能 | 即時（15分以内） | 電話・SMS・Slack |
| **P2** | 一部機能障害・パフォーマンス大幅劣化 | 1時間以内 | Slack |
| **P3** | 軽微な劣化・Warning 増加 | 翌営業日 | Slack（低優先） |

### 4.2 アラートルール一覧

| アラート名 | 条件 | 優先度 |
|---|---|---|
| API Down | ヘルスチェック失敗（3回連続） | P1 |
| High 5xx Error Rate | 5xx > 1% for 5min | P2 |
| High Latency P99 | P99 > 2s for 5min | P2 |
| JWT Auth Failures | JWT 失敗 > 50件/分 | P2 |
| High EC2 CPU | CPU > 80% for 10min | P2 |
| High RDS CPU | CPU > 70% for 5min | P2 |
| S3 Upload Errors | S3 ERROR ログ > 5件/分 | P2 |
| Low Request Rate | リクエスト < 通常の 10% for 10min | P3 |

---

## 5. ダッシュボード構成（CloudWatch）

**行 1: サービス健全性**
- API 成功率（SLO: 99.5%）のゲージ
- 現在の 5xx エラー率

**行 2: レイテンシ**
- P50 / P95 / P99 の時系列グラフ（過去 1 時間）
- エンドポイント別レイテンシ上位 10 件

**行 3: トラフィック**
- リクエスト数/分 の時系列グラフ
- エンドポイント別リクエスト数

**行 4: インフラ**
- EC2 CPU / RDS CPU / RDS 接続数

**行 5: ビジネスメトリクス**
- 新規ユーザー登録数/時
- 投稿作成数/時
- いいね数/時

---

## 6. RAISETIMELINE 固有のビジネスメトリクス

ログベースで CloudWatch Logs Insights を使って集計する。

| メトリクス | ログ条件 | クエリ例 |
|---|---|---|
| 新規登録ユーザー数 | `message like /User registered/` | count() by bin(1h) |
| ログイン成功数 | `message like /Login success/` | count() by bin(1h) |
| ログイン失敗数 | `message like /Login failed/` | count() by bin(1h) |
| 投稿作成数 | `message like /Post created/` | count() by bin(1h) |
| 投稿削除数 | `message like /Post deleted/` | count() by bin(1h) |
| JWT 認証失敗数 | `message like /JWT validation failed/` | count() by bin(1h) |
| S3 アップロード失敗数 | `level = ERROR and logger_name like /S3Service/` | count() by bin(1h) |

---

## 7. 将来の拡張（後続フェーズ）

以下は本フェーズのスコープ外。後続 Issue で整備予定：

- **Spring Boot Actuator**: ヘルスチェック、JVM メトリクス（ヒープ、GC）のエンドポイント公開
- **Micrometer**: カスタムメトリクス収集（リクエスト数、エラー数を自動計測）
- **Datadog APM**: 分散トレーシング、トレース・ログ・メトリクスの相関分析
- **SLO ダッシュボード**: エラーバジェット消費率の自動計算・可視化
