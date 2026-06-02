import { test, expect, type Page } from '@playwright/test'

// Date.now() は13桁でユーザー名20文字制限を超えるため末尾6桁を使用
const uid = (Date.now() + 2) % 1000000
const username = `e2e_tl${uid}`
const email = `e2e_tl${uid}@example.com`
const password = 'Password123'

// ヘルパー: ログイン済み状態にする
async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill(email)
  await page.getByLabel('パスワード').fill(password)
  await page.getByRole('button', { name: 'ログイン' }).click()
  await page.waitForURL('/home', { timeout: 10000 })
}

test.describe('タイムライン操作', () => {
  // テストスイート全体で 1 回だけユーザーを作成
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('/register')
    await page.getByLabel('ユーザー名').fill(username)
    await page.getByLabel('表示名').fill(`E2E Timeline User ${uid}`)
    await page.getByLabel('メールアドレス').fill(email)
    await page.getByLabel('パスワード', { exact: true }).fill(password)
    await page.getByLabel('パスワード（確認）').fill(password)
    await page.getByRole('button', { name: '登録する' }).click()
    await page.waitForURL('/home', { timeout: 10000 })
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  // ─── タイムライン表示 ─────────────────────────────────────
  test.describe('タイムライン表示', () => {
    test('/home にアクセスするとタブが表示される', async ({ page }) => {
      await expect(page.getByRole('tab', { name: '全体' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'フォロー中' })).toBeVisible()
    })

    test('未認証で /home にアクセスすると /login にリダイレクト', async ({ page }) => {
      await page.evaluate(() => localStorage.clear())
      await page.goto('/home')
      await expect(page).toHaveURL('/login')
    })

    test('「フォロー中」タブに切り替えできる', async ({ page }) => {
      await page.getByRole('tab', { name: 'フォロー中' }).click()
      await expect(
        page.getByRole('tab', { name: 'フォロー中' }),
      ).toHaveAttribute('aria-selected', 'true')
    })
  })

  // ─── 投稿作成 ─────────────────────────────────────────────
  test.describe('投稿作成', () => {
    test('FAB をクリックするとモーダルが開く', async ({ page }) => {
      await page.getByRole('button', { name: '投稿' }).click()
      await expect(page.getByText('新しい投稿')).toBeVisible()
    })

    test('テキスト未入力では「投稿する」ボタンが無効', async ({ page }) => {
      await page.getByRole('button', { name: '投稿' }).click()
      await expect(page.getByRole('button', { name: '投稿する' })).toBeDisabled()
    })

    test('テキスト入力後に「投稿する」が有効になる', async ({ page }) => {
      await page.getByRole('button', { name: '投稿' }).click()
      await page.getByPlaceholder('いまどうしてる？').fill('テスト投稿です')
      await expect(page.getByRole('button', { name: '投稿する' })).toBeEnabled()
    })

    test('投稿するとタイムラインに表示される', async ({ page }) => {
      const content = `E2E テスト投稿 ${uid} - ${new Date().toISOString()}`

      await page.getByRole('button', { name: '投稿' }).click()
      await page.getByPlaceholder('いまどうしてる？').fill(content)
      await page.getByRole('button', { name: '投稿する' }).click()

      // モーダルが閉じる
      await expect(page.getByText('新しい投稿')).not.toBeVisible({ timeout: 5000 })

      // タイムラインに投稿が表示される
      await expect(page.getByText(content)).toBeVisible({ timeout: 10000 })
    })

    test('280 文字超では「投稿する」ボタンが無効', async ({ page }) => {
      await page.getByRole('button', { name: '投稿' }).click()
      await page.getByPlaceholder('いまどうしてる？').fill('あ'.repeat(281))
      await expect(page.getByRole('button', { name: '投稿する' })).toBeDisabled()
    })

    test('モーダルを閉じるとテキストがリセットされる', async ({ page }) => {
      await page.getByRole('button', { name: '投稿' }).click()
      await page.getByPlaceholder('いまどうしてる？').fill('消えるはずのテキスト')
      // × ボタンで閉じる
      await page.getByRole('button').filter({ hasText: '' }).first().click()

      // 再度モーダルを開くとテキストが空
      await page.getByRole('button', { name: '投稿' }).click()
      await expect(page.getByPlaceholder('いまどうしてる？')).toHaveValue('')
    })
  })
})
