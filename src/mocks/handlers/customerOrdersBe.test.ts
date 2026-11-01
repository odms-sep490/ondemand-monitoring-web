/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { resetMockDb } from '../db'
import { mockFetch } from '../mockServer'
import '../index'

async function call(method: string, path: string, body?: unknown) {
  const response = await mockFetch(`${env.apiBaseUrl}${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, payload: await response.json() }
}

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

const VALID_ORDER = {
  title: 'Mái xưởng',
  serviceId: 'svc-1',
  address: 'KCN',
  longitude: 106.6,
  latitude: 10.7,
  coverageArea: { type: 'Polygon', coordinates: [] },
  preferredDateFrom: '2026-10-01',
  preferredDateTo: '2026-10-02',
  preferredTimeId: 'pt-1',
  deliverables: [{ deliverableTypeId: 'dt-photo', requirement: { radiusM: 300 } }],
}

describe('GET /api/orders/mine (BE shape)', () => {
  it('is not swallowed by GET /api/orders/:id and returns OrderCreateResponse[]', async () => {
    const { status, payload } = await call('GET', '/api/orders/mine')
    expect(status).toBe(200)
    expect(payload.data).toHaveLength(9)
    expect(payload.data[0]).toHaveProperty('orderStatus')
    expect(payload.data[0]).toHaveProperty('preferredDateFrom')
  })

  it('only uses BE order statuses', async () => {
    const { payload } = await call('GET', '/api/orders/mine')
    const statuses = new Set(payload.data.map((o: any) => o.orderStatus))
    for (const s of statuses) {
      expect(['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).toContain(s)
    }
  })

  it('filters by status and rejects unknown statuses', async () => {
    const done = await call('GET', '/api/orders/mine?status=COMPLETED')
    expect(done.payload.data.map((o: any) => o.id)).toEqual(['cus-ord-006'])
    const bad = await call('GET', '/api/orders/mine?status=DRAFT')
    expect(bad.status).toBe(400)
    expect(bad.payload.errors.status).toBeTruthy()
  })

  it('lists newest first and includes orders created through POST /api/orders', async () => {
    const created = await call('POST', '/api/orders', VALID_ORDER)
    const { payload } = await call('GET', '/api/orders/mine')
    expect(payload.data).toHaveLength(10)
    expect(payload.data.map((o: any) => o.id)).toContain(created.payload.data.id)
    const times = payload.data.map((o: any) => String(o.createdAt))
    expect(times).toEqual([...times].sort().reverse())
  })
})

describe('GET /api/orders/:id for customer orders', () => {
  it('returns the BE shape for a seeded order', async () => {
    const { status, payload } = await call('GET', '/api/orders/cus-ord-007')
    expect(status).toBe(200)
    expect(payload.data).toMatchObject({ id: 'cus-ord-007', orderStatus: 'REJECTED' })
    expect(payload.data.rejectReason).toBeTruthy()
  })

  it('returns a created order with its radius', async () => {
    const created = await call('POST', '/api/orders', VALID_ORDER)
    const { payload } = await call('GET', `/api/orders/${created.payload.data.id}`)
    expect(payload.data).toMatchObject({ title: 'Mái xưởng', orderStatus: 'PENDING', radiusM: 300 })
  })
})

describe('mock-only cancel reflected in the BE shape', () => {
  it('turns a seeded order into CANCELLED', async () => {
    await call('POST', '/api/customer/orders/cus-ord-003/cancel')
    const { payload } = await call('GET', '/api/orders/cus-ord-003')
    expect(payload.data.orderStatus).toBe('CANCELLED')
  })

  it('cancels an order created through POST /api/orders', async () => {
    const created = await call('POST', '/api/orders', VALID_ORDER)
    const id = created.payload.data.id
    expect((await call('POST', `/api/customer/orders/${id}/cancel`)).status).toBe(200)
    expect((await call('GET', `/api/orders/${id}`)).payload.data.orderStatus).toBe('CANCELLED')
    expect((await call('POST', `/api/customer/orders/${id}/cancel`)).status).toBe(409)
  })
})
