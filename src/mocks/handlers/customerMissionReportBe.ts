// Explicit development fixtures only. A completed Mission does not imply a published report.
import { fail, ok, registerMockRoutes } from '../mockServer'
import { customerHistoryFixtures } from './customerMissionHistoryBe'
import { findBeOrder } from './customerOrdersStore'
import type { CustomerMissionSummary } from '../../features/customer/api/customerMissionReportApi'

function summaries(orderId: string): CustomerMissionSummary[] {
  return customerHistoryFixtures
    .filter((m) => m.orderId === orderId)
    .map((m) => ({
      missionId: m.id,
      orderId: m.orderId,
      missionCode: m.missionCode,
      scopeLabel: m.description,
      status: m.status,
      scheduledStartAt: m.scheduledStartAt,
      scheduledEndAt: m.scheduledEndAt ?? null,
      replacesMissionId: null,
      reportAvailable: false,
    }))
}
registerMockRoutes([
  {
    method: 'GET',
    path: '/api/customer/orders/:orderId/missions',
    handler: ({ params }) =>
      findBeOrder(params.orderId)
        ? ok(summaries(params.orderId))
        : fail(404, 'NOT_FOUND', 'Order not found'),
  },
  {
    method: 'GET',
    path: '/api/customer/orders/:orderId/missions/:missionId/report',
    handler: ({ params }) => {
      const mission =
        findBeOrder(params.orderId) &&
        summaries(params.orderId).find((m) => m.missionId === params.missionId)
      return mission
        ? ok({
            mission,
            reportAvailable: false,
            result: null,
            checklistItems: [],
          })
        : fail(404, 'NOT_FOUND', 'Mission not found')
    },
  },
])
