# サーバー起動ルール

このプロジェクトでサーバーを起動する際は以下のルールを**必ず**守ること。

## 指定ポート

| サービス | ポート |
|---------|--------|
| Spring Boot（バックエンド） | 8080 |
| Vite（フロントエンド） | 5173 |
| PostgreSQL（Docker） | 5432 |

## ポート競合時のルール

**別ポートへの変更は禁止。必ず指定ポートを使用する。**

ポート競合が発生した場合は、そのポートを使用しているプロセスを停止してから起動する：

```bash
# ポート 8080 を使用しているプロセスを停止
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# ポート 5173 を使用しているプロセスを停止
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
```

## 起動手順

```bash
# 1. PostgreSQL（Docker）
docker compose up -d

# 2. バックエンド（Spring Boot） — port 8080
cd backend
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-25.jdk/Contents/Home ./gradlew bootRun

# 3. フロントエンド（Vite） — port 5173
cd frontend
npm run dev
```
