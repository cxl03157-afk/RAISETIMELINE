/**
 * タイムライン読み込みシナリオ（最も重要な読み取り系エンドポイント）
 * 対象: GET /api/posts?page=0&size=20
 * 目的: 同時タイムライン取得時のスループットとレイテンシを計測する
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { thresholds, BASE_URL, PERF_USER_COUNT, PERF_PASSWORD } from '../lib/config.js'
import { registerUser, authHeaders } from '../lib/auth.js'

const SEED_POST_COUNT = 100 // タイムラインに実態に近いデータを用意

export const options = {
  vus: 100,
  duration: '60s',
  thresholds: {
    ...thresholds,
    http_req_duration: ['p(95)<1000', 'p(99)<3000'],
  },
}

export function setup() {
  // テストユーザーを作成
  const users = []
  for (let i = 0; i < PERF_USER_COUNT; i++) {
    const username = `perf_tl_${String(i).padStart(3, '0')}`
    users.push(registerUser(username, i))
  }

  // 最初のユーザーで投稿シードを作成（タイムラインに実態に近いデータを用意）
  const seedUser = users[0]
  for (let i = 0; i < SEED_POST_COUNT; i++) {
    http.post(
      `${BASE_URL}/api/posts`,
      JSON.stringify({ content: `perf timeline seed post #${i + 1}` }),
      authHeaders(seedUser.token)
    )
  }

  return { users }
}

export default function (data) {
  const user = data.users[(__VU - 1) % data.users.length]

  const res = http.get(
    `${BASE_URL}/api/posts?page=0&size=20`,
    authHeaders(user.token)
  )

  check(res, {
    'status 200': (r) => r.status === 200,
    'content exists': (r) => r.json('content') !== null,
  })

  sleep(1)
}

export function teardown(data) {
  // ユーザーの投稿を API 経由で削除（全削除は cleanup.js が担当）
  // teardown では k6 のシングルスレッドで実行されるため、代表ユーザーの投稿のみ対処
  const seedUser = data.users[0]
  const postsRes = http.get(
    `${BASE_URL}/api/users/${seedUser.username}/posts`,
    authHeaders(seedUser.token)
  )
  if (postsRes.status === 200) {
    const posts = postsRes.json('content') || []
    posts.forEach(post => {
      http.del(`${BASE_URL}/api/posts/${post.id}`, null, authHeaders(seedUser.token))
    })
  }
}
