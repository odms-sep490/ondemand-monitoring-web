import type {
  TicketStatus,
  TicketSeverity,
} from '../../../../shared/types/domain'
import { maintenancePageMessages } from './MaintenancePage.messages'

export const COLUMNS: TicketStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
]

export function formatAge(
  openedAt: string,
  t: (typeof maintenancePageMessages)['vi']['age'],
): string {
  const ms = Date.now() - new Date(openedAt).getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days > 0) return t.daysAgo(days)
  const hours = Math.floor(ms / (1000 * 60 * 60))
  if (hours > 0) return t.hoursAgo(hours)
  return t.justNow
}

export const SEVERITIES: TicketSeverity[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]

