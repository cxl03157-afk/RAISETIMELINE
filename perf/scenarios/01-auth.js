/**
 * 認証シナリオ
 * 対象: POST /api/auth/login
 * 目的: 同時ログインのスループットとレイテンシを計測する
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { thresholds, BASE_URL, PERF_USER_COUNT, PERF_PASSWORD } from '../lib/config.js'
import { registerUser } from '../lib/auth.js'

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    ...thresholds,
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
  },
}

export function setup() {
  const users = []
  for (let i = 0; i < PERF_USER_COUNT; i++) {
    const username = `perf_auth_${String(i).padStart(3, '0')}`
    users.push(registerUser(username, i))
  }
  return { users }
}

export default function (data) {
  // __VU は 1 始まりのため -1 してからインデックスを算出
  const user = data.users[(__VU - 1) % data.users.length]

  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: user.email, password: PERF_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  )

  check(res, {
    'status 200': (r) => r.status === 200,
    'token exists': (r) => !!r.json('token'),
  })

  sleep(1)
}
