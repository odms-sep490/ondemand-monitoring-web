/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { resetMockDb } from '../db'
import { mockFetch } from '../mockServer'
import '../index'

const base = env.apiBaseUrl

async function call(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; payload: any }> {
  const response = await mockFetch(`${base}${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, payload: await response.json() }
}

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('GET /api/maintenance-tickets', () => {
  it('returns all tickets', async () => {
    const { status, payload } = await call('GET', '/api/maintenance-tickets')
    expect(status).toBe(200)
    expect(payload.data.length).toBeGreaterThan(0)
  })

  it('filters by status', async () => {
    const { payload } = await call(
      'GET',
      '/api/maintenance-tickets?status=OPEN',
    )
    for (const t of payload.data) {
      expect(t.status).toBe('OPEN')
    }
  })

  it('filters by the backend deviceId parameter and returns backend field names', async () => {
    const { payload } = await call(
      'GET',
      '/api/maintenance-tickets?deviceId=drn-07',
    )
    for (const t of payload.data) {
      expect(t.deviceId).toBe('drn-07')
      expect(t.ticketCode).toBeTruthy()
    }
  })
})

describe('PATCH /api/maintenance-tickets/:id/assign-staff', () => {
  it('404s for unknown ticket', async () => {
    const { status } = await call(
      'PATCH',
      '/api/maintenance-tickets/nope/assign-staff',
      { staffId: 'staff-1' },
    )
    expect(status).toBe(404)
  })

  it('400s when the required staffId is missing', async () => {
    const { status } = await call(
      'PATCH',
      '/api/maintenance-tickets/mt-2609-011/assign-staff',
      {},
    )
    expect(status).toBe(400)
  })

  it('assigns the staff member and starts work', async () => {
    const { status, payload } = await call(
      'PATCH',
      '/api/maintenance-tickets/mt-2609-011/assign-staff',
      { staffId: 'staff-1' },
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('IN_PROGRESS')
    expect(payload.data.assignedStaffId).toBe('staff-1')
  })
})

describe('PATCH /api/maintenance-tickets/:id/resolve', () => {
  it('requires resolution notes', async () => {
    const { status } = await call('PATCH', '/api/maintenance-tickets/mt-2609-011/resolve', {})
    expect(status).toBe(400)
  })

  it('sets resolved status and timestamps with the backend response shape', async () => {
    const { payload } = await call(
      'PATCH',
      '/api/maintenance-tickets/mt-2609-011/resolve',
      { resolutionNotes: 'Repaired', newDeviceStatus: 'AVAILABLE' },
    )
    expect(payload.data.status).toBe('RESOLVED')
    expect(payload.data.resolutionNotes).toBe('Repaired')
    expect(payload.data.resolvedAt).toBeTruthy()
  })
})
