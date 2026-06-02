#!/bin/bash
set -e

SCENARIO=${1:-"04-full-journey"}

cleanup() {
  echo "=== Cleanup ==="
  node scripts/cleanup.js
}
# 正常終了・エラー終了・Ctrl+C すべてで cleanup を実行
trap cleanup EXIT

echo "=== Cleanup (before) ==="
node scripts/cleanup.js

echo "=== Running: scenarios/${SCENARIO}.js ==="
k6 run "scenarios/${SCENARIO}.js" "${@:2}"
