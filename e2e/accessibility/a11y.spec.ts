import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Date.now() は13桁でユーザー名20文字制限を超えるため末尾6桁を使用
const uid = (Date.now() + 4) % 1000000
const email = `e2e_a11y${uid}@example.com`
const password = 'Password123'

test.describe('アクセシビリティチェック', () => {
  // テスト用ユーザーを事前作成
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('/register')
    await page.getByLabel('ユーザー名').fill(`e2e_a11y${uid}`)
    await page.getByLabel('表示名').fill(`E2E A11y User ${uid}`)
    await page.getByLabel('メールアドレス').fill(email)
    await page.getByLabel('パスワード', { exact: true }).fill(password)
    await page.getByLabel('パスワード（確認）').fill(password)
    await page.getByRole('button', { name: '登録する' }).click()
    await page.waitForURL('/home', { timeout: 10000 })
    await page.close()
  })

  test('ログインページにアクセシビリティ違反がない', async ({ page }) => {
    await page.goto('/login')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('新規登録ページにアクセシビリティ違反がない', async ({ page }) => {
    await page.goto('/register')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('タイムラインページにアクセシビリティ違反がない', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('メールアドレス').fill(email)
    await page.getByLabel('パスワード').fill(password)
    await page.getByRole('button', { name: 'ログイン' }).click()
    await page.waitForURL('/home', { timeout: 10000 })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})
