import type {
  TicketStatus,
  TicketSeverity,
} from '../../../../shared/types/domain'
import type { MaintenanceTicket } from '../../types/maintenance'
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

/** Locale-aware date and time, e.g. "13 thg 9, 2026 16:05" / "Sep 13, 2026, 4:05 PM". */
export function formatStamp(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
}

/** Where the ticket stands in the handover flow: manager sends it, a Technical claims it. */
export type HandoverState = 'NEEDS_HANDOVER' | 'AWAITING_CLAIM' | 'CLAIMED' | 'OTHER'

export function handoverState(ticket: MaintenanceTicket): HandoverState {
  if (ticket.workflowStage === 'DRAFT_HANDOVER' || ticket.workflowStage === 'RECEIPT_REJECTED')
    return 'NEEDS_HANDOVER'
  if (ticket.workflowStage === 'AWAITING_TECHNICAL_RECEIPT') return 'AWAITING_CLAIM'
  return ticket.assignedTo ? 'CLAIMED' : 'OTHER'
}
