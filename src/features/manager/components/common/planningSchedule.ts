import { getLanguage } from '../../../../shared/i18n'
import { planningScheduleMessages } from './planningSchedule.messages'

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
  const t = planningScheduleMessages[getLanguage()]
  const locale = getLanguage() === 'en' ? 'en-US' : 'vi-VN'
  const from = date(start),
    to = date(end)
  if (!from && !to) return t.noSchedule
  const options = { timeZone: 'Asia/Ho_Chi_Minh' }
  const day = (value: Date) =>
    value.toLocaleDateString(locale, {
      ...options,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  const time = (value: Date) =>
    value.toLocaleTimeString(locale, {
      ...options,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
  if (!from) return `${t.until} ${day(to!)} · ${time(to!)}`
  if (!to) return `${day(from)} · ${time(from)}–…`
  return day(from) === day(to)
    ? `${day(from)} · ${time(from)}–${time(to)}`
    : `${day(from)} · ${time(from)} — ${day(to)} · ${time(to)}`
}
