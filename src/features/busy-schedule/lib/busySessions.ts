import type { BusySchedule, BusySession } from '../types'

// BE business timezone is Asia/Ho_Chi_Minh (UTC+7, no DST).
const VN_OFFSET = '+07:00'
const DAY_MS = 86_400_000

export const BUSY_SESSIONS: { session: BusySession; start: number; end: number }[] = [
  { session: 'MORNING', start: 6, end: 12 },
  { session: 'AFTERNOON', start: 12, end: 18 },
  { session: 'EVENING', start: 18, end: 22 },
]

const pad = (n: number) => String(n).padStart(2, '0')

function fromIso(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`)
}

function toIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** `YYYY-MM-DD` of an instant in the business timezone. */
export function vnDateOf(instant: number | string | Date): string {
  const ms = instant instanceof Date ? instant.getTime() : new Date(instant).getTime()
  return toIso(ms + 7 * 3_600_000)
}

export function todayIso(now: number = Date.now()): string {
  return vnDateOf(now)
}

export function addDays(iso: string, days: number): string {
  return toIso(fromIso(iso) + days * DAY_MS)
}

export function mondayOf(iso: string): string {
  const weekday = new Date(fromIso(iso)).getUTCDay() // 0 = Sunday
  return addDays(iso, -((weekday + 6) % 7))
}

export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export function cellKey(date: string, session: BusySession): string {
  return `${date}|${session}`
}

export function indexBusyItems(items: BusySchedule[]): Map<string, BusySchedule> {
  return new Map(items.map((item) => [cellKey(item.date, item.session), item]))
}

export function sessionStartMs(date: string, session: BusySession): number {
  const spec = BUSY_SESSIONS.find((s) => s.session === session)!
  return Date.parse(`${date}T${pad(spec.start)}:00:00${VN_OFFSET}`)
}

/** BE rejects create/update/delete once the session has started. */
export function isSessionPast(
  date: string,
  session: BusySession,
  now: number = Date.now(),
): boolean {
  return sessionStartMs(date, session) <= now
}

/** Busy sessions overlapping the half-open window [start, end). */
export function busyOverlapping(
  items: BusySchedule[],
  start: string,
  end: string,
): BusySchedule[] {
  const from = new Date(start).getTime()
  const to = new Date(end).getTime()
  return items.filter(
    (item) =>
      new Date(item.startTime).getTime() < to &&
      new Date(item.endTime).getTime() > from,
  )
}

/** Monday dates of every business-timezone week touched by [start, end]. */
export function weekAnchorsForWindow(start: string, end: string): string[] {
  const first = mondayOf(vnDateOf(start))
  const last = mondayOf(vnDateOf(end))
  const anchors: string[] = []
  for (let day = first; day <= last; day = addDays(day, 7)) anchors.push(day)
  return anchors
}
