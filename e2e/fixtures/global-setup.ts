import { execSync } from 'child_process'

async function globalSetup() {
  // CI はジョブごとに PostgreSQL コンテナが新規作成されるためクリーンアップ不要
  if (process.env.CI) {
    return
  }

  // ローカル: e2e_ プレフィックスのテストデータを Docker コンテナ経由でクリーンアップ
  const sql = [
    "DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'e2e_%');",
    "DELETE FROM follows WHERE follower_id IN (SELECT id FROM users WHERE username LIKE 'e2e_%') OR followee_id IN (SELECT id FROM users WHERE username LIKE 'e2e_%');",
    "DELETE FROM likes WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'e2e_%') OR post_id IN (SELECT id FROM posts WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'e2e_%'));",
    "DELETE FROM comments WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'e2e_%') OR post_id IN (SELECT id FROM posts WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'e2e_%'));",
    "DELETE FROM post_images WHERE post_id IN (SELECT id FROM posts WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'e2e_%'));",
    "DELETE FROM posts WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'e2e_%');",
    "DELETE FROM users WHERE username LIKE 'e2e_%';",
  ].join(' ')

  try {
    execSync(
      `docker exec raisetimeline-db-1 psql -U raisetimeline -d raisetimeline -c "${sql}"`,
      { stdio: 'pipe' },
    )
    console.log('[global-setup] Test data cleaned up')
  } catch (e) {
    console.warn('[global-setup] Cleanup skipped (Docker container may not be running):', e)
  }
}

export default globalSetup
