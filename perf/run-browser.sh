#!/bin/bash
set -e
# 前提: フロントエンド（:5173）とバックエンド（:8080）が起動済みであること

cleanup() {
  echo "=== Cleanup ==="
  cd "$(dirname "$0")" && node scripts/cleanup.js
}
# Playwright 失敗・Ctrl+C でも cleanup を実行
trap cleanup EXIT

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Cleanup (before) ==="
cd "$SCRIPT_DIR" && node scripts/cleanup.js

echo "=== Creating browser test user and seeding posts ==="
node scripts/create-browser-user.js

echo "=== Running browser performance tests ==="
cd "$SCRIPT_DIR/browser" && npx playwright test
