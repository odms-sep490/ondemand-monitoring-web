/* eslint-disable @typescript-eslint/no-explicit-any -- test helper reads
   arbitrary mock envelope payloads; a precise type isn't worth the noise. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { resetMockDb } from '../db'
import { mockFetch } from '../mockServer'
import { __testing } from './managerOrders'

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

beforeEach(() => {
  resetMockDb()
})
afterEach(() => {
  resetMockDb()
})

describe('GET /api/orders?status=PENDING', () => {
  it('returns the 6 seeded PENDING rows, FEASIBLE=3 / RISKY=3 / INFEASIBLE=0', async () => {
    const { status, payload } = await call('GET', '/api/orders?status=PENDING')
    expect(status).toBe(200)
    expect(payload.data).toHaveLength(6)
    const byVerdict = payload.data.reduce(
      (acc: Record<string, number>, r: any) => {
        acc[r.aiVerdict] = (acc[r.aiVerdict] ?? 0) + 1
        return acc
      },
      {},
    )
    expect(byVerdict).toEqual({ FEASIBLE: 3, RISKY: 3 })
  })

  it('excludes an order whose latest approval decision is NEED_INFO', async () => {
    await call('POST', '/api/orders/ord-2609-0157/approval', {
      decision: 'NEED_INFO',
      reason: 'Cần mặt bằng chi tiết',
    })
    const { payload } = await call('GET', '/api/orders?status=PENDING')
    expect(payload.data).toHaveLength(5)
    expect(payload.data.some((r: any) => r.code === 'ORD-2609-0157')).toBe(
      false,
    )
  })
})

describe('GET /api/orders/{id}', () => {
  it('404s for an unknown id', async () => {
    const { status, payload } = await call('GET', '/api/orders/nope')
    expect(status).toBe(404)
    expect(payload.code).toBe('NOT_FOUND')
  })

  it('409s ORDER_NOT_UNDER_REVIEW once the order is no longer PENDING', async () => {
    await call('POST', '/api/orders/ord-2609-0157/approve')
    const { status, payload } = await call('GET', '/api/orders/ord-2609-0157')
    expect(status).toBe(409)
    expect(payload.code).toBe('ORDER_NOT_UNDER_REVIEW')
  })

  it('returns full detail for a PENDING order', async () => {
    const { status, payload } = await call('GET', '/api/orders/ord-2609-0157')
    expect(status).toBe(200)
    expect(payload.data.code).toBe('ORD-2609-0157')
    expect(payload.data.addressText).toContain('Cát Lái')
  })
})

describe('GET /api/orders/{id}/analysis/latest', () => {
  it('returns design findings for ORD-2609-0157 (FEASIBLE)', async () => {
    const { payload } = await call(
      'GET',
      '/api/orders/ord-2609-0157/analysis/latest',
    )
    expect(payload.data.overallVerdict).toBe('FEASIBLE')
    expect(payload.data.findings).toHaveLength(2)
  })

  it('returns design findings for ORD-2609-0160 (RISKY)', async () => {
    const { payload } = await call(
      'GET',
      '/api/orders/ord-2609-0160/analysis/latest',
    )
    expect(payload.data.overallVerdict).toBe('RISKY')
    expect(payload.data.warningCount).toBe(2)
    expect(payload.data.findings).toHaveLength(2)
  })

  it('falls back to the queue verdict/counts with empty findings for other orders', async () => {
    const { payload } = await call(
      'GET',
      '/api/orders/ord-2609-0161/analysis/latest',
    )
    expect(payload.data.overallVerdict).toBe('RISKY')
    expect(payload.data.findings).toEqual([])
    expect(payload.data.ruleEngineMs).toBeNull()
    expect(payload.data.createdAt).toBeNull()
    expect(payload.data.llmSummary).toBeNull()
  })
})

describe('orders without design-sourced detail content', () => {
  it('GET /api/orders/{id} returns null for every unsourced detail field', async () => {
    const { payload } = await call('GET', '/api/orders/ord-2609-0149')
    expect(payload.data.addressText).toBeNull()
    expect(payload.data.center).toBeNull()
    expect(payload.data.radiusM).toBeNull()
    expect(payload.data.mediaRequirements).toBeNull()
    expect(payload.data.purpose).toBeNull()
    expect(payload.data.attachments).toBeNull()
    expect(payload.data.preferredWindow).toBeNull()
    expect(payload.data.customer.email).toBeNull()
    expect(payload.data.customer.phone).toBeNull()
  })

  it('GET resource-preview returns null instead of an invented default', async () => {
    const { payload } = await call(
      'GET',
      '/api/orders/ord-2609-0149/resource-preview',
    )
    expect(payload.data).toBeNull()
  })
})

describe('POST /api/orders/{id}/approval', () => {
  it('400s VALIDATION_ERROR when reason is blank', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/orders/ord-2609-0157/approval',
      {
        decision: 'REJECTED',
        reason: '  ',
      },
    )
    expect(status).toBe(400)
    expect(payload.code).toBe('VALIDATION_ERROR')
    expect(payload.errors.reason).toBeTruthy()
  })

  it('REJECTED sets the order status to REJECTED', async () => {
    await call('POST', '/api/orders/ord-2609-0157/approval', {
      decision: 'REJECTED',
      reason: 'Vùng cấm bay',
    })
    const { status, payload } = await call('GET', '/api/orders/ord-2609-0157')
    expect(status).toBe(409)
    expect(payload.code).toBe('ORDER_NOT_UNDER_REVIEW')
  })
})

describe('POST /api/orders/{id}/approve', () => {
  it('approves without creating a mission in the mock missions collection', async () => {
    const missionCountBefore = __testing.missions.length
    const { status, payload } = await call(
      'POST',
      '/api/orders/ord-2609-0157/approve',
    )
    expect(status).toBe(200)
    expect(payload.success).toBe(true)
    expect(__testing.missions.length).toBe(missionCountBefore)

    const orderResponse = await call('GET', '/api/orders/ord-2609-0157')
    expect(orderResponse.status).toBe(409)
    const briefResponse = await call(
      'GET',
      '/api/orders/ord-2609-0157/mission-brief',
    )
    expect(briefResponse.status).toBe(200)
  })

  it('409s when the order is no longer PENDING', async () => {
    await call('POST', '/api/orders/ord-2609-0157/approve')
    const { status, payload } = await call(
      'POST',
      '/api/orders/ord-2609-0157/approve',
    )
    expect(status).toBe(409)
    expect(payload.code).toBe('ORDER_NOT_UNDER_REVIEW')
  })
})

describe('resource-preview and internal-note', () => {
  it('GET resource-preview returns the design numbers for ORD-2609-0160', async () => {
    const { payload } = await call(
      'GET',
      '/api/orders/ord-2609-0160/resource-preview',
    )
    expect(payload.data.eligibleDroneCount).toBe(2)
    expect(payload.data.eligiblePilotCount).toBe(1)
  })

  it('PUT internal-note upserts and returns the note', async () => {
    const { status, payload } = await call(
      'PUT',
      '/api/orders/ord-2609-0157/internal-note',
      {
        note: 'Ghi chú test',
      },
    )
    expect(status).toBe(200)
    expect(payload.data.note).toBe('Ghi chú test')
    expect(payload.data.authorName).toBe('Lê Thị Thanh Hằng')
  })
})

describe('GET /api/orders/{id}/mission-brief', () => {
  it('resolves the seeded APPROVED order for CreateMissionPage', async () => {
    const { status, payload } = await call(
      'GET',
      '/api/orders/ord-2609-0153/mission-brief',
    )
    expect(status).toBe(200)
    expect(payload.data.serviceName).toBe(
      'Kiểm tra nhiệt mái nhà xưởng KCN Hiệp Phước',
    )
    expect(payload.data.customerFullName).toBe('Trần Thị Thu Hà')
    expect(payload.data.radiusM).toBe(300)
  })

  it('409s for a PENDING order', async () => {
    const { status, payload } = await call(
      'GET',
      '/api/orders/ord-2609-0157/mission-brief',
    )
    expect(status).toBe(409)
    expect(payload.code).toBe('ORDER_NOT_APPROVED')
  })

  it('404s for an unknown order', async () => {
    const { status } = await call('GET', '/api/orders/nope/mission-brief')
    expect(status).toBe(404)
  })
})
