// Mock handlers in the BE DTO shape for the customer's mission history.
// Verified against /v3/api-docs:
//   GET /api/customer/mission-history ?page&size -> ApiResponse<PageResponse<CustomerMissionHistoryResponse>>
//   GET /api/customer/mission-history/{missionId} -> ApiResponse<CustomerMissionHistoryResponse>
// The BE only lists COMPLETED / FAILED / CANCELLED missions.
import { fail, ok, registerMockRoutes } from '../mockServer'
import type { CustomerMissionHistory } from '../../features/customer/api/customerMissionHistoryApi'

export const customerHistoryFixtures: CustomerMissionHistory[] = [
  {
    id: 'msn-006-1',
    missionCode: 'MSN-2609-0131-1',
    orderId: 'cus-ord-006',
    orderTitle: 'Kiểm tra tiến độ nhà xưởng KCN Hiệp Phước',
    address: 'KCN Hiệp Phước, H. Nhà Bè',
    status: 'COMPLETED',
    scheduledStartAt: '2026-09-09T13:00:00+07:00',
    startedAt: '2026-09-09T13:05:00+07:00',
    completedAt: '2026-09-09T13:48:00+07:00',
    description: 'Chụp ảnh toàn cảnh và cận cảnh khu B.',
  },
  {
    id: 'msn-009-1',
    missionCode: 'MSN-2609-0120-1',
    orderId: 'cus-ord-009',
    orderTitle: 'Tuần tra an ninh kho bãi Cát Lái',
    address: 'Cảng Cát Lái, TP. Thủ Đức',
    status: 'CANCELLED',
    scheduledStartAt: '2026-09-10T08:00:00+07:00',
    startedAt: null,
    completedAt: null,
    description: null,
  },
  {
    id: 'msn-004-1',
    missionCode: 'MSN-2609-0098-1',
    orderId: 'cus-ord-004',
    orderTitle: 'Bản đồ 2D khu đất dự án Long Hậu',
    address: 'Xã Long Hậu, H. Nhà Bè',
    status: 'FAILED',
    scheduledStartAt: '2026-09-06T13:00:00+07:00',
    startedAt: '2026-09-06T13:10:00+07:00',
    completedAt: null,
    description: 'Dừng do thời tiết xấu.',
  },
]

const missions = customerHistoryFixtures

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/customer/mission-history',
    handler: ({ query }) => {
      const page = Math.max(0, Number(query.get('page') ?? 0) || 0)
      const size = Math.max(1, Number(query.get('size') ?? 20) || 20)
      const totalPages = Math.max(1, Math.ceil(missions.length / size))
      return ok({
        items: missions.slice(page * size, page * size + size),
        page,
        size,
        totalItems: missions.length,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      })
    },
  },
  {
    method: 'GET',
    path: '/api/customer/mission-history/:missionId',
    handler: ({ params }) => {
      const found = missions.find((m) => m.id === params.missionId)
      return found ? ok(found) : fail(404, 'NOT_FOUND', 'Mission not found')
    },
  },
])
