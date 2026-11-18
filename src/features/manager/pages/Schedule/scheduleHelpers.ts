import type { MissionStatus } from '../../../../shared/types/domain'

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

export { dedupeById } from '../../lib/dedupeById'

export type MissionStatusGroup =
  | 'scheduled'
  | 'ready'
  | 'inProgress'
  | 'completed'
  | 'failed'
  | 'cancelled'

export const MISSION_STATUS_GROUPS: MissionStatusGroup[] = [
  'scheduled',
  'ready',
  'inProgress',
  'completed',
  'failed',
  'cancelled',
]

/** Collapses the many mission statuses into six calendar colour groups. */
export function getMissionStatusGroup(status: MissionStatus): MissionStatusGroup {
  switch (status) {
    case 'READY':
    case 'READY_TO_FLY':
    case 'CONNECTED':
    case 'PREFLIGHT_CHECKING':
      return 'ready'
    case 'IN_PROGRESS':
    case 'IN_FLIGHT':
    case 'RETURNING':
    case 'POSTFLIGHT_CHECKING':
    case 'AWAITING_REVIEW':
    case 'PENDING_REVIEW':
      return 'inProgress'
    case 'COMPLETED':
      return 'completed'
    case 'FAILED':
    case 'FAILED_PREFLIGHT':
      return 'failed'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'scheduled'
  }
}
