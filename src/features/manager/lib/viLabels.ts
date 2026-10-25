// Vietnamese display helpers for values the backend returns as raw codes or
// ISO strings (time slots, media types, dates).

const TIMESLOT_VI: Record<string, string> = {
  MORNING: 'Buổi sáng',
  AFTERNOON: 'Buổi chiều',
  EVENING: 'Buổi tối',
  NIGHT: 'Ban đêm',
}

const MEDIA_TYPE_VI: Record<string, string> = {
  IMAGE: 'Ảnh',
  PHOTO: 'Ảnh',
  VIDEO: 'Video',
  THERMAL: 'Ảnh nhiệt',
}

/** `Morning` / `Morning 07:00–11:00` → `Buổi sáng` / `Buổi sáng 07:00–11:00`. */
export function localizeTimeslot(name: string | null | undefined): string {
  const raw = name?.trim()
  if (!raw) return ''
  return raw.replace(
    /^(morning|afternoon|evening|night)\b/i,
    (match) => TIMESLOT_VI[match.toUpperCase()] ?? match,
  )
}

/** `IMAGE` → `Ảnh`; unknown tokens are kept. */
export function localizeMediaType(token: string): string {
  return MEDIA_TYPE_VI[token.trim().toUpperCase()] ?? token
}

/** `2026-10-02` / ISO → `02/10/2026`; short forms such as `24/09` are kept. */
export function formatDateVi(value: string | null | undefined): string {
  const raw = value?.trim()
  if (!raw) return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : raw
}

/** "02/10/2026 · Buổi sáng" from the order's preferred date + time slot. */
export function preferredLabel(
  date: string | null | undefined,
  timeName: string | null | undefined,
  window?: string | null,
): string {
  const win = window?.trim()
  if (win && win !== timeName?.trim()) return localizeTimeslot(win)
  return [formatDateVi(date), localizeTimeslot(timeName)]
    .filter(Boolean)
    .join(' · ')
}

/** Displays the complete date range selected by the customer. */
export function preferredRangeLabel(
  dateFrom: string | null | undefined,
  dateTo: string | null | undefined,
  timeName: string | null | undefined,
  window?: string | null,
): string {
  const from = formatDateVi(dateFrom)
  const to = formatDateVi(dateTo)
  const dates = from && to && from !== to ? `${from} → ${to}` : from || to
  const win = window?.trim()
  const time =
    win && win !== timeName?.trim()
      ? localizeTimeslot(win)
      : localizeTimeslot(timeName)
  return [dates, time].filter(Boolean).join(' · ')
}
