// Node 22+ 標準 fetch を使用（axios 不要）
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080'
const POST_COUNT = 30 // タイムライン計測用シード投稿数

async function apiPost(path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${path} → ${res.status}: ${text}`)
  }
  return res.json()
}

async function main() {
  // ユーザー登録（既存の場合はログインにフォールバック）
  let token
  try {
    const auth = await apiPost('/api/auth/register', {
      username: 'perf_browser_0',
      displayName: 'Perf Browser User',
      email: 'perf_browser_0@perf.example.com',
      password: 'PerfTest1!',
    })
    token = auth.token
    console.log('[setup] perf_browser_0 を作成しました')
  } catch {
    const auth = await apiPost('/api/auth/login', {
      email: 'perf_browser_0@perf.example.com',
      password: 'PerfTest1!',
    })
    token = auth.token
    console.log('[setup] perf_browser_0 でログインしました（既存ユーザー）')
  }

  // タイムライン計測に実態に近いデータを用意するため POST_COUNT 件投稿
  for (let i = 0; i < POST_COUNT; i++) {
    await apiPost('/api/posts', {
      content: `perf browser seed post #${String(i + 1).padStart(2, '0')} - ${new Date().toISOString()}`,
    }, token)
  }
  console.log(`[setup] 投稿を ${POST_COUNT} 件作成しました`)
}

main().catch(e => {
  console.error('[setup] 失敗:', e.message)
  process.exit(1)
})
