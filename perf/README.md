# RAISETIMELINE パフォーマンステスト

## 概要

| ツール | 対象 | 目的 |
|---|---|---|
| **k6** | バックエンド API | API スループット / レイテンシの負荷テスト |
| **Playwright** | フロントエンド | ページロード時間 / Web Vitals 計測 |

CI には組み込まず、任意のタイミングで手動実行します。

---

## 前提条件

### インストール（初回のみ）

```bash
brew install k6

cd perf
npm install
npx playwright install chromium
```

### 起動

```bash
# バックエンド（必須）
cd backend && docker-compose up -d
./gradlew bootRun &

# フロントエンド（ブラウザテスト時のみ必須）
cd frontend && npm run dev &
```

---

## 実行コマンド

```bash
cd perf

npm run perf:auth       # 認証エンドポイント負荷テスト
npm run perf:timeline   # タイムライン読み込み負荷テスト
npm run perf:write      # 投稿作成負荷テスト
npm run perf:full       # フルジャーニー（最も現実的なシナリオ）
npm run perf:browser    # ブラウザページ性能計測（フロントエンド + バックエンド起動必要）
npm run perf:cleanup    # テストデータのみ削除
```

### VU 数・時間をカスタムする場合

```bash
./run.sh 02-timeline --vus 100 --duration 120s
./run.sh 04-full-journey --vus 30
```

---

## k6 結果の読み方

```
http_req_duration: avg=234ms min=12ms med=180ms max=3120ms p(90)=420ms p(95)=680ms p(99)=1400ms
```

| 指標 | 意味 | 役割 |
|---|---|---|
| `p(95)` | 95% のリクエストがその時間以内に完了 | **合否判定の主基準** |
| `p(99)` | 99% のリクエストがその時間以内に完了 | 外れ値ユーザーの体験確認（参考指標） |
| `avg` | 平均値。外れ値に引きずられやすい | 参考のみ |

**例:** `p(95)=680ms` が閾値 1000ms 以内 → テスト OK
`p(99)=1400ms` が閾値 3000ms 以内 → 参考値として記録

---

## 閾値一覧

| シナリオ | VU（最大） | p95 上限 | p99 上限 |
|---|---|---|---|
| 認証 (`01-auth`) | 50 | 500ms | 1500ms |
| タイムライン (`02-timeline`) | 100 | 1000ms | 3000ms |
| 投稿作成 (`03-post-write`) | 10 | 2000ms | 5000ms |
| フルジャーニー (`04-full-journey`) | 20 | 2000ms | 5000ms |

---

## ブラウザ性能テスト結果

`npm run perf:browser` 実行後に `perf/browser-report/index.html` を開く。

計測指標:
- `domContentLoaded` — DOM 解析完了（ms）
- `load` — 全リソース読み込み完了（ms）
- `fcp` — First Contentful Paint（ms）
- `jsHeapMB` — JavaScript ヒープ使用量（MB）

---

## テストデータ

- `perf_` プレフィックスのユーザー・投稿・いいねを使用
- テスト前後に `cleanup.js` が自動で全削除（`trap cleanup EXIT` で中断時も保証）
- Docker コンテナ名が異なる場合: `DB_CONTAINER=your-name npm run perf:cleanup`

### クリーンアップ後の確認

```bash
docker exec raisetimeline-db psql -U raisetimeline -d raisetimeline \
  -c "SELECT COUNT(*) FROM users WHERE username LIKE 'perf_%';"
# → 0 であること

docker exec raisetimeline-db psql -U raisetimeline -d raisetimeline \
  -c "SELECT COUNT(*) FROM posts p JOIN users u ON p.user_id = u.id WHERE u.username LIKE 'perf_%';"
# → 0 であること
```
