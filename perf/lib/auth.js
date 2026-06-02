import http from 'k6/http'
import { check } from 'k6'
import { BASE_URL, PERF_PASSWORD } from './config.js'

/**
 * ユーザーを登録してトークン情報を返す。
 * setup() から呼ぶことを想定（テスト実行前の1回のみ）。
 */
export function registerUser(username, index) {
  const payload = JSON.stringify({
    username,
    displayName: `PerfUser ${index}`,
    email: `${username}@perf.example.com`,
    password: PERF_PASSWORD,
  })
  const params = { headers: { 'Content-Type': 'application/json' } }
  const res = http.post(`${BASE_URL}/api/auth/register`, payload, params)
  check(res, { 'register 201': (r) => r.status === 201 })
  return {
    token: res.json('token'),
    refreshToken: res.json('refreshToken'),
    userId: res.json('user.id'),
    username,
    email: `${username}@perf.example.com`,
  }
}

/** ログインして JWT アクセストークンを返す */
export function login(email, password) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  )
  check(res, { 'login 200': (r) => r.status === 200 })
  return res.json('token')
}

/** Bearer トークン付きの JSON ヘッダーを返す */
export function authHeaders(token) {
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }
}

/**
 * POST /api/posts 用のマルチパートボディを返す。
 * http.file() は filename を付けて Spring が 500 を返すため、
 * filename なしのマルチパートを手動で構築する。
 */
export function postMultipart(content, token) {
  const boundary = 'k6boundary'
  const body = `--${boundary}\r\nContent-Disposition: form-data; name="content"\r\n\r\n${content}\r\n--${boundary}--\r\n`
  return {
    body,
    params: {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${token}`,
      },
    },
  }
}
