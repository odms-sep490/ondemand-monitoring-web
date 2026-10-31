// Shared in-memory orders collection for the mock API. `managerOrders.ts`
// (P4) and `managerMissions.ts` (P5 — needs to read `order.status` to
// enforce the `ORDER_NOT_APPROVED` rule on `POST /orders/{id}/missions`)
// both need the *same* array: two independent
// `createCollection(ordersSeed.orders)` calls would silently diverge the
// moment one handler mutates `order.status` (P4's `approve()` did exactly
// this — see missionsStore.ts for the equivalent problem with missions).
import type { OrderStatus } from '../../shared/types/domain'
import { createCollection } from '../db'
import ordersSeed from '../data/orders.json'

export type SeedOrder = {
  id: string
  code: string
  status: OrderStatus
  customer: {
    fullName: string
    companyName: string
    email: string | null
    phone: string | null
  }
  serviceName: string
  preferredDate: string
  preferredTimeName: string
  preferredWindow: string | null
  submittedAt: string
  addressText: string | null
  center: { lat: number; lon: number } | null
  radiusM: number | null
  nearestBase: string | null
  mediaRequirements: { label: string }[] | null
  purpose: string | null
  attachments:
    | {
        name: string
        sizeLabel: string
        mimeType: string
        url: string
      }[]
    | null
  // P6 additions — BE `OrderCreateResponse` fields, kept alongside the
  // pre-existing TK/BRIEF fields above rather than replacing them (see
  // features/manager/types/orders.ts `OrderCreateResponse`).
  customerId?: string
  customerName?: string
  title?: string
  serviceId?: string
  description?: string
  address?: string
  longitude?: number
  latitude?: number
  coverageArea?: Record<string, unknown> | null
  preferredDateFrom?: string
  preferredDateTo?: string
  preferredTimeId?: string
  orderStatus?: OrderStatus
  rejectReason?: string | null
  reviewById?: string | null
  reviewByName?: string | null
  reviewAt?: string | null
  deliverables?: {
    id: string
    deliverableTypeId: string
    deliverableTypeName: string
    defaultFormat: string
    requirement: Record<string, unknown> | null
  }[]
  createdAt?: string
  updatedAt?: string
}

export const orders = createCollection(ordersSeed.orders) as SeedOrder[]

export function findOrder(id: string): SeedOrder | undefined {
  return orders.find((o) => o.id === id || o.code === id)
}
