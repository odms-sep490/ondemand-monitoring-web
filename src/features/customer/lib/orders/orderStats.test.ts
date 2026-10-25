import { describe, expect, it } from 'vitest'

import { computeOrderStats, recentOrders } from './orderStats'
import type { OrderRow } from './types'

const row = (id: string, status: OrderRow['status'], createdAt: string): OrderRow => ({
  id,
  code: id,
  title: id,
  address: null,
  dateFrom: null,
  dateTo: null,
  timeId: null,
  timeName: null,
  serviceId: null,
  serviceName: null,
  status,
  radiusM: null,
  createdAt,
})

const rows = [
  row('a', 'PENDING', '2026-09-01T00:00:00Z'),
  row('b', 'PENDING', '2026-09-02T00:00:00Z'),
  row('c', 'IN_PROGRESS', '2026-09-03T00:00:00Z'),
  row('d', 'COMPLETED', '2026-09-04T00:00:00Z'),
  row('e', 'REJECTED', '2026-09-05T00:00:00Z'),
  row('f', 'CANCELLED', '2026-09-06T00:00:00Z'),
  row('g', 'APPROVED', '2026-09-07T00:00:00Z'),
]

describe('computeOrderStats', () => {
  it('counts orders per BE status', () => {
    expect(computeOrderStats(rows)).toEqual({
      total: 7,
      pending: 2,
      needsInfo: 0,
      approved: 1,
      inProgress: 1,
      completed: 1,
      rejected: 1,
      cancelled: 1,
    })
  })

  it('is all zeros for no orders', () => {
    expect(computeOrderStats([]).total).toBe(0)
  })
})

describe('recentOrders', () => {
  it('returns the newest orders first, capped at the limit', () => {
    expect(recentOrders(rows, 3).map((r) => r.id)).toEqual(['g', 'f', 'e'])
  })
})
