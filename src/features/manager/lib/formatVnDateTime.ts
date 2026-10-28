// Date/time line for the Manager top bar, e.g.
// "Thứ Bảy, 19/09/2026 · 14:32" [TK MNG-01]. Pure so it can be unit-tested
// without mocking the system clock; callers pass the current `Date`.
//
// `formatVnDateTime` keeps its original signature/behaviour (always
// Vietnamese) so existing callers/tests are unaffected. `formatDateTime`
// is the new lang-aware variant used by `DashboardPage`.
import type { Language } from '../../../shared/i18n'
import { managerLibMessages } from './lib.messages'

function pad2(value: number): string {
  return value.toString().padStart(2, '0')
}

/** Formats `date` (using its local getters) as "Thứ Bảy, 19/09/2026 · 14:32". */
export function formatVnDateTime(date: Date): string {
  return formatDateTime(date, 'vi')
}

/**
 * Lang-aware variant: `"Thứ Bảy, 19/09/2026 · 14:32"` for `vi`, or
 * `"Saturday, 09/19/2026 · 14:32"` for `en`.
 */
export function formatDateTime(date: Date, lang: Language): string {
  const day = pad2(date.getDate())
  const month = pad2(date.getMonth() + 1)
  const year = date.getFullYear()
  const hours = pad2(date.getHours())
  const minutes = pad2(date.getMinutes())
  if (lang === 'en') {
    const weekday = managerLibMessages.en.weekdays[date.getDay()]
    return `${weekday}, ${month}/${day}/${year} · ${hours}:${minutes}`
  }
  const weekday = managerLibMessages.vi.weekdays[date.getDay()]
  return `${weekday}, ${day}/${month}/${year} · ${hours}:${minutes}`
}
