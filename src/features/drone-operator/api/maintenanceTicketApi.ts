import { apiRequest } from '../../../shared/api/httpClient'

export type MaintenanceTicketDto = {
  id: string
  ticketCode: string
  deviceId?: string | null
  deviceCode?: string | null
  droneCode?: string | null
  assignedTechnicianId?: string | null
  assignedTechnicianName?: string | null
  reportedBy?: string | null
  issueType: string
  severity: string
  description?: string | null
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  resolutionNotes?: string | null
  openedAt: string
  resolvedAt?: string | null
  closedAt?: string | null
}

export const maintenanceTicketApi = {
  listTickets: (
    status?: string,
    deviceId?: string,
    technicianId?: string,
    signal?: AbortSignal,
  ) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (deviceId) params.append('deviceId', deviceId)
    if (technicianId) params.append('staffId', technicianId)
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiRequest<MaintenanceTicketDto[]>(
      `/api/maintenance-tickets${query}`,
      { signal },
    )
  },

  getTicketById: (id: string, signal?: AbortSignal) =>
    apiRequest<MaintenanceTicketDto>(`/api/maintenance-tickets/${id}`, {
      signal,
    }),

  assignTechnician: (id: string, technicianId: string, signal?: AbortSignal) =>
    apiRequest<MaintenanceTicketDto>(`/api/maintenance-tickets/${id}/assign-staff`, {
      method: 'PATCH',
      body: { staffId: technicianId },
      signal,
    }),

  resolveTicket: (
    id: string,
    body: { resolutionNotes: string; newDeviceStatus?: string },
    signal?: AbortSignal,
  ) =>
    apiRequest<MaintenanceTicketDto>(`/api/maintenance-tickets/${id}/resolve`, {
      method: 'PATCH',
      body: {
        resolutionNotes: body.resolutionNotes,
        newDeviceStatus: body.newDeviceStatus || 'AVAILABLE',
      },
      signal,
    }),
}
