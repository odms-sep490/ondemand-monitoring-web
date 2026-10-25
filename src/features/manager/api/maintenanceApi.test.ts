import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { resetHttpTransport, setHttpTransport } from '../../../shared/api/httpClient'
import { maintenanceApi } from './maintenanceApi'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  resetHttpTransport()
})

describe('maintenanceApi.listTickets', () => {
  it('returns a list of tickets', async () => {
    const result = await maintenanceApi.listTickets()
    expect(result.items.length).toBeGreaterThan(0)
  })

  it('filters by status', async () => {
    const result = await maintenanceApi.listTickets({ status: 'OPEN' })
    for (const t of result.items) {
      expect(t.status).toBe('OPEN')
    }
  })

  it('uses backend filter names and applies unsupported severity filtering locally', async () => {
    let requestUrl = ''
    setHttpTransport(async (input) => {
      requestUrl = input
      return Response.json({
        success: true,
        data: [
          {
            id: 'high-ticket',
            ticketCode: 'TKT-HIGH',
            deviceId: 'device-1',
            severity: 'HIGH',
            status: 'OPEN',
            openedAt: '2026-10-16T00:00:00Z',
          },
          {
            id: 'low-ticket',
            ticketCode: 'TKT-LOW',
            deviceId: 'device-1',
            severity: 'LOW',
            status: 'OPEN',
            openedAt: '2026-10-16T00:00:00Z',
          },
        ],
      })
    })

    const result = await maintenanceApi.listTickets({
      droneId: 'device-1',
      priority: 'HIGH',
    })
    const query = new URL(requestUrl).searchParams

    expect(query.get('deviceId')).toBe('device-1')
    expect(query.has('droneId')).toBe(false)
    expect(query.has('priority')).toBe(false)
    expect(result.items.map((ticket) => ticket.id)).toEqual(['high-ticket'])
  })
})

describe('maintenanceApi maintenance workflow contract', () => {
  it('assigns through the backend route and sends staffId', async () => {
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
          deviceId: 'device-1',
          deviceCode: 'DRN-1',
          assignedStaffId: 'staff-1',
          assignedStaffName: 'Operator One',
          status: 'IN_PROGRESS',
          openedAt: '2026-10-16T00:00:00Z',
        },
      })
    })

    const result = await maintenanceApi.assignTechnician('ticket-1', 'staff-1')

    expect(request).toEqual({
      url: '/api/maintenance-tickets/ticket-1/assign-staff',
      method: 'PATCH',
      body: JSON.stringify({ staffId: 'staff-1' }),
    })
    expect(result.status).toBe('IN_PROGRESS')
    expect(result.assignedTo).toBe('Operator One')
  })

  it('resolves through the backend route with newDeviceStatus and maps its response', async () => {
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
          deviceId: 'device-1',
          deviceCode: 'DRN-1',
          status: 'RESOLVED',
          resolutionNotes: 'Repaired',
          openedAt: '2026-10-16T00:00:00Z',
          resolvedAt: '2026-10-16T01:00:00Z',
        },
      })
    })

    const result = await maintenanceApi.resolveTicket('ticket-1', 'Repaired', 'AVAILABLE')

    expect(request).toEqual({
      url: '/api/maintenance-tickets/ticket-1/resolve',
      method: 'PATCH',
      body: JSON.stringify({
        resolutionNotes: 'Repaired',
        newDeviceStatus: 'AVAILABLE',
      }),
    })
    expect(result.status).toBe('RESOLVED')
    expect(result.resolutionNotes).toBe('Repaired')
  })
})
