import { test, expect, type Page } from '@playwright/test'

// PerformanceNavigationTiming (performance.timing は deprecated)
interface NavMetrics {
  domContentLoaded: number
  load: number
  fcp: number
  jsHeapMB: number
}

/**
 * ページのナビゲーション性能指標を計測する。
 * - domContentLoaded / load: PerformanceNavigationTiming（performance.timing の後継標準 API）
 * - FCP: PerformancePaintTiming（first-contentful-paint）
 * - jsHeapMB: CDP Session の Performance.getMetrics（page.metrics() は deprecated）
 */
async function measureNavigation(page: Page, url: string): Promise<NavMetrics> {
  await page.goto(url, { waitUntil: 'networkidle' })

  const timing = await page.evaluate((): Omit<NavMetrics, 'jsHeapMB'> => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? -1
    return {
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
      load: Math.round(nav.loadEventEnd),
      fcp: Math.round(fcp),
    }
  })

  // JS ヒープ: Playwright 1.44 で page.metrics() が deprecated のため CDP セッションを使用
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Performance.enable')
  const { metrics } = await cdp.send('Performance.getMetrics')
  const heapEntry = (metrics as Array<{ name: string; value: number }>)
    .find(m => m.name === 'JSHeapUsedSize')
  const jsHeapMB = heapEntry ? Math.round(heapEntry.value / 1024 / 1024 * 10) / 10 : 0

  const result: NavMetrics = { ...timing, jsHeapMB }
  console.log(`[perf] ${url}:`, result)
  return result
}

test.describe('ページロード性能計測', () => {
  // ─── 認証不要ページ（ベースライン）──────────────────────────────

  test('ログインページ (/login)', async ({ page }) => {
    const m = await measureNavigation(page, '/login')
    expect(m.domContentLoaded, `domContentLoaded=${m.domContentLoaded}ms < 1000ms`).toBeLessThan(1000)
    expect(m.load,             `load=${m.load}ms < 2000ms`).toBeLessThan(2000)
  })

  test('新規登録ページ (/register)', async ({ page }) => {
    const m = await measureNavigation(page, '/register')
    expect(m.domContentLoaded, `domContentLoaded=${m.domContentLoaded}ms < 1000ms`).toBeLessThan(1000)
    expect(m.load,             `load=${m.load}ms < 2000ms`).toBeLessThan(2000)
  })

  // ─── 認証後ページ ───────────────────────────────────────────

  test('タイムライン (/home) — 投稿シード済み', async ({ page }) => {
    // create-browser-user.js が事前に 30 件の投稿をシードしていることが前提
    await page.goto('/login')
    await page.getByLabel('メールアドレス').fill('perf_browser_0@perf.example.com')
    await page.getByLabel('パスワード').fill('PerfTest1!')
    await page.getByRole('button', { name: 'ログイン' }).click()
    await page.waitForURL('/home')

    // ハードナビゲーションで純粋なロード時間を計測
    const m = await measureNavigation(page, '/home')
    expect(m.domContentLoaded, `domContentLoaded=${m.domContentLoaded}ms < 2000ms`).toBeLessThan(2000)
    expect(m.load,             `load=${m.load}ms < 4000ms`).toBeLessThan(4000)
    expect(m.jsHeapMB,         `jsHeap=${m.jsHeapMB}MB < 100MB`).toBeLessThan(100)
  })

  test('検索ページ (/search)', async ({ page }) => {
    // 認証済み状態を localStorage に直接注入してページ遷移をスキップ
    await page.goto('/login')
    await page.getByLabel('メールアドレス').fill('perf_browser_0@perf.example.com')
    await page.getByLabel('パスワード').fill('PerfTest1!')
    await page.getByRole('button', { name: 'ログイン' }).click()
    await page.waitForURL('/home')

    const m = await measureNavigation(page, '/search')
    expect(m.domContentLoaded, `domContentLoaded=${m.domContentLoaded}ms < 2000ms`).toBeLessThan(2000)
    expect(m.load,             `load=${m.load}ms < 3000ms`).toBeLessThan(3000)
  })
})
