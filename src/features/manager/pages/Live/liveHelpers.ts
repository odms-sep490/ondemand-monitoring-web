export const POLL_INTERVAL_MS = 5000

// ── Active-mission sidebar list ────────────────────────────────────────────

export const ACTIVE_STATUSES = new Set([
  'IN_FLIGHT',
  'PREFLIGHT_CHECKING',
  'READY_TO_FLY',
  'CONNECTED',
  'IN_PROGRESS',
  'RETURNING',
  'POSTFLIGHT_CHECKING',
])

export function formatFlightTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── IncidentModal ──────────────────────────────────────────────────────────

export const INCIDENT_TYPE_VALUES = [
  'WIND',
  'OBSTACLE',
  'SIGNAL_LOSS',
  'BATTERY_LOW',
  'MECHANICAL',
  'OTHER',
] as const
