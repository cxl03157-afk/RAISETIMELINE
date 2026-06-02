export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'

export const PERF_USER_COUNT = 20  // setup() で作成するテストユーザー数
export const PERF_PASSWORD = 'PerfTest1!'

// p95: 95% のリクエストがその時間以内に完了 → メインの pass/fail 判定基準
// p99: 99% のリクエストがその時間以内に完了 → 外れ値ユーザーの体験確認（参考指標）
export const thresholds = {
  http_req_duration: [
    'p(95)<1000',
    'p(99)<3000',
  ],
  http_req_failed: ['rate<0.01'],
}
