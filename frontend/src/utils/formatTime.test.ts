import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { formatRelativeTime } from './formatTime'

describe('formatRelativeTime', () => {
  const NOW = new Date('2024-01-15T12:00:00.000Z').getTime()

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function isoAgo(ms: number): string {
    return new Date(NOW - ms).toISOString()
  }

  // ─── 境界値: 秒 ───────────────────────────────────────────────────────

  it('0秒前 → 今', () => {
    expect(formatRelativeTime(isoAgo(0))).toBe('今')
  })

  it('59秒前 → 今（1分未満）', () => {
    expect(formatRelativeTime(isoAgo(59 * 1000))).toBe('今')
  })

  // ─── 境界値: 分 ───────────────────────────────────────────────────────

  it('60秒前 → 1分前', () => {
    expect(formatRelativeTime(isoAgo(60 * 1000))).toBe('1分前')
  })

  it('59分前 → 59分前', () => {
    expect(formatRelativeTime(isoAgo(59 * 60 * 1000))).toBe('59分前')
  })

  // ─── 境界値: 時間 ─────────────────────────────────────────────────────

  it('1時間前 → 1時間前', () => {
    expect(formatRelativeTime(isoAgo(60 * 60 * 1000))).toBe('1時間前')
  })

  it('23時間前 → 23時間前', () => {
    expect(formatRelativeTime(isoAgo(23 * 60 * 60 * 1000))).toBe('23時間前')
  })

  // ─── 境界値: 日 ───────────────────────────────────────────────────────

  it('1日前 → 1日前', () => {
    expect(formatRelativeTime(isoAgo(24 * 60 * 60 * 1000))).toBe('1日前')
  })

  it('6日前 → 6日前', () => {
    expect(formatRelativeTime(isoAgo(6 * 24 * 60 * 60 * 1000))).toBe('6日前')
  })

  // ─── 7日以上: 日付フォーマット ────────────────────────────────────────

  it('7日以上前 → 日付形式で返る', () => {
    const result = formatRelativeTime(isoAgo(7 * 24 * 60 * 60 * 1000))
    expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2}$/)
  })
})
