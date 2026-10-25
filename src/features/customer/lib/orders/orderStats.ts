import { sortNewestFirst } from './filterOrders'
import type { OrderRow, OrderStats } from './types'

/** Dashboard KPIs computed from `GET /api/orders/mine` (no BE dashboard endpoint). */
export function computeOrderStats(rows: OrderRow[]): OrderStats {
  const count = (status: OrderRow['status']) =>
    rows.filter((row) => row.status === status).length
  return {
    total: rows.length,
    pending: count('PENDING'),
    needsInfo: count('NEEDS_INFO'),
    approved: count('APPROVED'),
    inProgress: count('IN_PROGRESS'),
    completed: count('COMPLETED'),
    rejected: count('REJECTED'),
    cancelled: count('CANCELLED'),
  }
}

export function recentOrders(rows: OrderRow[], limit: number): OrderRow[] {
  return sortNewestFirst(rows).slice(0, limit)
}
