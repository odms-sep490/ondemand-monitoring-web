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

describe('/api/services/pricing-estimate (BE shape)', () => {
  it('is not swallowed by GET /api/services/:id', async () => {
    const { status, payload } = await call('GET', '/api/services/pricing-estimate?serviceId=svc-construction')
    expect(status).toBe(200)
    expect(payload.data).toMatchObject({ serviceId: 'svc-construction', servicePrice: 3_500_000, totalPrice: 3_500_000 })
    expect(payload.data.additionalRequirements).toEqual([])
  })

  it('adds the AI add-on to the total', async () => {
    const { payload } = await call('GET', '/api/services/pricing-estimate?serviceId=svc-construction&aiImageAnalysis=true')
    expect(payload.data.additionalRequirements[0]).toMatchObject({ type: 'AI_IMAGE_ANALYSIS', additionalPrice: 500_000 })
    expect(payload.data.totalPrice).toBe(4_000_000)
  })

  it('requires serviceId', async () => {
    expect((await call('GET', '/api/services/pricing-estimate')).status).toBe(400)
  })
})

describe('reference lists', () => {
  it('filters service deliverables by service', async () => {
    const { payload } = await call('GET', '/api/service-deliverables?serviceId=svc-construction')
    expect(payload.data.map((d: any) => d.deliverableTypeId)).toEqual(['dt-photo', 'dt-video', 'dt-report'])
  })

  it('lists category services', async () => {
    expect((await call('GET', '/api/category-services')).payload.data[0]).toHaveProperty('name')
  })
})

describe('/api/zones', () => {
  it('returns a monitoring zone and a restricted zone with closed rings', async () => {
    const { payload } = await call('GET', '/api/zones')
    expect(payload.data.map((z: any) => z.restricted)).toEqual([false, true])
    const ring = payload.data[0].coordinates
    expect(ring[0]).toEqual(ring[ring.length - 1])
  })
})

describe('POST /api/orders (BE shape)', () => {
  const valid = {
    title: 'Đơn thử',
    serviceId: 'svc-construction',
    latitude: 10.6,
    longitude: 106.7,
    coverageArea: { type: 'Polygon', coordinates: [] },
    preferredDateFrom: '2026-10-01',
    preferredDateTo: '2026-10-02',
    preferredTimeId: 'pt-1',
    deliverables: [{ deliverableTypeId: 'dt-photo', requirement: {} }],
  }

  it('creates a PENDING order', async () => {
    const { status, payload } = await call('POST', '/api/orders', valid)
    expect(status).toBe(201)
    expect(payload.data).toMatchObject({ title: 'Đơn thử', orderStatus: 'PENDING' })
    expect(payload.data.id).toBeTruthy()
  })

  it('reports every missing required field', async () => {
    const { status, payload } = await call('POST', '/api/orders', { title: 'x' })
    expect(status).toBe(400)
    expect(Object.keys(payload.errors)).toEqual(expect.arrayContaining(['serviceId', 'coverageArea', 'deliverables']))
  })
})

