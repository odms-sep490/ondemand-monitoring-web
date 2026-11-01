// Mock handlers for the MNG-02 (order queue) and MNG-03 (order review) APIs,
// and MNG-11 (deliver results). Endpoints per evd/00-PLAN.md §3:
//   GET  /api/orders?status=PENDING          [TK path; BE OrderStatus value]
//   GET  /api/orders/{id}                    [TK]
//   GET  /api/orders/{id}/resource-preview   PROPOSED (no source endpoint)
//   PUT  /api/orders/{id}/internal-note      PROPOSED (no source endpoint)
//   POST /api/orders/{id}/approve            [BE] approve only; staff schedules later
//   POST /api/orders/{id}/approval           [BRIEF C4] {decision, reason}
//   POST /api/orders/{id}/deliver            [BRIEF C4] mark as delivered
import type {
  ApprovalDecision,
  OrderCreateResponse,
  OrderDetail,
  OrderQueueItem,
} from '../../features/manager/types/orders'
type OrderResourcePreview = Record<string, unknown>
type OrderInternalNote = { note: string; authorName: string; updatedAt: string }

import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import operationalDataSeed from '../data/order-operational-data.json'
import { findBeOrder, listBeOrders } from './customerOrdersStore'
import { missions } from './missionsStore'
import { findOrder, orders, type SeedOrder } from './ordersStore'

type Approval = {
  orderId: string
  decision: ApprovalDecision
  reason: string
  reviewerId: string
  decidedAt: string
}

const REVIEWER_NAME = 'Lê Thị Thanh Hằng'
const REVIEWER_ID = 'staff-hang-le'

// Each collection is created from the exact object/array we hold a
// reference to (not a nested property read off a bigger createCollection()
// result) — `createCollection`'s reset only keeps identity for the value it
// was given directly (arrays are spliced in place; objects have their keys
// replaced in place). Reading `createCollection(seed).nested` instead would
// leave `nested` pointing at the pre-reset value forever.
const resourcePreviews = createCollection(
  operationalDataSeed.resourcePreviews,
) as unknown as Record<string, OrderResourcePreview>
const internalNotes = createCollection(
  operationalDataSeed.internalNotes,
) as unknown as Record<string, OrderInternalNote>
const approvals = createCollection([] as Approval[])

function latestApprovalFor(orderId: string): Approval | undefined {
  const forOrder = approvals.filter((a) => a.orderId === orderId)
  return forOrder[forOrder.length - 1]
}

function toQueueItem(order: SeedOrder): OrderQueueItem {
  return {
    id: order.id,
    code: order.code,
    customer: {
      fullName: order.customer.fullName,
      companyName: order.customer.companyName,
    },
    serviceName: order.serviceName,
    preferredDate: order.preferredDate,
    preferredTimeName: order.preferredTimeName,
    submittedAt: order.submittedAt,
  }
}

// P6: `GET /api/orders/pending` [BE] — maps the seeded order straight to
// the BE `OrderCreateResponse` DTO shape rather than the TK/BRIEF-derived
// `OrderQueueItem` used by the legacy `GET /api/orders?status=PENDING` path.
function toOrderCreateResponse(order: SeedOrder): OrderCreateResponse {
  return {
    id: order.id,
    customerId: order.customerId ?? order.id,
    customerName: order.customerName ?? order.customer.fullName,
    title: order.title ?? order.serviceName,
    serviceId: order.serviceId ?? '',
    serviceName: order.serviceName,
    description: order.description ?? '',
    address: order.address ?? order.addressText ?? '',
    longitude: order.longitude ?? 0,
    latitude: order.latitude ?? 0,
    coverageArea: order.coverageArea ?? null,
    preferredDateFrom: order.preferredDateFrom ?? '',
    preferredDateTo: order.preferredDateTo ?? '',
    preferredTimeId: order.preferredTimeId ?? '',
    preferredTimeName: order.preferredTimeName,
    orderStatus: order.orderStatus ?? order.status,
    rejectReason: order.rejectReason ?? null,
    reviewById: order.reviewById ?? null,
    reviewByName: order.reviewByName ?? null,
    reviewAt: order.reviewAt ?? null,
    deliverables: order.deliverables ?? [],
    createdAt: order.createdAt ?? order.submittedAt,
    updatedAt: order.updatedAt ?? order.submittedAt,
  }
}

function toDetail(order: SeedOrder): OrderDetail {
  return {
    id: order.id,
    code: order.code,
    status: order.status,
    customer: order.customer,
    serviceName: order.serviceName,
    preferredDate: order.preferredDate,
    preferredTimeName: order.preferredTimeName,
    preferredWindow: order.preferredWindow,
    submittedAt: order.submittedAt,
    addressText: order.addressText,
    center: order.center,
    radiusM: order.radiusM,
    mediaRequirements: order.mediaRequirements,
    purpose: order.purpose,
    attachments: order.attachments,
  }
}

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/orders',
    handler: ({ query }) => {
      const status = query.get('status')
      if (status && status !== 'PENDING') {
        return ok<OrderQueueItem[]>([])
      }
      const rows = orders
        .filter((o) => o.status === 'PENDING')
        .filter((o) => latestApprovalFor(o.id)?.decision !== 'NEED_INFO')
        .map(toQueueItem)
      return ok(rows)
    },
  },
  // ── P6: GET /api/orders/pending [BE] — same PENDING filter as the query
  // form above, but returns the BE `OrderCreateResponse[]` shape. ─────────
  {
    method: 'GET',
    path: '/api/orders/pending',
    handler: () => {
      const rows = orders
        .filter((o) => o.status === 'PENDING')
        .filter((o) => latestApprovalFor(o.id)?.decision !== 'NEED_INFO')
        .map(toOrderCreateResponse)
      return ok(rows)
    },
  },
  {
    method: 'GET',
    path: '/api/orders/approved',
    handler: () => {
      const seeded = orders
        .filter((o) => o.status === 'APPROVED')
        .map(toOrderCreateResponse)
      const customerOrders = listBeOrders().filter((o) => o.orderStatus === 'APPROVED')
      const rows = [...seeded, ...customerOrders]
      return ok(rows)
    },
  },
  {
    method: 'GET',
    path: '/api/orders/:id',
    handler: ({ params }) => {
      // The signed-in customer's own orders (BE OrderCreateResponse shape).
      const mine = findBeOrder(params.id)
      if (mine) return ok(mine)
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      if (order.status !== 'PENDING') {
        return fail(
          409,
          'ORDER_NOT_UNDER_REVIEW',
          'Đơn không còn ở trạng thái chờ duyệt (đã được xử lý bởi đồng nghiệp) hoặc máy chủ lỗi.',
        )
      }
      return ok(toDetail(order))
    },
  },
  {
    method: 'GET',
    path: '/api/orders/:id/resource-preview',
    handler: ({ params }) => {
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      // null (not an invented default) for orders without a design-sourced
      // resource preview.
      return ok<OrderResourcePreview | null>(
        resourcePreviews[order.code] ?? null,
      )
    },
  },
  {
    method: 'PUT',
    path: '/api/orders/:id/internal-note',
    handler: ({ params, body }) => {
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      const { note } = (body ?? {}) as { note?: string }
      const value: OrderInternalNote = {
        note: note ?? '',
        authorName: REVIEWER_NAME,
        updatedAt: new Date().toISOString(),
      }
      internalNotes[order.code] = value
      return ok(value)
    },
  },
  {
    method: 'POST',
    path: '/api/orders/:id/approve',
    handler: ({ params }) => {
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      if (order.status !== 'PENDING') {
        return fail(
          409,
          'ORDER_NOT_UNDER_REVIEW',
          'Đơn không còn ở trạng thái chờ duyệt.',
        )
      }
      order.status = 'APPROVED'
      order.orderStatus = 'APPROVED'
      order.reviewById = REVIEWER_ID
      order.reviewByName = REVIEWER_NAME
      order.reviewAt = new Date().toISOString()
      return ok(toOrderCreateResponse(order), 'Order approved successfully')
    },
  },
  {
    method: 'POST',
    path: '/api/orders/:id/approval',
    handler: ({ params, body }) => {
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      const { decision, reason } = (body ?? {}) as {
        decision?: ApprovalDecision
        reason?: string
      }
      if (!reason || !reason.trim()) {
        return fail(400, 'VALIDATION_ERROR', 'Yêu cầu nhập lý do', {
          reason: 'Lý do là bắt buộc',
        })
      }
      if (decision !== 'REJECTED' && decision !== 'NEED_INFO') {
        return fail(400, 'VALIDATION_ERROR', 'decision không hợp lệ', {
          decision: 'decision phải là REJECTED hoặc NEED_INFO',
        })
      }
      if (order.status !== 'PENDING') {
        return fail(
          409,
          'ORDER_NOT_UNDER_REVIEW',
          'Đơn không còn ở trạng thái chờ duyệt.',
        )
      }

      approvals.push({
        orderId: order.id,
        decision,
        reason,
        reviewerId: REVIEWER_ID,
        decidedAt: new Date().toISOString(),
      })

      if (decision === 'REJECTED') {
        order.status = 'REJECTED'
      }
      // NEED_INFO: backend OrderStatus has no matching value (conflict,
      // documented in evd/P4-manager-order-review.md) — order stays PENDING,
      // the queue query above filters it out via latestApprovalFor().

      return ok(undefined, 'Đã ghi nhận quyết định')
    },
  },
  {
    // PROPOSED (P5) — see OrderMissionBrief doc in
    // features/manager/types/orders.ts for why GET /api/orders/:id can't
    // serve CreateMissionPage (it 409s once the order leaves PENDING).
    method: 'GET',
    path: '/api/orders/:id/mission-brief',
    handler: ({ params }) => {
      const order = findOrder(params.id)
      if (order) {
        if (order.status !== 'APPROVED') {
          return fail(
            409,
            'ORDER_NOT_APPROVED',
            'Đơn chưa được duyệt, chưa thể tạo nhiệm vụ.',
          )
        }
        return ok({
          id: order.id,
          code: order.code,
          serviceName: order.serviceName,
          customerFullName: order.customer.fullName,
          preferredDate: order.preferredDate,
          preferredDateFrom: order.preferredDateFrom ?? order.preferredDate,
          preferredDateTo: order.preferredDateTo ?? order.preferredDate,
          preferredTimeName: order.preferredTimeName,
          addressText: order.addressText,
          center: order.center,
          radiusM: order.radiusM,
          nearestBase: order.nearestBase,
          mediaRequirements: order.mediaRequirements,
        })
      }

      const beOrder = findBeOrder(params.id)
      if (!beOrder) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      if (beOrder.orderStatus !== 'APPROVED') {
        return fail(
          409,
          'ORDER_NOT_APPROVED',
          'Đơn chưa được duyệt, chưa thể tạo nhiệm vụ.',
        )
      }
      return ok({
        id: beOrder.id,
        code: beOrder.id,
        serviceName: beOrder.serviceName,
        customerFullName: beOrder.customerName || beOrder.customerId,
        preferredDate: beOrder.preferredDateFrom,
        preferredDateFrom: beOrder.preferredDateFrom,
        preferredDateTo: beOrder.preferredDateTo,
        preferredTimeName: beOrder.preferredTimeName,
        addressText: beOrder.address ?? null,
        center:
          beOrder.latitude != null && beOrder.longitude != null
            ? { lat: beOrder.latitude, lon: beOrder.longitude }
            : null,
        radiusM: beOrder.radiusM ?? null,
        nearestBase: null,
        mediaRequirements: beOrder.deliverables?.map((item) => ({
          label: item.deliverableTypeName,
        })) ?? null,
      })
    },
  },
  // ── MNG-11: POST /api/orders/:id/deliver [BRIEF C4] ──────────────────
  {
    method: 'POST',
    path: '/api/orders/:id/deliver',
    handler: ({ params, body }) => {
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      if (order.status !== 'COMPLETED' && order.status !== 'IN_PROGRESS') {
        return fail(
          409,
          'ORDER_NOT_DELIVERABLE',
          'Đơn chưa hoàn thành, chưa thể giao kết quả.',
        )
      }
      const b = body as { deliveryNote?: string } | null
      order.status = 'COMPLETED'
      return ok({
        id: order.id,
        code: order.code,
        status: order.status,
        deliveryNote: b?.deliveryNote ?? null,
        deliveredAt: new Date().toISOString(),
      })
    },
  },
])

/** Test-only escape hatch to assert on the in-memory mock collections. */
export const __testing = { missions, approvals }
