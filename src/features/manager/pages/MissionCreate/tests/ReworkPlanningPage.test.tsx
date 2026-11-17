import { InternalCorrectionPlanningPage } from '../InternalCorrectionPlanningPage'
import {
  inspectionCorrectionApi,
  type InspectionCorrection,
} from '../../../../mission/inspection/inspectionCorrectionApi'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ReworkPlanningPage } from '../ReworkPlanningPage'
import { OrderMissionPlanningSection } from '../../OrderReview/components/OrderMissionPlanningSection'
import { setLanguage } from '../../../../../shared/i18n'
import { ordersApi } from '../../../api/ordersApi'
import { planningApi } from '../../../api/planningApi'
import { missionsApi } from '../../../api/missionsApi'
import { financeApi } from '../../../../finance/api'
import { deliveryApi, type ResultRevisionCase } from '../../../../delivery/api'
import type { MissionResponse } from '../../../types/missions'
import type { OrderDetail, OrderMissionBrief } from '../../../types/orders'
import type { Invoice } from '../../../../finance/types'
import type { ExecutionPlan } from '../../../types/planning'

const checklistItems = ['A', 'B', 'C'].map((id, displayOrder) => ({
  id,
  content: `Công việc ${id}`,
  displayOrder,
  sourceType: 'CUSTOMER_CUSTOM' as const,
  sourceChecklistId: null,
}))
const original = {
  id: 'original',
  orderId: 'order',
  missionCode: 'MS-ORIGINAL',
  purpose: 'ORIGINAL',
  status: 'COMPLETED',
  staffAssignments: [],
  deviceAssignments: [],
} as unknown as MissionResponse
let missions: MissionResponse[]
let assignments: Record<string, string[]>
let revisionCase: ResultRevisionCase
let invoice: Invoice

function reworkMission(): MissionResponse {
  return {
    ...original,
    id: 'rework-1',
    missionCode: 'MS-REWORK',
    purpose: 'REWORK',
    resultRevisionCaseId: 'case',
    status: 'PLANNING',
    scheduledStartAt: '2099-11-11T03:00:00Z',
    scheduledEndAt: '2099-11-11T04:00:00Z',
  }
}

beforeEach(() => {
  vi.spyOn(deliveryApi, 'managerEnsureReworkDrafts').mockResolvedValue(
    undefined,
  )
  vi.spyOn(inspectionCorrectionApi, 'ensureDraft').mockResolvedValue(
    {} as MissionResponse,
  )
  setLanguage('vi')
  window.location.hash = '#portal/manager/orders/order/rework/case'
  missions = [original]
  assignments = { original: ['A', 'B', 'C'] }
  invoice = {
    id: 'invoice',
    status: 'PAID',
    remainingAmount: 0,
    paidAmount: 100,
    totalAmount: 100,
    depositAmount: 30,
    finalPaymentAllowed: false,
  } as Invoice
  revisionCase = {
    caseId: 'case',
    orderId: 'order',
    ticketId: 'ticket',
    ticketCode: 'TKT-1',
    status: 'OPEN',
    active: true,
    version: 1,
    openedAt: '',
    items: ['A', 'B', 'C'].map((id) => ({
      caseItemId: `case-${id}`,
      orderChecklistItemId: id,
      title: `Công việc ${id}`,
      scopeDecision: id === 'C' ? 'OUT_OF_SCOPE' : 'IN_SCOPE',
      strategy: id === 'C' ? 'UNDECIDED' : 'REWORK',
      status: 'IN_PROGRESS',
      scopeReason: '',
      managerInstructions: '',
      assignedReworkMissionId: null,
      assignedReworkMissionStatus: null,
      version: 1,
      feedback: [],
    })),
  }
  vi.spyOn(ordersApi, 'getOrder').mockResolvedValue({
    id: 'order',
    status: 'COMPLETED',
    checklistItems,
    customer: { fullName: 'Customer' },
  } as OrderDetail)
  vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue({
    id: 'order',
    code: 'ORD-1',
    serviceName: 'Giám sát',
    customerFullName: 'Customer',
    preferredDate: '09/11',
    preferredTimeName: 'Buổi sáng',
    center: null,
    checklistItems,
  } as OrderMissionBrief)
  vi.spyOn(financeApi, 'getManagerInvoice').mockImplementation(async () =>
    structuredClone(invoice),
  )
  vi.spyOn(deliveryApi, 'managerGetRevisionCase').mockImplementation(async () =>
    structuredClone(revisionCase),
  )
  vi.spyOn(planningApi, 'getOrderMissions').mockImplementation(async () =>
    structuredClone(missions),
  )
  vi.spyOn(planningApi, 'getExecutionPlan').mockResolvedValue({
    orderId: 'order',
    planStatus: 'FINALIZED',
    revision: 4,
    missions: [
      {
        missionId: 'original',
        scopeLabel: 'Original',
        assignmentCount: 3,
        checklistItemIds: ['A', 'B', 'C'],
      },
    ],
    coverage: {
      total: 3,
      covered: 3,
      uncovered: 0,
      repeated: 0,
      coverageReady: true,
      uncoveredItemIds: [],
    },
    blockers: [],
  } as ExecutionPlan)
  vi.spyOn(planningApi, 'getAssignments').mockImplementation(async (id) => ({
    missionId: id,
    revision: 4,
    assignments: (assignments[id] ?? []).map(
      (orderChecklistItemId, displayOrder) => ({
        assignmentId: `${id}-${orderChecklistItemId}`,
        orderChecklistItemId,
        content: `Công việc ${orderChecklistItemId}`,
        sourceType: 'CUSTOMER_CUSTOM',
        displayOrder,
        active: true,
        version: 0,
      }),
    ),
  }))
})
afterEach(() => {
  vi.restoreAllMocks()
  window.location.hash = ''
})

it('keeps the original workspace locked before the deposit is paid', async () => {
  missions = []
  invoice = {
    ...invoice,
    status: 'ISSUED',
    paidAmount: 0,
    remainingAmount: 100,
  }
  vi.mocked(ordersApi.getOrder).mockResolvedValue({
    id: 'order',
    status: 'APPROVED',
    checklistItems,
  } as OrderDetail)
  const plan = await planningApi.getExecutionPlan('order')
  vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
    ...plan,
    planStatus: 'DRAFT',
  })
  render(<OrderMissionPlanningSection orderId="order" />)
  expect(
    await screen.findByText(/Đang chờ khách hàng thanh toán đặt cọc/),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /Thêm mới nhiệm vụ/ }),
  ).not.toBeInTheDocument()
  expect(deliveryApi.managerGetRevisionCase).not.toHaveBeenCalled()
})

it('preserves original planning after the deposit without requiring the final balance', async () => {
  invoice = {
    ...invoice,
    status: 'PARTIALLY_PAID',
    paidAmount: 30,
    remainingAmount: 70,
  }
  vi.mocked(ordersApi.getOrder).mockResolvedValue({
    id: 'order',
    status: 'APPROVED',
    checklistItems,
  } as OrderDetail)
  const plan = await planningApi.getExecutionPlan('order')
  vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
    ...plan,
    planStatus: 'DRAFT',
  })
  render(<OrderMissionPlanningSection orderId="order" />)
  expect(
    await screen.findByRole('button', { name: /Thêm mới nhiệm vụ/ }),
  ).toBeEnabled()
  expect(deliveryApi.managerGetRevisionCase).not.toHaveBeenCalled()
})

it.each(['IN_PROGRESS', 'COMPLETED'] as const)(
  'opens automatically prepared rework drafts while the Order is %s',
  async (status) => {
    vi.mocked(ordersApi.getOrder).mockResolvedValue({
      id: 'order',
      status,
      checklistItems,
      customer: { fullName: 'Customer' },
    } as OrderDetail)
    vi.mocked(deliveryApi.managerEnsureReworkDrafts).mockImplementation(
      async () => {
        if (!missions.some((mission) => mission.id === 'rework-1')) {
          missions.push({
            ...reworkMission(),
            scheduledStartAt: null,
            scheduledEndAt: null,
          })
          assignments['rework-1'] = ['A', 'B']
        }
      },
    )
    const manual = vi.spyOn(missionsApi, 'createReworkMission')
    const originalCreate = vi.spyOn(missionsApi, 'createMission')
    render(<ReworkPlanningPage orderId="order" caseId="case" />)
    const card = await screen.findByRole('article', { name: 'MS-REWORK' })
    expect(within(card).getByText('Công việc A')).toBeInTheDocument()
    expect(within(card).getByText('Công việc B')).toBeInTheDocument()
    expect(within(card).queryByText('Công việc C')).toBeNull()
    expect(deliveryApi.managerEnsureReworkDrafts).toHaveBeenCalledWith(
      'case',
      expect.any(AbortSignal),
    )
    expect(
      screen.queryByRole('button', { name: /Thêm mới nhiệm vụ/ }),
    ).toBeNull()
    expect(manual).not.toHaveBeenCalled()
    expect(originalCreate).not.toHaveBeenCalled()
  },
)

it('finalizes the complete rework plan and automatically opens flight permits', async () => {
  missions.push(reworkMission())
  assignments['rework-1'] = ['A', 'B']
  const finalize = vi
    .spyOn(planningApi, 'finalizeExecutionPlan')
    .mockImplementation(async () => {
      missions[1].status = 'PENDING_CONFIRMATION'
    })
  const confirm = vi.spyOn(missionsApi, 'confirmMissionPlanning')
  render(<ReworkPlanningPage orderId="order" caseId="case" />)
  const card = await screen.findByRole('article', { name: 'MS-REWORK' })
  expect(within(card).getByText('Công việc A')).toBeInTheDocument()
  expect(
    within(card).queryByRole('button', { name: 'Xác nhận' }),
  ).not.toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Giấy phép bay' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Chốt kế hoạch' }))
  const dialog = await screen.findByRole('dialog', { name: 'Chốt kế hoạch?' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Chốt kế hoạch' }))
  await waitFor(() => expect(finalize).toHaveBeenCalledWith('order', 4, 'case'))
  await waitFor(() =>
    expect(screen.getByRole('tab', { name: 'Giấy phép bay' })).toHaveAttribute(
      'aria-selected',
      'true',
    ),
  )
  expect(confirm).not.toHaveBeenCalled()
})

it('reopens finalized rework directly on flight permits', async () => {
  missions.push({ ...reworkMission(), status: 'PENDING_CONFIRMATION' })
  assignments['rework-1'] = ['A', 'B']
  render(<ReworkPlanningPage orderId="order" caseId="case" />)
  await waitFor(() =>
    expect(screen.getByRole('tab', { name: 'Giấy phép bay' })).toHaveAttribute(
      'aria-selected',
      'true',
    ),
  )
  expect(
    screen.queryByRole('button', { name: 'Chốt kế hoạch' }),
  ).not.toBeInTheDocument()
})

it('cannot finalize while checklist items remain unassigned', async () => {
  missions.push(reworkMission())
  assignments['rework-1'] = ['A']
  render(<ReworkPlanningPage orderId="order" caseId="case" />)
  expect(
    await screen.findByRole('button', { name: 'Chốt kế hoạch' }),
  ).toBeDisabled()
  expect(screen.getByRole('tab', { name: 'Giấy phép bay' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
})

it('keeps planning open after finalization fails', async () => {
  missions.push(reworkMission())
  assignments['rework-1'] = ['A', 'B']
  vi.spyOn(planningApi, 'finalizeExecutionPlan').mockRejectedValue(
    new Error('Missing crew'),
  )
  render(<ReworkPlanningPage orderId="order" caseId="case" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Chốt kế hoạch' }))
  const dialog = await screen.findByRole('dialog', { name: 'Chốt kế hoạch?' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Chốt kế hoạch' }))
  await waitFor(() =>
    expect(planningApi.finalizeExecutionPlan).toHaveBeenCalledWith(
      'order',
      4,
      'case',
    ),
  )
  expect(screen.getByRole('tab', { name: 'Giấy phép bay' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
  expect(screen.getByRole('article', { name: 'MS-REWORK' })).toBeInTheDocument()
})

it('keeps a closed revision case read-only', async () => {
  revisionCase.active = false
  revisionCase.status = 'CLOSED'
  missions.push(reworkMission())
  assignments['rework-1'] = ['A']
  render(<ReworkPlanningPage orderId="order" caseId="case" />)
  const card = await screen.findByRole('article', { name: 'MS-REWORK' })
  expect(
    screen.queryByRole('button', { name: /Thêm mới nhiệm vụ/ }),
  ).not.toBeInTheDocument()
  expect(
    within(card).queryByRole('button', { name: 'Xác nhận' }),
  ).not.toBeInTheDocument()
  expect(screen.getByText(/Yêu cầu chỉnh sửa đã kết thúc/)).toBeInTheDocument()
})

it('edits a planning rework schedule in the shared editor while keeping its checklist scope fixed', async () => {
  missions.push(reworkMission())
  assignments['rework-1'] = ['A', 'B']
  const update = vi
    .spyOn(missionsApi, 'updateMission')
    .mockResolvedValue(missions[1])
  render(<ReworkPlanningPage orderId="order" caseId="case" />)
  const card = await screen.findByRole('article', { name: 'MS-REWORK' })
  fireEvent.click(within(card).getByRole('button', { name: 'Chỉnh sửa' }))
  const dialog = await screen.findByRole('dialog', {
    name: 'Chỉnh sửa nhiệm vụ MS-REWORK',
  })
  expect(within(dialog).getAllByRole('checkbox')).toHaveLength(2)
  within(dialog)
    .getAllByRole('checkbox')
    .forEach((checkbox) => expect(checkbox).toBeDisabled())
  expect(
    within(dialog).queryByText('Khoảng thời gian khách yêu cầu'),
  ).not.toBeInTheDocument()
  fireEvent.change(within(dialog).getByLabelText('Giờ cất cánh'), {
    target: { value: '2099-11-12T10:00' },
  })
  fireEvent.change(within(dialog).getByLabelText('Giờ kết thúc dự kiến'), {
    target: { value: '2099-11-12T11:00' },
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith('rework-1', {
      scheduledStartAt: new Date('2099-11-12T10:00').toISOString(),
      scheduledEndAt: new Date('2099-11-12T11:00').toISOString(),
    }),
  )
})

it('does not open a foreign revision case or display the original missions', async () => {
  revisionCase.orderId = 'other-order'
  render(<ReworkPlanningPage orderId="order" caseId="case" />)
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /Không còn hạng mục đủ điều kiện/,
  )
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  expect(screen.queryByText('MS-ORIGINAL')).not.toBeInTheDocument()
})

function internalRequest(): InspectionCorrection {
  return {
    id: 'correction',
    missionId: 'original',
    version: 2,
    status: 'OPEN',
    reviewToken: 'token',
    requestedBy: 'inspector',
    requestedAt: '2026-11-15T00:00:00Z',
    resolvedAt: null,
    supplementalMissionId: null,
    supplementalMissionCode: null,
    supplementalMissionStatus: null,
    items: [
      {
        executionId: 'execution-A',
        orderChecklistItemId: 'A',
        content: 'Công việc A',
        requestedExecutionVersion: 1,
        reason: 'Ảnh mờ',
        mediaIds: [],
      },
    ],
    events: [],
  }
}
it('opens the automatically created internal draft with its fixed failed checklist scope', async () => {
  vi.mocked(ordersApi.getOrder).mockResolvedValue({
    id: 'order',
    status: 'IN_PROGRESS',
    code: 'ORD-1',
    serviceName: 'Monitoring',
    preferredDate: '2099-11-11',
    preferredTimeName: 'Morning',
    center: null,
    checklistItems,
    customer: { fullName: 'Customer' },
  } as OrderDetail)
  const correction = internalRequest()
  vi.spyOn(inspectionCorrectionApi, 'list').mockImplementation(async () =>
    structuredClone([correction]),
  )
  const create = vi
    .mocked(inspectionCorrectionApi.ensureDraft)
    .mockImplementation(async () => {
      const child = {
        ...reworkMission(),
        scheduledStartAt: null,
        scheduledEndAt: null,
        id: 'internal-1',
        missionCode: 'MS-INTERNAL',
        resultRevisionCaseId: null,
        inspectionCorrectionId: 'correction',
        inspectionSourceMissionId: 'original',
      }
      missions.push(child)
      assignments['internal-1'] = ['A']
      correction.supplementalMissionId = 'internal-1'
      correction.supplementalMissionStatus = 'PLANNING'
      return child
    })
  const createRework = vi.spyOn(missionsApi, 'createReworkMission')
  const createOriginal = vi.spyOn(missionsApi, 'createMission')
  render(
    <InternalCorrectionPlanningPage
      orderId="order"
      sourceMissionId="original"
      correctionId="correction"
    />,
  )
  const sidebar = await screen.findByRole('complementary')
  expect(within(sidebar).getByText('Công việc A')).toBeInTheDocument()
  expect(within(sidebar).queryByText('Công việc B')).toBeNull()
  expect(screen.queryByText('MS-ORIGINAL')).toBeNull()
  await screen.findByRole('article', { name: 'MS-INTERNAL' })
  expect(create).toHaveBeenCalledWith(
    'original',
    'correction',
    expect.any(AbortSignal),
  )
  expect(screen.queryByRole('button', { name: /Thêm mới nhiệm vụ/ })).toBeNull()
  expect(createOriginal).not.toHaveBeenCalled()
  expect(createRework).not.toHaveBeenCalled()
  expect(deliveryApi.managerGetRevisionCase).not.toHaveBeenCalled()
  expect(screen.queryByRole('button', { name: /Thêm mới nhiệm vụ/ })).toBeNull()
})
it('finalizes internal scope through its own endpoint then waits for Staff acceptance before permit actions', async () => {
  vi.mocked(ordersApi.getOrder).mockResolvedValue({
    id: 'order',
    status: 'IN_PROGRESS',
    code: 'ORD-1',
    serviceName: 'Monitoring',
    preferredDate: '2099-11-11',
    preferredTimeName: 'Morning',
    center: null,
    checklistItems,
    customer: { fullName: 'Customer' },
  } as OrderDetail)
  const correction = {
    ...internalRequest(),
    supplementalMissionId: 'internal-1',
    supplementalMissionStatus: 'PLANNING',
  }
  missions.push({
    ...reworkMission(),
    id: 'internal-1',
    missionCode: 'MS-INTERNAL',
    resultRevisionCaseId: null,
    inspectionCorrectionId: 'correction',
    inspectionSourceMissionId: 'original',
  })
  assignments['internal-1'] = ['A']
  vi.spyOn(inspectionCorrectionApi, 'list').mockImplementation(async () =>
    structuredClone([correction]),
  )
  const finalize = vi
    .spyOn(inspectionCorrectionApi, 'finalize')
    .mockImplementation(async () => {
      missions[1].status = 'PENDING_CONFIRMATION'
      correction.supplementalMissionStatus = 'PENDING_CONFIRMATION'
      return missions[1]
    })
  const finalizeOriginal = vi.spyOn(planningApi, 'finalizeExecutionPlan')
  render(
    <InternalCorrectionPlanningPage
      orderId="order"
      sourceMissionId="original"
      correctionId="correction"
    />,
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Chốt kế hoạch' }))
  const dialog = await screen.findByRole('dialog', { name: 'Chốt kế hoạch?' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Chốt kế hoạch' }))
  await waitFor(() =>
    expect(finalize).toHaveBeenCalledWith(
      'original',
      expect.objectContaining({ id: 'correction' }),
      4,
    ),
  )
  await waitFor(() =>
    expect(
      screen.getByRole('tab', { name: 'Giấy phép bay' }),
    ).not.toHaveAttribute('aria-disabled', 'true'),
  )
  fireEvent.click(screen.getByRole('tab', { name: 'Giấy phép bay' }))
  expect(
    await screen.findByText(
      'Chưa có nhân sự được phân công. Hãy phân công nhân sự trước khi xác nhận giấy phép bay.',
    ),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Xác nhận đã được cấp phép' }),
  ).toBeNull()
  expect(finalizeOriginal).not.toHaveBeenCalled()
})

it('shows derived Missions with shared cards while keeping edits inside their scoped planning workflow', async () => {
  vi.mocked(ordersApi.getOrder).mockResolvedValue({
    id: 'order',
    status: 'IN_PROGRESS',
    checklistItems,
    customer: { fullName: 'Customer' },
  } as OrderDetail)
  missions.push(reworkMission(), {
    ...reworkMission(),
    id: 'internal',
    missionCode: 'MS-INTERNAL',
    resultRevisionCaseId: null,
    inspectionCorrectionId: 'correction',
    inspectionSourceMissionId: 'original',
  })
  render(<OrderMissionPlanningSection orderId="order" />)
  expect(
    await screen.findByRole('article', { name: 'MS-ORIGINAL' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('article', { name: 'MS-REWORK' })).toBeInTheDocument()
  expect(
    screen.getByRole('article', { name: 'MS-INTERNAL' }),
  ).toBeInTheDocument()
  for (const code of ['MS-REWORK', 'MS-INTERNAL']) {
    const card = within(screen.getByRole('article', { name: code }))
    expect(card.queryByRole('button', { name: 'Chỉnh sửa' })).toBeNull()
    expect(card.getByText('Giấy phép bay')).toBeInTheDocument()
    expect(
      card.getByRole('link', { name: 'Xem chi tiết nhiệm vụ' }),
    ).toBeInTheDocument()
  }
  const links = screen
    .getAllByRole('link', { name: 'Mở lập kế hoạch' })
    .map((a) => a.getAttribute('href'))
  expect(links).toEqual(
    expect.arrayContaining([
      '#portal/manager/orders/order/rework/case',
      '#portal/manager/orders/order/inspection/original/correction',
    ]),
  )
})
it('allows a replacement plan after an internal supplemental Mission failed', async () => {
  vi.mocked(ordersApi.getOrder).mockResolvedValue({
    id: 'order',
    status: 'IN_PROGRESS',
    checklistItems,
    customer: { fullName: 'Customer' },
  } as OrderDetail)
  missions.push({
    ...reworkMission(),
    id: 'failed-internal',
    status: 'FAILED',
    resultRevisionCaseId: null,
    inspectionCorrectionId: 'correction',
    inspectionSourceMissionId: 'original',
  })
  assignments['failed-internal'] = ['A']
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([
    {
      ...internalRequest(),
      supplementalMissionId: 'failed-internal',
      supplementalMissionStatus: 'FAILED',
    },
  ])
  render(
    <InternalCorrectionPlanningPage
      orderId="order"
      sourceMissionId="original"
      correctionId="correction"
    />,
  )
  const recreate = await screen.findByRole('button', {
    name: 'Tạo lại bản nháp',
  })
  expect(recreate).toBeEnabled()
  expect(inspectionCorrectionApi.ensureDraft).toHaveBeenCalledWith(
    'original',
    'correction',
    expect.any(AbortSignal),
  )
  fireEvent.click(recreate)
  await waitFor(() =>
    expect(inspectionCorrectionApi.ensureDraft).toHaveBeenCalledWith(
      'original',
      'correction',
      undefined,
      true,
    ),
  )
  expect(
    missions.some(
      (mission) =>
        mission.id === 'failed-internal' && mission.status === 'FAILED',
    ),
  ).toBe(true)
})
it('explains why a resolved internal correction is read-only', async () => {
  vi.mocked(ordersApi.getOrder).mockResolvedValue({
    id: 'order',
    status: 'IN_PROGRESS',
    checklistItems,
    customer: { fullName: 'Customer' },
  } as OrderDetail)
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([
    { ...internalRequest(), status: 'RESOLVED' },
  ])
  render(
    <InternalCorrectionPlanningPage
      orderId="order"
      sourceMissionId="original"
      correctionId="correction"
    />,
  )
  expect(
    await screen.findByText(
      'Yêu cầu bổ sung hoặc đơn hàng không còn cho phép lập kế hoạch. Nội dung được hiển thị để tra cứu.',
    ),
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Thêm mới nhiệm vụ/ })).toBeNull()
})

it('uses each derived Mission assignment scope without changing original coverage', async () => {
  vi.mocked(ordersApi.getOrder).mockResolvedValue({
    id: 'order',
    status: 'IN_PROGRESS',
    checklistItems,
    customer: { fullName: 'Customer' },
  } as OrderDetail)
  missions.push(reworkMission())
  assignments['rework-1'] = ['B']
  render(<OrderMissionPlanningSection orderId="order" />)
  const card = within(await screen.findByRole('article', { name: 'MS-REWORK' }))
  expect(card.getByText('Công việc (1)')).toBeInTheDocument()
  expect(card.getByText('Công việc B')).toBeInTheDocument()
  expect(card.queryByText('Công việc A')).toBeNull()
  const main = within(screen.getByRole('article', { name: 'MS-ORIGINAL' }))
  expect(main.getByText('Công việc (3)')).toBeInTheDocument()
  expect(planningApi.getAssignments).toHaveBeenCalledWith(
    'rework-1',
    expect.any(AbortSignal),
  )
})
