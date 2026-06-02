import { test, expect } from '@playwright/test'

// テスト実行ごとにユニークなIDでデータ衝突を防ぐ
const uid = Date.now()

test.describe('認証フロー', () => {
  // ─── 新規登録 ────────────────────────────────────────────────
  test.describe('新規登録 (/register)', () => {
    test('正常登録 → /home にリダイレクト', async ({ page }) => {
      await page.goto('/register')
      await expect(page.getByText('アカウント作成')).toBeVisible()

      await page.getByLabel('ユーザー名').fill(`e2e_reg${uid}`)
      await page.getByLabel('表示名').fill(`E2E Register User ${uid}`)
      await page.getByLabel('メールアドレス').fill(`e2e_reg${uid}@example.com`)
      await page.getByLabel('パスワード', { exact: true }).fill('Password123')
      await page.getByLabel('パスワード（確認）').fill('Password123')
      await page.getByRole('button', { name: '登録する' }).click()

      await expect(page).toHaveURL('/home', { timeout: 10000 })
    })

    test('未入力フィールドがある → クライアントエラー表示', async ({ page }) => {
      await page.goto('/register')

      await page.getByLabel('メールアドレス').fill('incomplete@example.com')
      await page.getByRole('button', { name: '登録する' }).click()

      await expect(page.getByRole('alert')).toContainText('すべての項目を入力してください')
    })

    test('パスワード不一致 → エラー表示', async ({ page }) => {
      await page.goto('/register')

      await page.getByLabel('ユーザー名').fill(`e2e_mis${uid}`)
      await page.getByLabel('表示名').fill('Mismatch User')
      await page.getByLabel('メールアドレス').fill(`e2e_mis${uid}@example.com`)
      await page.getByLabel('パスワード', { exact: true }).fill('Password123')
      await page.getByLabel('パスワード（確認）').fill('DifferentPass456')
      await page.getByRole('button', { name: '登録する' }).click()

      await expect(page.getByRole('alert')).toContainText('パスワードが一致しません')
    })

    test('パスワード 8 文字未満 → エラー表示', async ({ page }) => {
      await page.goto('/register')

      await page.getByLabel('ユーザー名').fill(`e2e_short${uid}`)
      await page.getByLabel('表示名').fill('Short Pass User')
      await page.getByLabel('メールアドレス').fill(`e2e_short${uid}@example.com`)
      await page.getByLabel('パスワード', { exact: true }).fill('short')
      await page.getByLabel('パスワード（確認）').fill('short')
      await page.getByRole('button', { name: '登録する' }).click()

      await expect(page.getByRole('alert')).toContainText('パスワードは8文字以上')
    })

    test('重複ユーザー名 → サーバーエラー表示', async ({ page }) => {
      const dupUsername = `e2e_dup${uid}`
      const dupEmail1 = `e2e_dup1_${uid}@example.com`
      const dupEmail2 = `e2e_dup2_${uid}@example.com`

      // 1 回目（成功）
      await page.goto('/register')
      await page.getByLabel('ユーザー名').fill(dupUsername)
      await page.getByLabel('表示名').fill('Dup User First')
      await page.getByLabel('メールアドレス').fill(dupEmail1)
      await page.getByLabel('パスワード', { exact: true }).fill('Password123')
      await page.getByLabel('パスワード（確認）').fill('Password123')
      await page.getByRole('button', { name: '登録する' }).click()
      await expect(page).toHaveURL('/home', { timeout: 10000 })

      // localStorage をクリアして未認証状態にする
      await page.evaluate(() => localStorage.clear())

      // 2 回目（同じユーザー名で重複登録）
      await page.goto('/register')
      await page.getByLabel('ユーザー名').fill(dupUsername)
      await page.getByLabel('表示名').fill('Dup User Second')
      await page.getByLabel('メールアドレス').fill(dupEmail2)
      await page.getByLabel('パスワード', { exact: true }).fill('Password123')
      await page.getByLabel('パスワード（確認）').fill('Password123')
      await page.getByRole('button', { name: '登録する' }).click()

      await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 })
    })
  })

  // ─── ログイン ────────────────────────────────────────────────
  test.describe('ログイン (/login)', () => {
    const loginUid = uid + 1
    const loginEmail = `e2e_login${loginUid}@example.com`
    const loginPassword = 'Password123'

    // 事前にログイン用ユーザーを作成
    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage()
      await page.goto('/register')
      await page.getByLabel('ユーザー名').fill(`e2e_login${loginUid}`)
      await page.getByLabel('表示名').fill(`E2E Login User ${loginUid}`)
      await page.getByLabel('メールアドレス').fill(loginEmail)
      await page.getByLabel('パスワード', { exact: true }).fill(loginPassword)
      await page.getByLabel('パスワード（確認）').fill(loginPassword)
      await page.getByRole('button', { name: '登録する' }).click()
      await page.waitForURL('/home', { timeout: 10000 })
      await page.close()
    })

    test('正常ログイン → /home にリダイレクト', async ({ page }) => {
      await page.goto('/login')
      await expect(page.getByText('ログイン')).toBeVisible()

      await page.getByLabel('メールアドレス').fill(loginEmail)
      await page.getByLabel('パスワード').fill(loginPassword)
      await page.getByRole('button', { name: 'ログイン' }).click()

      await expect(page).toHaveURL('/home', { timeout: 10000 })
    })

    test('誤パスワード → エラー表示', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel('メールアドレス').fill(loginEmail)
      await page.getByLabel('パスワード').fill('wrongpassword')
      await page.getByRole('button', { name: 'ログイン' }).click()

      await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 })
    })

    test('未入力 → クライアントエラー表示', async ({ page }) => {
      await page.goto('/login')

      await page.getByRole('button', { name: 'ログイン' }).click()

      await expect(page.getByRole('alert')).toContainText('メールアドレスとパスワードを入力してください')
    })

    test('認証済みで /login にアクセス → /home にリダイレクト', async ({ page }) => {
      await page.goto('/login')
      await page.getByLabel('メールアドレス').fill(loginEmail)
      await page.getByLabel('パスワード').fill(loginPassword)
      await page.getByRole('button', { name: 'ログイン' }).click()
      await page.waitForURL('/home', { timeout: 10000 })

      // 認証済み状態で /login にアクセスすると /home に戻る
      await page.goto('/login')
      await expect(page).toHaveURL('/home')
    })
  })
})
