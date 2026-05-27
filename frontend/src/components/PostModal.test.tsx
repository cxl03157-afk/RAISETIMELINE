import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PostModal from './PostModal'

function renderModal(overrides: Partial<React.ComponentProps<typeof PostModal>> = {}) {
  return render(
    <PostModal
      open={true}
      mode="create"
      initialContent=""
      loading={false}
      onClose={vi.fn()}
      onSubmit={vi.fn()}
      {...overrides}
    />
  )
}

describe('PostModal', () => {
  it('open=false → モーダルが非表示', () => {
    renderModal({ open: false })
    expect(screen.queryByText('新しい投稿')).not.toBeInTheDocument()
  })

  it('mode=create → タイトルが「新しい投稿」', () => {
    renderModal({ mode: 'create' })
    expect(screen.getByText('新しい投稿')).toBeInTheDocument()
  })

  it('mode=edit → タイトルが「投稿を編集」', () => {
    renderModal({ mode: 'edit' })
    expect(screen.getByText('投稿を編集')).toBeInTheDocument()
  })

  it('本文空でサブミットボタンが disabled（境界値: 0文字）', () => {
    renderModal({ initialContent: '' })
    const button = screen.getByRole('button', { name: '投稿する' })
    expect(button).toBeDisabled()
  })

  it('本文 1 文字以上でサブミットボタンが enabled', async () => {
    renderModal()
    const textarea = screen.getByPlaceholderText('いまどうしてる？')
    await userEvent.type(textarea, 'a')
    expect(screen.getByRole('button', { name: '投稿する' })).not.toBeDisabled()
  })

  it('本文 280 文字 → 投稿ボタンが enabled（境界値: 上限ちょうど）', async () => {
    const content280 = 'a'.repeat(280)
    renderModal({ initialContent: content280 })
    expect(screen.getByRole('button', { name: '投稿する' })).not.toBeDisabled()
  })

  it('本文 281 文字 → 投稿ボタンが disabled（境界値: 上限超え）', async () => {
    const content281 = 'a'.repeat(281)
    renderModal({ initialContent: content281 })
    expect(screen.getByRole('button', { name: '投稿する' })).toBeDisabled()
  })

  it('投稿ボタンクリック → onSubmit が呼ばれる', async () => {
    const onSubmit = vi.fn()
    renderModal({ initialContent: 'Hello', onSubmit })
    await userEvent.click(screen.getByRole('button', { name: '投稿する' }))
    expect(onSubmit).toHaveBeenCalledWith('Hello', [])
  })

  it('クローズボタンクリック → onClose が呼ばれる', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    // CloseIcon の IconButton は data-testid="CloseIcon" の親ボタン
    await userEvent.click(screen.getByTestId('CloseIcon').closest('button')!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('文字数カウンターが表示される', () => {
    renderModal({ initialContent: 'hello' })
    expect(screen.getByText('5 / 280')).toBeInTheDocument()
  })
})
