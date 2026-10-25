// Mock only the maintenance endpoints that currently exist in the backend.
// Manual ticket creation and generic status updates have no backend contract.
import type { TicketSeverity, TicketStatus } from '../../shared/types/domain'
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import ticketsSeed from '../data/maintenance-tickets.json'

type StoredTicket = {
  id: string
  code: string
  title: string
  status: TicketStatus
  priority: TicketSeverity
  droneId: string
  droneCode: string
  droneName: string | null
  issueType: string | null
  description: string | null
  missionId: string | null
  reportedBy: string | null
  assignedTo: string | null
  downtime_hours: number | null
  resolutionNotes: string | null
  openedAt: string
  resolvedAt: string | null
  closedAt: string | null
}

const tickets = createCollection(ticketsSeed.tickets) as StoredTicket[]

function toBackendTicket(ticket: StoredTicket) {
  return {
    id: ticket.id,
    ticketCode: ticket.code,
    deviceId: ticket.droneId,
    deviceCode: ticket.droneCode,
    assignedStaffId: ticket.assignedTo,
    reportedBy: ticket.reportedBy,
    issueType: ticket.issueType,
    severity: ticket.priority,
    description: ticket.description ?? ticket.title,
    status: ticket.status,
    resolutionNotes: ticket.resolutionNotes,
    openedAt: ticket.openedAt,
    resolvedAt: ticket.resolvedAt,
    closedAt: ticket.closedAt,
  }
}

registerMockRoutes([
  // GET /api/maintenance-tickets?status=&deviceId=&staffId=
  {
    method: 'GET',
    path: '/api/maintenance-tickets',
    handler: ({ query }) => {
      const statusFilter = query.get('status') as TicketStatus | null
      const deviceIdFilter = query.get('deviceId')
      const staffIdFilter = query.get('staffId')

      const items = tickets.filter((t) => {
        if (statusFilter && t.status !== statusFilter) return false
        if (deviceIdFilter && t.droneId !== deviceIdFilter) return false
        if (staffIdFilter && t.assignedTo !== staffIdFilter) return false
        return true
      })

      return ok(items.map(toBackendTicket))
    },
  },
  // PATCH /api/maintenance-tickets/:id/assign-staff { staffId }
  {
    method: 'PATCH',
    path: '/api/maintenance-tickets/:id/assign-staff',
    handler: ({ params, body }) => {
      const ticket = tickets.find(
        (t) => t.id === params.id || t.code === params.id,
      )
      if (!ticket) return fail(404, 'NOT_FOUND', 'Không tìm thấy ticket')

      const req = (body ?? {}) as { staffId?: string }
      if (!req.staffId?.trim()) return fail(400, 'VALIDATION_ERROR', 'staffId is required')
      ticket.assignedTo = req.staffId
      ticket.status = 'IN_PROGRESS'
      return ok(toBackendTicket(ticket), 'Staff assigned successfully')
    },
  },

  // PATCH /api/maintenance-tickets/:id/resolve { resolutionNotes, newDeviceStatus? }
  {
    method: 'PATCH',
    path: '/api/maintenance-tickets/:id/resolve',
    handler: ({ params, body }) => {
      const ticket = tickets.find(
        (t) => t.id === params.id || t.code === params.id,
      )
      if (!ticket) return fail(404, 'NOT_FOUND', 'Không tìm thấy ticket')
      const req = (body ?? {}) as { resolutionNotes?: string; newDeviceStatus?: string }
      if (!req.resolutionNotes?.trim()) {
        return fail(400, 'VALIDATION_ERROR', 'resolutionNotes is required')
      }
      ticket.status = 'RESOLVED'
      ticket.resolutionNotes = req.resolutionNotes
      ticket.resolvedAt = ticket.resolvedAt ?? new Date().toISOString()
      return ok(toBackendTicket(ticket), 'Maintenance ticket resolved')
    },
  },
])

/** Test-only escape hatch */
export const __testing = { tickets }
