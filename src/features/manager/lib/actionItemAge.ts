// Pure "age" formatters for the MNG-01 "Cần xử lý ngay" list and the
// "Đang bay" card. The mock JSON stores raw ISO timestamps (see
// src/mocks/data/manager-dashboard.json); every display string below is
// computed relative to a `now` passed in by the caller so it never drifts
// from what the design shows and stays deterministic in tests.
//
// Every formatter takes an optional trailing `lang` (default `'vi'`, so
// every existing call site/test keeps working unchanged) and renders the
// English wording when `lang === 'en'`.
import type { Language } from '../../../shared/i18n'
import { managerLibMessages } from './lib.messages'

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

function diffMinutes(now: Date, iso: string): number {
  return Math.round((now.getTime() - new Date(iso).getTime()) / MINUTE_MS)
}

/**
 * Order pending-review age, e.g. "31 giờ · quá 24h" once past
 * `overdueHours` (default 24, per [TK MNG-01]), otherwise just "5 giờ".
 *
 * Uses `floor` (not `round`) so an order that has been waiting 23h59m still
 * reads "23 giờ" instead of rounding up to a premature "24 giờ · quá 24h".
 */
export function formatOrderAge(
  now: Date,
  submittedAtIso: string,
  overdueHours = 24,
  lang: Language = 'vi',
): string {
  const hours = Math.floor(
    (now.getTime() - new Date(submittedAtIso).getTime()) / HOUR_MS,
  )
  const t = managerLibMessages[lang].age
  return hours >= overdueHours
    ? t.orderOverdue(hours, overdueHours)
    : t.orderHours(hours)
}

/**
 * Countdown to a mission's scheduled start, e.g. "Còn 2 giờ 28 phút". Past
 * the scheduled time it reads "Trễ X giờ Y phút".
 */
export function formatMissionCountdown(
  now: Date,
  scheduledStartIso: string,
  lang: Language = 'vi',
): string {
  const totalMinutes = Math.round(
    (new Date(scheduledStartIso).getTime() - now.getTime()) / MINUTE_MS,
  )
  const late = totalMinutes < 0
  const abs = Math.abs(totalMinutes)
  const hours = Math.floor(abs / 60)
  const minutes = abs % 60
  const t = managerLibMessages[lang].age
  const label =
    hours > 0 ? t.hoursMinutes(hours, minutes) : t.minutesOnly(minutes)
  return late ? t.late(label) : t.remaining(label)
}

/** Maintenance ticket open duration, e.g. "Mở 6 ngày". */
export function formatTicketAge(
  now: Date,
  openedAtIso: string,
  lang: Language = 'vi',
): string {
  const days = Math.floor(
    (now.getTime() - new Date(openedAtIso).getTime()) / DAY_MS,
  )
  return managerLibMessages[lang].age.ticketOpen(days)
}

/**
 * "Ago" label for recent events, e.g. "42 phút trước", that stays readable
 * for any elapsed duration instead of growing an unbounded minute count
 * (e.g. "294 phút trước"): under 60 minutes it's minutes, under 24 hours
 * it's hours, and beyond that it falls back to whole days.
 */
export function formatMinutesAgo(
  now: Date,
  createdAtIso: string,
  lang: Language = 'vi',
): string {
  const minutes = diffMinutes(now, createdAtIso)
  const t = managerLibMessages[lang].age
  if (minutes < 60) return t.minutesAgo(minutes)
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t.hoursAgo(hours)
  const days = Math.floor(hours / 24)
  return t.daysAgo(days)
}

/**
 * In-flight duration label for the action list, e.g. "Bay 58 phút". Beyond
 * 60 minutes it switches to "Bay X giờ Y phút" rather than an ever-growing
 * minute count, matching the same tiering as `formatMinutesAgo`.
 */
export function formatFlightMinutes(
  now: Date,
  startedAtIso: string,
  lang: Language = 'vi',
): string {
  const minutes = diffMinutes(now, startedAtIso)
  const t = managerLibMessages[lang].age
  if (minutes < 60) return t.flyingMinutes(minutes)
  const hours = Math.floor(minutes / 60)
  const remainderMinutes = minutes % 60
  return t.flyingHoursMinutes(hours, remainderMinutes)
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0')
}

/**
 * Elapsed/planned progress label for the "Đang bay" card, matching [TK
 * MNG-01] literally: elapsed time as HH:MM (e.g. 58 minutes -> "00:58") over
 * the planned duration shown as raw-minutes:00 (e.g. 90 -> "90:00"). Purely
 * numeric — no `lang` parameter needed.
 */
export function formatFlightProgress(
  now: Date,
  startedAtIso: string,
  plannedDurationMin: number,
): string {
  const elapsedMin = Math.max(0, diffMinutes(now, startedAtIso))
  const elapsedHours = Math.floor(elapsedMin / 60)
  const elapsedRemMin = elapsedMin % 60
  return `${pad2(elapsedHours)}:${pad2(elapsedRemMin)} / ${pad2(plannedDurationMin)}:00`
}
