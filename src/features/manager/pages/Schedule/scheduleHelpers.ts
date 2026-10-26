export function formatWeekLabel(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  return `${fmt(start)} – ${fmt(end)}`
}

export function formatDayLabel(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

/** Hour range shown in the calendar: 06:00 – 22:00 [TK MNG-06]. */
export const SLOT_MIN_TIME = '06:00:00'
export const SLOT_MAX_TIME = '22:00:00'

/** Minutes shown for a mission that has a start but no end time. */
export const DEFAULT_MISSION_MINUTES = 30

export function addDays(d: Date, n: number): Date {
  const next = new Date(d)
  next.setDate(d.getDate() + n)
  return next
}

/** Keeps the first item for each id so duplicated API rows render once. */
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}
