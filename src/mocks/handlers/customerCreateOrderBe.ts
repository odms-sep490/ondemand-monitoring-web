// Mock handlers in the BE DTO shape (ApiResponse envelope) for the customer
// "create order" wizard, so it runs offline. Verified against /v3/api-docs:
//   GET  /api/services/pricing-estimate        ?serviceId&aiImageAnalysis
//   GET  /api/service-deliverables             ?serviceId&deliverableTypeId
//   GET  /api/category-services
//   GET  /api/zones                            ZoneResponse[] (simulation map zones)
//   POST /api/orders                           OrderCreateRequest -> OrderCreateResponse
// Must be imported BEFORE catalogBe so `/api/services/pricing-estimate` is not
// swallowed by `GET /api/services/:id`.
import type { OrderCreateResponse } from '../../features/customer/api/orderApi'
import {
  created,
  fail,
  isRealApiRoute,
  ok,
  passThrough,
  registerMockRoutes,
} from '../mockServer'
import {
  mockCategoryServices,
  mockServiceDeliverables,
} from '../data/customerCreateOrderSeeds'
import { createdOrders } from './customerOrdersStore'
import type {
  ChecklistInput,
  ServiceChecklistItem,
} from '../../features/customer/lib/checklist/types'

export const mockServiceChecklist = (
  serviceId: string,
): ServiceChecklistItem[] =>
  (
    ({
      'svc-construction': [
        'Kiểm tra tình trạng tổng thể công trình',
        'Ghi nhận tiến độ các khu vực đang thi công',
        'Kiểm tra mặt ngoài công trình',
        'Quan sát khu vực khó tiếp cận',
        'Chụp ảnh tổng quan công trình',
        'Ghi nhận hiện trạng sau khi hoàn tất kiểm tra',
      ],
      'svc-factory': [
        'Kiểm tra tình trạng tổng thể nhà xưởng',
        'Kiểm tra mái nhà xưởng',
        'Kiểm tra bề mặt và kết cấu phía trên',
        'Quan sát khu vực khó tiếp cận',
        'Chụp ảnh các vị trí bất thường',
        'Ghi nhận hiện trạng sau khi hoàn tất kiểm tra',
      ],
      'svc-area': [
        'Ghi nhận toàn cảnh khu vực',
        'Ghi nhận các khu vực chính',
        'Quan sát khu vực khó tiếp cận',
        'Chụp ảnh các vị trí khách hàng yêu cầu',
        'Ghi nhận hiện trạng khu vực',
      ],
      'svc-forest': [
        'Ghi nhận toàn cảnh khu vực rừng',
        'Quan sát tình trạng khu vực cây xanh',
        'Quan sát khu vực có dấu hiệu bất thường',
        'Quan sát khu vực khó tiếp cận',
        'Chụp ảnh các vị trí được chỉ định',
        'Ghi nhận hiện trạng sau khi hoàn tất giám sát',
      ],
    })[serviceId] ?? []
  ).map((content, index) => ({
    id: `assignment-${serviceId}-${index + 1}`,
    serviceId,
    checklistId: `check-${serviceId}-${index + 1}`,
    content,
    displayOrder: index,
    checklistVersion: 1,
    serviceActive: true,
    checklistActive: true,
  }))

const SERVICE_PRICES: Record<string, number> = {
  'svc-construction': 3_500_000,
  'svc-factory': 3_000_000,
  'svc-area': 2_500_000,
  'svc-forest': 4_000_000,
}
const DEFAULT_SERVICE_PRICE = 2_000_000
const AI_ANALYSIS_PRICE = 500_000

// Simulation-map zones: one big monitoring zone containing the wizard's default
// point and one restricted (no-fly) zone away from it.
const square = (min: number, max: number) => [
  [min, min],
  [max, min],
  [max, max],
  [min, max],
  [min, min],
]
const zones = [
  {
    id: 'zone-mon',
    code: 'MON-1',
    name: 'Khu giám sát A',
    zoneType: 'MONITORING',
    restricted: false,
    coordinates: square(0, 1000),
  },
  {
    id: 'zone-nofly',
    code: 'NOFLY-1',
    name: 'Vùng cấm sân bay',
    zoneType: 'RESTRICTED',
    restricted: true,
    coordinates: square(500, 600),
  },
]

/** The wizard stores the picked radius in the first deliverable requirement. */
function radiusOf(deliverables: unknown): number | undefined {
  const first = Array.isArray(deliverables) ? deliverables[0] : undefined
  const radius = Number(first?.requirement?.radiusM)
  return Number.isFinite(radius) && radius > 0 ? radius : undefined
}

let seq = 0
const nextId = (prefix: string) => `${prefix}-${++seq}`


const REQUIRED = [
  'title',
  'serviceId',
  'latitude',
  'longitude',
  'coverageArea',
  'preferredDateFrom',
  'preferredDateTo',
  'preferredTimeId',
  'deliverables',
] as const

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/services/:serviceId/checklists',
    handler: ({ params }) => ok(mockServiceChecklist(params.serviceId)),
  },
  {
    method: 'GET',
    path: '/api/services/pricing-estimate',
    handler: ({ query }) => {
      const serviceId = query.get('serviceId')
      if (!serviceId) {
        return fail(400, 'VALIDATION_ERROR', 'Validation failed', {
          serviceId: 'serviceId is required',
        })
      }
      const servicePrice = SERVICE_PRICES[serviceId] ?? DEFAULT_SERVICE_PRICE
      const withAi = query.get('aiImageAnalysis') === 'true'
      const additionalRequirements = withAi
        ? [
            {
              type: 'AI_IMAGE_ANALYSIS',
              description: 'AI image analysis',
              additionalPrice: AI_ANALYSIS_PRICE,
            },
          ]
        : []
      return ok({
        serviceId,
        servicePrice,
        additionalRequirements,
        totalPrice: servicePrice + (withAi ? AI_ANALYSIS_PRICE : 0),
      })
    },
  },
  {
    method: 'GET',
    path: '/api/service-deliverables',
    handler: ({ query }) => {
      const serviceId = query.get('serviceId')
      const typeId = query.get('deliverableTypeId')
      return ok(
        mockServiceDeliverables.filter(
          (d) =>
            (!serviceId || d.serviceId === serviceId) &&
            (!typeId || d.deliverableTypeId === typeId),
        ),
      )
    },
  },
  { method: 'GET', path: '/api/zones', handler: () => ok([...zones]) },
  {
    method: 'GET',
    path: '/api/category-services',
    handler: () => ok([...mockCategoryServices]),
  },
  {
    method: 'POST',
    path: '/api/orders',
    handler: ({ body }) => {
      if (isRealApiRoute('POST', '/api/orders')) return passThrough()
      const b = (body ?? {}) as Record<string, unknown>
      const errors: Record<string, string> = {}
      for (const key of REQUIRED) {
        const value = b[key]
        if (value === undefined || value === null || value === '')
          errors[key] = `${key} is required`
      }
      if (Array.isArray(b.deliverables) && b.deliverables.length === 0) {
        errors.deliverables = 'deliverables must not be empty'
      }
      if (Object.keys(errors).length) {
        return fail(400, 'VALIDATION_ERROR', 'Validation failed', errors)
      }
      const now = new Date().toISOString()
      const template = mockServiceChecklist(String(b.serviceId))
      const checklist = (b.checklistItems ??
        template.map((item) => ({
          sourceChecklistId: item.checklistId,
          expectedChecklistVersion: item.checklistVersion,
        }))) as ChecklistInput[]
      const order: OrderCreateResponse = {
        id: nextId('ord'),
        customerId: 'usr-customer',
        customerName: 'Khách hàng',
        title: String(b.title),
        serviceId: String(b.serviceId),
        description: b.description as string | undefined,
        address: b.address as string | undefined,
        longitude: Number(b.longitude),
        latitude: Number(b.latitude),
        radiusM: radiusOf(b.deliverables),
        coverageArea: b.coverageArea as Record<string, unknown>,
        preferredDateFrom: String(b.preferredDateFrom),
        preferredDateTo: String(b.preferredDateTo),
        preferredTimeId: String(b.preferredTimeId),
        orderStatus: 'PENDING',
        checklistSnapshotAt: now,
        checklistItems: checklist.map((item, displayOrder) => ({
          id: nextId('snapshot'),
          sourceChecklistId: item.sourceChecklistId ?? null,
          content:
            item.contentOverride ??
            template.find((row) => row.checklistId === item.sourceChecklistId)
              ?.content ??
            '',
          displayOrder,
          ...(item.sourceChecklistId
            ? (() => {
                const source = template.find(
                  (row) => row.checklistId === item.sourceChecklistId,
                )
                return {
                  description: source?.description,
                  executionSteps: source?.executionSteps,
                  inputRequirements: source?.inputRequirements,
                  expectedOutputs: source?.expectedOutputs,
                }
              })()
            : {}),
          sourceType: item.sourceChecklistId
            ? 'SERVICE_TEMPLATE'
            : 'CUSTOMER_CUSTOM',
          minimumEvidenceCount: item.minimumEvidenceCount ?? 1,
          requiredEvidenceType: item.requiredEvidenceType ?? 'IMAGE_OR_VIDEO',
        })),
        deliverables: (b.deliverables as Array<Record<string, unknown>>).map(
          (d, i) => ({
            id: `od-${i + 1}`,
            deliverableTypeId: String(d.deliverableTypeId),
            requirement: (d.requirement as Record<string, unknown>) ?? {},
          }),
        ),
        createdAt: now,
        updatedAt: now,
      }
      createdOrders.push(order)
      return created(order)
    },
  },
])
