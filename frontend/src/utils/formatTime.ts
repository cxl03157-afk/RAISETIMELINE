export function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const diff = now - new Date(isoString).getTime()
  const sec = Math.floor(diff / 1000)

  if (sec < 60) return '今'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}分前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}時間前`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day}日前`

  const d = new Date(isoString)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
