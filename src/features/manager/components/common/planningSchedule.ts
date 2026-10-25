/** Display-only; never modifies the ISO schedule sent to the server. */
export function planningSchedule(
  start?: string | null,
  end?: string | null,
): string {
  const date = (value?: string | null) => {
    if (!value) return null
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  const from = date(start),
    to = date(end)
  if (!from && !to) return 'Chưa có lịch'
  const options = { timeZone: 'Asia/Ho_Chi_Minh' }
  const day = (value: Date) =>
    value.toLocaleDateString('vi-VN', {
      ...options,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  const time = (value: Date) =>
    value.toLocaleTimeString('vi-VN', {
      ...options,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
  if (!from) return `Đến ${day(to!)} · ${time(to!)}`
  if (!to) return `${day(from)} · ${time(from)}–…`
  return day(from) === day(to)
    ? `${day(from)} · ${time(from)}–${time(to)}`
    : `${day(from)} · ${time(from)} — ${day(to)} · ${time(to)}`
}
