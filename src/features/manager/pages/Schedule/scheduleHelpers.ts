// ── constants ──────────────────────────────────────────────────────────────

/** Hour range shown in the week grid: 06:00 – 22:00 [TK MNG-06]. */
export const HOUR_START = 6

export const HOUR_END = 22

export const TOTAL_HOURS = HOUR_END - HOUR_START

/** Height per hour in px for the time grid. */
export const PX_PER_HOUR = 60

export function formatDateShort(d: Date): string {
  return String(d.getDate())
}

export function formatWeekLabel(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  return `${fmt(start)} – ${fmt(end)}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Parses an ISO datetime string and returns local hours as a fraction (e.g. 13:30 → 13.5). */
export function toLocalHours(iso: string): number {
  const d = new Date(iso)
  return d.getHours() + d.getMinutes() / 60
}

/** Tone → CSS variable suffix for mission block colours. */
export const toneBg: Record<string, string> = {
  gray: 'var(--gray-bg)',
  yellow: 'var(--yellow-bg)',
  blue: 'var(--blue-bg)',
  green: 'var(--green-bg)',
  orange: 'var(--orange-bg)',
  red: 'var(--red-bg)',
}

export const toneFg: Record<string, string> = {
  gray: 'var(--gray-fg)',
  yellow: 'var(--yellow-fg)',
  blue: 'var(--blue-fg)',
  green: 'var(--green-fg)',
  orange: 'var(--orange-fg)',
  red: 'var(--red-fg)',
}
