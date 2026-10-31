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

// Seed data summary (9 orders): cus-ord-001 IN_PROGRESS, 002 SUBMITTED,
// 003 SUBMITTED, 004 SCHEDULED, 005 APPROVED, 006 COMPLETED, 007 REJECTED,
// 008 DRAFT, 009 CANCELLED. Only the mock-only actions live in this file;
// reading orders is covered by customerOrdersBe.test.ts.

describe('POST /api/customer/orders/:id/cancel', () => {
  it('cancels a SUBMITTED order (cus-ord-003)', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-003/cancel',
    )
    expect(status).toBe(200)
    expect(payload.data.orderStatus).toBe('CANCELLED')
  })

  it('cancels an APPROVED order (cus-ord-005)', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-005/cancel',
    )
    expect(status).toBe(200)
    expect(payload.data.orderStatus).toBe('CANCELLED')
  })

  it('returns 409 for IN_PROGRESS order (cus-ord-001)', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-001/cancel',
    )
    expect(status).toBe(409)
    expect(payload.code).toBe('CANNOT_CANCEL')
  })

  it('returns 409 for COMPLETED order (cus-ord-006)', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-006/cancel',
    )
    expect(status).toBe(409)
    expect(payload.code).toBe('CANNOT_CANCEL')
  })

  it('returns 404 for unknown id', async () => {
    const { status } = await call('POST', '/api/customer/orders/no-such/cancel')
    expect(status).toBe(404)
  })

  it('shows a cancelled order as CANCELLED in GET /api/orders/mine (BE shape)', async () => {
    await call('POST', '/api/customer/orders/cus-ord-003/cancel')
    const { payload } = await call('GET', '/api/orders/mine?status=CANCELLED')
    expect(payload.data.map((o: any) => o.id)).toContain('cus-ord-003')
  })
})
