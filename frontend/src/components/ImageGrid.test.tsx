import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ImageGrid from './ImageGrid'

describe('ImageGrid', () => {
  it('画像 0 枚 → 何も表示されない（境界値: 0件）', () => {
    const { container } = render(<ImageGrid imageUrls={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('画像 1 枚 → img が 1 つ表示される', () => {
    const { container } = render(<ImageGrid imageUrls={['https://example.com/img1.jpg']} />)
    const images = container.querySelectorAll('img')
    expect(images).toHaveLength(1)
    expect(images[0]).toHaveAttribute('src', 'https://example.com/img1.jpg')
  })

  it('画像 4 枚 → img が 4 つ表示される（境界値: 上限）', () => {
    const urls = [
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
      'https://example.com/3.jpg',
      'https://example.com/4.jpg',
    ]
    const { container } = render(<ImageGrid imageUrls={urls} />)
    expect(container.querySelectorAll('img')).toHaveLength(4)
  })

  it('画像 5 枚渡しても 4 枚のみ表示される（同値分割: 上限超え）', () => {
    const urls = Array.from({ length: 5 }, (_, i) => `https://example.com/${i}.jpg`)
    const { container } = render(<ImageGrid imageUrls={urls} />)
    expect(container.querySelectorAll('img')).toHaveLength(4)
  })
})
