const { execSync } = require('child_process')

// docker-compose.yml の container_name に合わせたデフォルト値
// 環境によって異なる場合は DB_CONTAINER=your-name node cleanup.js で上書き
const DB_CONTAINER = process.env.DB_CONTAINER || 'raisetimeline-db'

// 外部キー制約を考慮した削除順序
const SQL = [
  "DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'perf_%');",
  "DELETE FROM follows WHERE follower_id IN (SELECT id FROM users WHERE username LIKE 'perf_%') OR followee_id IN (SELECT id FROM users WHERE username LIKE 'perf_%');",
  "DELETE FROM likes WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'perf_%') OR post_id IN (SELECT id FROM posts WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'perf_%'));",
  "DELETE FROM comments WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'perf_%') OR post_id IN (SELECT id FROM posts WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'perf_%'));",
  "DELETE FROM post_images WHERE post_id IN (SELECT id FROM posts WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'perf_%'));",
  "DELETE FROM posts WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'perf_%');",
  "DELETE FROM users WHERE username LIKE 'perf_%';",
].join(' ')

try {
  execSync(
    `docker exec ${DB_CONTAINER} psql -U raisetimeline -d raisetimeline -c "${SQL}"`,
    { stdio: 'inherit' }
  )
  console.log('[cleanup] perf_ テストデータを削除しました')
} catch (e) {
  console.error(`[cleanup] 失敗（DB_CONTAINER="${DB_CONTAINER}" が起動していない可能性）:`, e.message)
  process.exit(1)
}
