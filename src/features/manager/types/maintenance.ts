import type { TicketSeverity, TicketStatus } from '../../../shared/types/domain'

export type MaintenanceTicket = {
  id: string
  code: string
  title: string
  status: TicketStatus
  priority: TicketSeverity
  droneId: string
  droneCode: string
  issueType: string | null
  description: string | null
  reportedBy: string | null
  assignedTo: string | null
  resolutionNotes: string | null
  openedAt: string
  resolvedAt: string | null
  closedAt: string | null
  /** Backend workflow stage, e.g. DRAFT_HANDOVER, AWAITING_TECHNICAL_RECEIPT, IN_MAINTENANCE. */
  workflowStage: string
}
