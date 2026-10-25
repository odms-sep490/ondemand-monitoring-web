import type { OrderMissionBrief } from '../../types/orders'
import type { WeatherForecast } from '../../../customer/api/customerApi'

export const DAY_MS = 86_400_000

export function isoDatePart(value?: string | null) {
  if (!value) return ''
  const match = value.match(/\d{4}-\d{2}-\d{2}/)
  return match?.[0] ?? ''
}

export function timePart(value?: string | null) {
  if (!value) return ''
  const match = value.match(/T(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : ''
}

export function forecastTimeFromBrief(brief: OrderMissionBrief) {
  const fromTime = timePart(brief.preferredDateFrom)
  if (fromTime) return fromTime
  const normalized = brief.preferredTimeName.toLowerCase()
  if (normalized.includes('chiều') || normalized.includes('afternoon'))
    return '15:00'
  if (normalized.includes('tối') || normalized.includes('evening'))
    return '19:00'
  return '08:00'
}

export function formatDateLabel(iso: string) {
  return iso.split('-').reverse().join('/')
}

export function dateRangeFromBrief(brief: OrderMissionBrief) {
  const start =
    isoDatePart(brief.preferredDateFrom) || isoDatePart(brief.preferredDate)
  const end = isoDatePart(brief.preferredDateTo) || start
  if (!start) return []
  const startMs = Date.parse(`${start}T00:00:00Z`)
  const endMs = Date.parse(`${end}T00:00:00Z`)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return [start]
  }
  const dates: string[] = []
  for (let ms = startMs; ms <= endMs; ms += DAY_MS) {
    dates.push(new Date(ms).toISOString().slice(0, 10))
  }
  return dates
}

export function suitabilityTone(forecast?: WeatherForecast) {
  const suitability = forecast?.suitability ?? 'GOOD'
  if (suitability === 'POOR') return 'is-poor'
  if (suitability === 'CAUTION') return 'is-caution'
  return 'is-good'
}

export function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function formatLocalInput(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function weatherMetric(value: number | undefined, suffix: string) {
  return value == null ? '–' : `${Math.round(value)}${suffix}`
}
