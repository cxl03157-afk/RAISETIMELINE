/**
 * フルジャーニーシナリオ（最も現実的なユーザー行動を模倣）
 * フロー: ログイン → タイムライン取得 → 投稿作成 → いいね → タイムライン再取得
 * 目的: 実際のユーザー操作に近い複合的な負荷をかけてシステム全体の応答を確認する
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { thresholds, BASE_URL, PERF_USER_COUNT, PERF_PASSWORD } from '../lib/config.js'
import { registerUser, login, authHeaders } from '../lib/auth.js'

export const options = {
  stages: [
    { duration: '15s', target: 10 }, // 軽い Ramp-up（まず 10 VU で安定を確認）
    { duration: '30s', target: 10 }, // Steady at 10
    { duration: '15s', target: 20 }, // 20 VU に増加
    { duration: '15s', target: 20 }, // Steady at 20
    { duration: '15s', target: 0  }, // Ramp-down
  ],
  thresholds: {
    ...thresholds,
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
  },
}

export function setup() {
  const users = []
  for (let i = 0; i < PERF_USER_COUNT; i++) {
    const username = `perf_fj_${String(i).padStart(3, '0')}`
    users.push(registerUser(username, i))
  }
  return { users }
}

export default function (data) {
  const user = data.users[(__VU - 1) % data.users.length]

  // Step 1: ログイン（毎イテレーションでトークン再取得）
  const token = login(user.email, PERF_PASSWORD)
  sleep(0.5)

  // Step 2: タイムライン取得
  const timelineRes = http.get(
    `${BASE_URL}/api/posts?page=0&size=20`,
    authHeaders(token)
  )
  check(timelineRes, { 'timeline 200': (r) => r.status === 200 })
  sleep(1)

  // Step 3: 投稿作成
  const postRes = http.post(
    `${BASE_URL}/api/posts`,
    JSON.stringify({ content: `perf full journey post - VU${__VU} ${new Date().toISOString()}` }),
    authHeaders(token)
  )
  check(postRes, { 'post 201': (r) => r.status === 201 })
  const postId = postRes.json('id')
  sleep(0.5)

  // Step 4: 他ユーザーの最初の投稿にいいね（タイムラインに投稿があれば）
  const posts = timelineRes.json('content') || []
  const otherPost = posts.find(p => p.user?.username !== user.username)
  if (otherPost) {
    const likeRes = http.post(
      `${BASE_URL}/api/posts/${otherPost.id}/likes`,
      null,
      authHeaders(token)
    )
    check(likeRes, { 'like 201 or 409': (r) => r.status === 201 || r.status === 409 })
    sleep(0.3)
  }

  // Step 5: タイムライン再取得（投稿後の反映確認）
  const refreshRes = http.get(
    `${BASE_URL}/api/posts?page=0&size=20`,
    authHeaders(token)
  )
  check(refreshRes, { 'refresh timeline 200': (r) => r.status === 200 })
  sleep(1)

  // 作成した投稿を削除（teardown ではなくイテレーション内で対処）
  if (postId) {
    http.del(`${BASE_URL}/api/posts/${postId}`, null, authHeaders(token))
  }
}
