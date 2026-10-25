import type { MaintenanceTicketDto } from '../../api/maintenanceTicketApi'

export function maintenanceDeviceLabel(ticket: MaintenanceTicketDto) {
  return ticket.deviceCode || ticket.droneCode || ticket.deviceId || 'DEVICE'
}
