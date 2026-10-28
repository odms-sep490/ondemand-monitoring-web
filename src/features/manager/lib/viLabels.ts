// Vietnamese display helpers for values the backend returns as raw codes or
// ISO strings (time slots, media types, dates).
import { getLanguage } from '../../../shared/i18n'
import { managerLibMessages } from './lib.messages'

const SLOT_KEYS: Record<string, string> = {
  morning: 'MORNING',
  afternoon: 'AFTERNOON',
  evening: 'EVENING',
  night: 'NIGHT',
  sáng: 'MORNING',
  chiều: 'AFTERNOON',
  tối: 'EVENING',
  đêm: 'NIGHT',
}
const SLOT_RE =
  /(?<![\p{L}\d])(?:(?:buổi|ban)\s+)?(morning|afternoon|evening|night|sáng|chiều|tối|đêm)(?![\p{L}\d])/giu

/**
 * `Morning` / `Sáng` / `Buổi chiều 13:00–17:00` → localized slot word
 * (`Buổi sáng` in vi, `Morning` in en), keeping any time range.
 */
export function localizeTimeslot(name: string | null | undefined): string {
  const raw = name?.trim()
  if (!raw) return ''
  const slots = managerLibMessages[getLanguage()].timeslots
  return raw.replace(SLOT_RE, (match, word: string) => {
    const key = SLOT_KEYS[word.toLowerCase()]
    return (key && slots[key]) || match
  })
}

/** `IMAGE` → `Ảnh`; unknown tokens are kept. */
export function localizeMediaType(token: string): string {
  return managerLibMessages[getLanguage()].mediaTypes[token.trim().toUpperCase()] ?? token
}

/** `2026-10-02` / ISO → `02/10/2026`; short forms such as `24/09` are kept. */
export function formatDateVi(value: string | null | undefined): string {
  const raw = value?.trim()
  if (!raw) return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw)
  if (!match) return raw
  return getLanguage() === 'en'
    ? `${match[2]}/${match[3]}/${match[1]}`
    : `${match[3]}/${match[2]}/${match[1]}`
}

const WINDOW_DATE_RE = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g

/** Window strings from the backend may already embed the date ("25/09/2026 · Chiều 13:00–17:00"). */
function splitWindow(
  window: string,
  isoYear: string | null,
): { date: string; time: string } {
  const dates: string[] = []
  const rest = window
    .replace(WINDOW_DATE_RE, (_m, d: string, mo: string, y?: string) => {
      const year = y ?? isoYear
      const dd = d.padStart(2, '0')
      const mm = mo.padStart(2, '0')
      const full = year
        ? getLanguage() === 'en'
          ? `${mm}/${dd}/${year}`
          : `${dd}/${mm}/${year}`
        : `${dd}/${mm}`
      dates.push(full)
      return ' '
    })
    .replace(/^[\s·,\-–→]+|[\s·,\-–→]+$/g, '')
    .replace(/\s{2,}/g, ' ')
  return { date: dates[0] ?? '', time: localizeTimeslot(rest) }
}

function isoYearOf(value: string | null | undefined): string | null {
  return /^(\d{4})-\d{2}-\d{2}/.exec(value?.trim() ?? '')?.[1] ?? null
}

/** Date part is "complete" when it carries a four digit year. */
const hasYear = (value: string) => /\d{4}/.test(value)

function composeLabel(
  dates: string,
  isoYear: string | null,
  timeName: string | null | undefined,
  window: string | null | undefined,
): string {
  const win = window?.trim()
  let time = localizeTimeslot(timeName)
  let shownDates = dates
  if (win && win !== timeName?.trim()) {
    const parts = splitWindow(win, isoYear)
    time = parts.time
    if (parts.date && !hasYear(shownDates)) shownDates = parts.date
    else if (!parts.date) time = localizeTimeslot(win)
  }
  return [shownDates, time].filter(Boolean).join(' · ')
}

/** "02/10/2026 · Buổi sáng" from the order's preferred date + time slot. */
export function preferredLabel(
  date: string | null | undefined,
  timeName: string | null | undefined,
  window?: string | null,
): string {
  return composeLabel(formatDateVi(date), isoYearOf(date), timeName, window)
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
  return composeLabel(dates, isoYearOf(dateFrom) ?? isoYearOf(dateTo), timeName, window)
}

/** Localizes media words and units inside a requirement label ("VIDEO × 2 · 300 giây"). */
export function localizeMediaLabel(text: string): string {
  const en = getLanguage() === 'en'
  return text
    .replace(/\b(IMAGE|PHOTO|VIDEO|THERMAL|LIVESTREAM|STREAMING)\b/gi, (m) =>
      localizeMediaType(m),
    )
    .replace(/(\d+)\s*giây\b/gi, (_m, n: string) => (en ? `${n} sec` : `${n} giây`))
}
