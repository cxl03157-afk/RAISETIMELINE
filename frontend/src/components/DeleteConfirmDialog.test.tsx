import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DeleteConfirmDialog from './DeleteConfirmDialog'

describe('DeleteConfirmDialog', () => {
  it('open=false → ダイアログが非表示', () => {
    render(
      <DeleteConfirmDialog
        open={false}
        loading={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(screen.queryByText('投稿を削除しますか？')).not.toBeInTheDocument()
  })

  it('open=true → ダイアログが表示される', () => {
    render(
      <DeleteConfirmDialog
        open={true}
        loading={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(screen.getByText('投稿を削除しますか？')).toBeInTheDocument()
    expect(screen.getByText('この操作は取り消せません。')).toBeInTheDocument()
  })

  it('「削除する」クリック → onConfirm が呼ばれる', async () => {
    const onConfirm = vi.fn()
    render(
      <DeleteConfirmDialog
        open={true}
        loading={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: '削除する' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('「キャンセル」クリック → onCancel が呼ばれる', async () => {
    const onCancel = vi.fn()
    render(
      <DeleteConfirmDialog
        open={true}
        loading={false}
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('loading=true → ボタンが disabled になる', () => {
    render(
      <DeleteConfirmDialog
        open={true}
        loading={true}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled()
  })
})
