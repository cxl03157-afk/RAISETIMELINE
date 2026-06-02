/**
 * 投稿作成シナリオ（書き込み系）
 * 対象: POST /api/posts（テキスト投稿のみ、S3 画像なし）
 * 目的: 同時書き込み時のスループットとレイテンシを計測する
 * 注意: 書き込みは DB 負荷が高いため VU を小さく設定して段階的に増加する
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { thresholds, BASE_URL, PERF_USER_COUNT, PERF_PASSWORD } from '../lib/config.js'
import { registerUser, authHeaders } from '../lib/auth.js'

export const options = {
  stages: [
    { duration: '10s', target: 5  }, // 軽い Ramp-up
    { duration: '20s', target: 10 }, // Steady（まず 10 VU で確認）
    { duration: '10s', target: 0  }, // Ramp-down
  ],
  thresholds: {
    ...thresholds,
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
  },
}

export function setup() {
  const users = []
  for (let i = 0; i < PERF_USER_COUNT; i++) {
    const username = `perf_write_${String(i).padStart(3, '0')}`
    users.push(registerUser(username, i))
  }
  return { users }
}

export default function (data) {
  const user = data.users[(__VU - 1) % data.users.length]
  const content = `perf write test - VU${__VU} iter${__ITER} ${new Date().toISOString()}`

  const res = http.post(
    `${BASE_URL}/api/posts`,
    JSON.stringify({ content }),
    authHeaders(user.token)
  )

  check(res, {
    'status 201': (r) => r.status === 201,
    'id exists': (r) => !!r.json('id'),
  })

  sleep(1)
}
