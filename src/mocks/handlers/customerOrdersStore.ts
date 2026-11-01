// Shared in-memory customer orders for the mock API.
//   - `orders`: the legacy seed (customer-orders.json) used by the mock-only
//     /api/customer/orders/* routes (cancel, draft, submit).
//   - `createdOrders`: orders made through `POST /api/orders` (BE shape).
// `listBeOrders()` projects both onto the BE `OrderCreateResponse` so
// `GET /api/orders/mine` and `GET /api/orders/{id}` stay consistent with the
// mock-only actions (a cancelled order shows up as CANCELLED).
import type { OrderCreateResponse } from '../../features/customer/api/orderApi'
import type { OrderStatus } from '../../shared/types/domain'
import { createCollection } from '../db'
import seed from '../data/customer-orders.json'

export type SeedOrder = (typeof seed.orders)[number]

export const orders = createCollection(seed.orders as SeedOrder[]) as unknown as SeedOrder[]
export const createdOrders = createCollection<OrderCreateResponse[]>([])

export const BE_ORDER_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const

/** The BE order status enum has no DRAFT / SUBMITTED / SCHEDULED. */
function toBeStatus(status: OrderStatus): (typeof BE_ORDER_STATUSES)[number] {
  if (status === 'SCHEDULED') return 'APPROVED'
  if ((BE_ORDER_STATUSES as readonly string[]).includes(status)) {
    return status as (typeof BE_ORDER_STATUSES)[number]
  }
  return 'PENDING'
}

const dateOnly = (value: string | null | undefined) => value?.slice(0, 10)

export function toBeOrder(o: SeedOrder): OrderCreateResponse {
  const history = (o.statusHistory ?? []) as Array<{ at: string }>
  const createdAt = o.submittedAt ?? history[0]?.at
  const status = toBeStatus(o.status as OrderStatus)
  return {
    id: o.id,
    orderCode: o.orderCode,
    customerId: 'usr-customer',
    customerName: 'Khách hàng',
    title: o.title,
    serviceName: o.serviceNames[0],
    description: o.description ?? undefined,
    address: o.addressText ?? undefined,
    longitude: o.centerLon ?? undefined,
    latitude: o.centerLat ?? undefined,
    radiusM: o.radiusM ?? undefined,
    preferredDateFrom: dateOnly(o.preferredDate),
    preferredDateTo: dateOnly(o.preferredDate),
    preferredTimeName: o.preferredTimeName ?? undefined,
    orderStatus: status,
    rejectReason:
      o.approvalDecision === 'REJECTED' ? (o.approvalReason ?? undefined) : undefined,
    reviewByName: o.approvalActorName ?? undefined,
    reviewAt: o.approvalAt ?? undefined,
    deliverables: [],
    createdAt,
    updatedAt: history[history.length - 1]?.at ?? createdAt,
  }
}

/** Newest first, like the BE list. */
export function listBeOrders(): OrderCreateResponse[] {
  return [...createdOrders, ...orders.map(toBeOrder)].sort((a, b) =>
    String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')),
  )
}

export function findBeOrder(id: string): OrderCreateResponse | undefined {
  return listBeOrders().find((o) => o.id === id)
}
