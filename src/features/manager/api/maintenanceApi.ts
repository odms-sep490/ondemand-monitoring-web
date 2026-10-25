import { apiRequest } from '../../../shared/api/httpClient'
import type { TicketSeverity, TicketStatus } from '../../../shared/types/domain'
import type { MaintenanceTicket } from '../types/maintenance'

export type BackendMaintenanceTicket = {
  id: string
  ticketCode?: string | null
  title?: string | null
  deviceId?: string | null
  deviceCode?: string | null
  assignedStaffId?: string | null
  assignedStaffName?: string | null
  assignedTechnicianId?: string | null
  assignedTechnicianName?: string | null
  reportedBy?: string | null
  issueType?: string | null
  severity?: string | null
  description?: string | null
  status: string
  resolutionNotes?: string | null
  openedAt: string
  resolvedAt?: string | null
  closedAt?: string | null
}

function mapToTicket(item: BackendMaintenanceTicket): MaintenanceTicket {
  return {
    id: item.id,
    code: item.ticketCode ?? item.id,
    title: item.title ?? item.description ?? item.issueType ?? item.ticketCode ?? item.id,
    status: (item.status || 'OPEN') as TicketStatus,
    priority: (item.severity || 'MEDIUM') as TicketSeverity,
    droneId: item.deviceId ?? '',
    droneCode: item.deviceCode ?? item.deviceId ?? 'DRONE',
    droneName: item.deviceCode ?? null,
    issueType: item.issueType ?? null,
    description: item.description ?? null,
    missionId: null,
    reportedBy: item.reportedBy ?? null,
    assignedTo:
      item.assignedStaffName ??
      item.assignedTechnicianName ??
      item.assignedStaffId ??
      item.assignedTechnicianId ??
      null,
    downtime_hours: null,
    resolutionNotes: item.resolutionNotes ?? null,
    openedAt: item.openedAt,
    resolvedAt: item.resolvedAt ?? null,
    closedAt: item.closedAt ?? null,
  }
}

export const maintenanceApi = {
  /** `GET /api/maintenance-tickets` */
  listTickets: async (options?: {
    status?: TicketStatus
    droneId?: string
    priority?: TicketSeverity
    signal?: AbortSignal
  }): Promise<{ items: MaintenanceTicket[]; total: number }> => {
    const query: Record<string, string> = {}
    if (options?.status) query['status'] = options.status
    if (options?.droneId) query['deviceId'] = options.droneId

    const res = await apiRequest<BackendMaintenanceTicket[] | { items: BackendMaintenanceTicket[] }>(
      '/api/maintenance-tickets',
      { query, signal: options?.signal },
    )

    const rawList = Array.isArray(res) ? res : res?.items || []
    const items = rawList
      .map(mapToTicket)
      .filter((ticket) => !options?.priority || ticket.priority === options.priority)
    return { items, total: items.length }
  },

  /** `POST /api/maintenance-tickets` */
  createTicket: async (data: {
    droneId: string
    title: string
    issueType?: string
    description?: string
    priority?: TicketSeverity
  }): Promise<MaintenanceTicket> => {
    const raw = await apiRequest<BackendMaintenanceTicket>('/api/maintenance-tickets', {
      method: 'POST',
      body: data,
    })
    return mapToTicket(raw)
  },

  /** `PATCH /api/maintenance-tickets/{id}/assign-staff` */
  assignTechnician: async (ticketId: string, technicianId: string): Promise<MaintenanceTicket> => {
    const raw = await apiRequest<BackendMaintenanceTicket>(`/api/maintenance-tickets/${ticketId}/assign-staff`, {
      method: 'PATCH',
      body: { staffId: technicianId },
    })
    return mapToTicket(raw)
  },

  /** `PATCH /api/maintenance-tickets/{id}/resolve` */
  resolveTicket: async (
    ticketId: string,
    resolutionNotes: string,
    newDeviceStatus: string = 'AVAILABLE',
  ): Promise<MaintenanceTicket> => {
    const raw = await apiRequest<BackendMaintenanceTicket>(`/api/maintenance-tickets/${ticketId}/resolve`, {
      method: 'PATCH',
      body: { resolutionNotes, newDeviceStatus },
    })
    return mapToTicket(raw)
  },
}
