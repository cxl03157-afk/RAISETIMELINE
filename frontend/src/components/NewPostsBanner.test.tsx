import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewPostsBanner from './NewPostsBanner'

describe('NewPostsBanner', () => {
  it('visible=true → バナーが表示される', () => {
    render(<NewPostsBanner visible={true} onClick={vi.fn()} />)
    expect(screen.getByText('新しい投稿があります')).toBeInTheDocument()
  })

  it('visible=false → バナーが非表示（unmountOnExit）', () => {
    render(<NewPostsBanner visible={false} onClick={vi.fn()} />)
    expect(screen.queryByText('新しい投稿があります')).not.toBeInTheDocument()
  })

  it('バナークリック → onClick が呼ばれる', async () => {
    const onClick = vi.fn()
    render(<NewPostsBanner visible={true} onClick={onClick} />)
    await userEvent.click(screen.getByText('新しい投稿があります'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
