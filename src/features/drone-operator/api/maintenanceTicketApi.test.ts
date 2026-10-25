import { afterEach, describe, expect, it } from 'vitest'

import { resetHttpTransport, setHttpTransport } from '../../../shared/api/httpClient'
import { maintenanceTicketApi } from './maintenanceTicketApi'

afterEach(resetHttpTransport)

describe('maintenanceTicketApi backend contract', () => {
  it('uses staffId for the backend list filter', async () => {
    let requestUrl = ''
    setHttpTransport(async (input) => {
      requestUrl = input
      return Response.json({ success: true, data: [] })
    })

    await maintenanceTicketApi.listTickets('OPEN', 'device-1', 'staff-1')

    const query = new URL(requestUrl).searchParams
    expect(query.get('status')).toBe('OPEN')
    expect(query.get('deviceId')).toBe('device-1')
    expect(query.get('staffId')).toBe('staff-1')
    expect(query.has('technicianId')).toBe(false)
  })

  it('sends the backend resolve payload field newDeviceStatus', async () => {
    let request: { url: string; method?: string; body?: string } | undefined
    setHttpTransport(async (input, init) => {
      request = {
        url: new URL(input).pathname,
        method: init?.method,
        body: init?.body?.toString(),
      }
      return Response.json({
        success: true,
        data: {
          id: 'ticket-1',
          ticketCode: 'TKT-1',
          issueType: 'POSTFLIGHT_DAMAGE',
          severity: 'HIGH',
          status: 'RESOLVED',
          resolutionNotes: 'Repaired',
          openedAt: '2026-10-16T00:00:00Z',
        },
      })
    })

    await maintenanceTicketApi.resolveTicket('ticket-1', {
      resolutionNotes: 'Repaired',
      newDeviceStatus: 'AVAILABLE',
    })

    expect(request).toEqual({
      url: '/api/maintenance-tickets/ticket-1/resolve',
      method: 'PATCH',
      body: JSON.stringify({
        resolutionNotes: 'Repaired',
        newDeviceStatus: 'AVAILABLE',
      }),
    })
  })
})
