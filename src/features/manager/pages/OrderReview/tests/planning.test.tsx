import { contractApi } from '../../../../contract/contractApi'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../../../shared/api/httpClient'
import { ordersApi } from '../../../api/ordersApi'
import { planningApi } from '../../../api/planningApi'
import type { MissionResponse } from '../../../types/missions'
import type { OrderDetail } from '../../../types/orders'
import type { ExecutionPlan } from '../../../types/planning'
import { OrderMissionPlanningSection } from '../components/OrderMissionPlanningSection'
import { managerHref, parseManagerRoute } from '../../../routes'
import { financeApi } from '../../../../finance/api'
import type { Invoice } from '../../../../finance/types'

const items = ['A', 'B', 'C', 'D', 'E'].map((id, displayOrder) => ({
  id,
  displayOrder,
  content: `Requirement ${id}`,
  sourceType: 'CUSTOMER_CUSTOM' as const,
  sourceChecklistId: null,
}))
const plan: ExecutionPlan = {
  orderId: 'o',
  planStatus: 'DRAFT',
  revision: 7,
  missions: ['m1', 'm2', 'm3'].map((missionId) => ({
    missionId,
    scopeLabel: missionId,
    assignmentCount: 0,
    finalizedPlanRevision: null,
  })),
  coverage: {
    total: 5,
    covered: 5,
    uncovered: 0,
    repeated: 1,
    coverageReady: true,
    uncoveredItemIds: [],
  },
  blockers: [],
}
beforeEach(() => {
  vi.spyOn(financeApi, 'getManagerInvoice').mockResolvedValue({
    id: 'invoice-paid',
    paidAmount: 500,
    depositAmount: 500,
    remainingAmount: 0,
    finalPaymentAllowed: false,
  } as Invoice)
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.spyOn(ordersApi, 'getOrder').mockResolvedValue({
    id: 'o',
    status: 'APPROVED',
    checklistItems: items,
  } as OrderDetail)
  vi.spyOn(planningApi, 'getExecutionPlan').mockResolvedValue(plan)
  vi.spyOn(planningApi, 'getOrderMissions').mockResolvedValue(
    ['m1', 'm2', 'm3'].map(
      (id) =>
        ({
          id,
          orderId: 'o',
          missionCode: id.toUpperCase(),
          status: 'PLANNING',
          staffAssignments: [],
        }) as unknown as MissionResponse,
    ),
  )
  vi.spyOn(planningApi, 'getAssignments').mockImplementation(async (id) => ({
    missionId: id,
    revision: 7,
    assignments: [],
  }))
})
afterEach(() => vi.restoreAllMocks())
describe('Manager multi-Mission planning', () => {
  it('locks planning while the customer deposit is still unpaid', async () => {
    vi.mocked(financeApi.getManagerInvoice).mockResolvedValue({
      id: 'invoice-unpaid',
      paidAmount: 0,
      depositAmount: 500,
      remainingAmount: 500,
      finalPaymentAllowed: false,
    } as Invoice)

    render(<OrderMissionPlanningSection orderId="o" />)

    expect(
      await screen.findByText('Đang chờ khách hàng thanh toán đặt cọc'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Đã thanh toán\s+0\s*\/\s*500/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Tạo thêm nhiệm vụ' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Chốt kế hoạch' }),
    ).not.toBeInTheDocument()
  })

  it('keeps contract verification reachable after the deposit is paid', async () => {
    vi.mocked(financeApi.getManagerInvoice).mockResolvedValue({
      id: 'invoice',
      status: 'PARTIALLY_PAID',
      paidAmount: 500,
      depositAmount: 500,
      remainingAmount: 500,
      contractRequired: true,
      contractSubmittedAt: '2026-11-14T04:00:00Z',
      contractConfirmedAt: null,
    } as Invoice)
    vi.spyOn(contractApi, 'get').mockResolvedValue({
      required: true,
      id: 'contract',
      version: 1,
      invoiceId: 'invoice',
      status: 'PENDING_VERIFICATION',
      document: null,
      submissions: [
        {
          id: 'signed',
          status: 'PENDING',
          submissionNumber: 1,
          submittedAt: '2026-11-14T04:00:00Z',
          document: {
            fileName: 'signed.pdf',
            byteSize: 100,
            sha256: 'a'.repeat(64),
          },
        },
      ],
    } as never)
    vi.spyOn(contractApi, 'cancellation').mockResolvedValue(null)
    render(<OrderMissionPlanningSection orderId="o" />)
    expect(
      await screen.findByRole('button', { name: 'Xác nhận hợp đồng' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Tạo thêm nhiệm vụ' }),
    ).toBeNull()
    expect(screen.getByText('Chờ xác nhận hợp đồng')).toBeInTheDocument()
  })

  it('shows the per-Mission payment milestones after the plan is finalized', async () => {
    vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
      ...plan,
      planStatus: 'FINALIZED',
    })
    vi.mocked(planningApi.getOrderMissions).mockResolvedValue(
      ['m1', 'm2'].map(
        (id) =>
          ({
            id,
            orderId: 'o',
            missionCode: id.toUpperCase(),
            status: 'PENDING_CONFIRMATION',
            staffAssignments: [],
          }) as unknown as MissionResponse,
      ),
    )
    vi.mocked(financeApi.getManagerInvoice).mockResolvedValue({
      id: 'invoice-awaiting-final-payment',
      totalAmount: 1000,
      paidAmount: 500,
      depositAmount: 500,
      remainingAmount: 500,
      finalPaymentAllowed: true,
    } as Invoice)
    // The old "awaiting final payment" banner was replaced by the auto-calculated
    // per-Mission payment panel.
    vi.spyOn(
      financeApi,
      'calculateManagerMissionPaymentAllocations',
    ).mockResolvedValue({
      invoiceId: 'invoice-awaiting-final-payment',
      allocationTargetAmount: 500,
      allocatedAmount: 500,
      allocationComplete: true,
      milestones: [
        {
          id: 'ms-1',
          missionId: 'm1',
          missionCode: 'M1',
          scopeLabel: null,
          amount: 500,
          currency: 'VND',
          status: 'NOT_YET_DUE',
          handedOverAt: null,
          paymentExpiresAt: null,
          payments: [],
        },
      ],
    })

    render(<OrderMissionPlanningSection orderId="o" />)

    expect(
      await screen.findByRole('heading', {
        name: 'Khoản thanh toán theo nhiệm vụ',
      }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Chưa bàn giao')).toBeInTheDocument()
  })

  it('keeps a completed Order Mission card historical with no operational actions', async () => {
    vi.mocked(ordersApi.getOrder).mockResolvedValue({
      id: 'o',
      status: 'COMPLETED',
      checklistItems: items,
    } as OrderDetail)
    vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
      ...plan,
      planStatus: 'FINALIZED',
      missions: [
        {
          missionId: 'm1',
          scopeLabel: 'Khu A',
          assignmentCount: 1,
          checklistItemIds: ['A'],
          finalizedPlanRevision: 7,
        },
      ],
    })
    vi.mocked(planningApi.getOrderMissions).mockResolvedValue([
      {
        id: 'm1',
        orderId: 'o',
        missionCode: 'M1',
        status: 'COMPLETED',
        staffAssignments: [],
      },
    ] as unknown as MissionResponse[])
    render(<OrderMissionPlanningSection orderId="o" />)
    const card = await screen.findByRole('article', { name: 'M1' })
    expect(within(card).getByRole('link', { name: 'M1' })).toHaveAttribute(
      'href',
      '#portal/manager/missions/m1/detail',
    )
    expect(within(card).getByText('Requirement A')).toBeInTheDocument()
    // A completed Order is read-only: no editing, removal, confirmation,
    // cancellation or resource-adding controls on the card, and no plan actions.
    expect(within(card).queryByRole('button')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Chốt kế hoạch' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Thêm mới nhiệm vụ' }),
    ).not.toBeInTheDocument()
    expect(
      within(card).queryByRole('link', {
        name: /Phân công trong Văn phòng 3D/,
      }),
    ).not.toBeInTheDocument()
    expect(
      within(card).getByRole('link', { name: /Xem trong Văn phòng 3D/ }),
    ).toBeInTheDocument()
  })
  it('shows a cancelled Mission card with its reason and without operational actions', async () => {
    vi.mocked(planningApi.getOrderMissions).mockResolvedValue([
      {
        id: 'm1',
        orderId: 'o',
        missionCode: 'M1',
        status: 'CANCELLED',
        failureReason: 'Thời tiết xấu',
      },
      { id: 'm2', orderId: 'o', missionCode: 'M2', status: 'PLANNING' },
    ] as MissionResponse[])
    render(<OrderMissionPlanningSection orderId="o" />)
    const cancelled = await screen.findByRole('article', { name: 'M1' })
    expect(within(cancelled).getByText(/Thời tiết xấu/)).toBeInTheDocument()
    expect(
      within(cancelled).queryByRole('button', { name: /^Hủy nhiệm vụ/ }),
    ).not.toBeInTheDocument()
    expect(
      within(cancelled).queryByRole('button', { name: 'Chỉnh sửa' }),
    ).not.toBeInTheDocument()
    // The sibling still-planning Mission keeps its edit action.
    expect(
      within(screen.getByRole('article', { name: 'M2' })).getByRole('button', {
        name: 'Chỉnh sửa',
      }),
    ).toBeInTheDocument()
  })
  it('shows every Mission with exact detail links and the plan actions', async () => {
    render(<OrderMissionPlanningSection orderId="o" />)
    expect(await screen.findByRole('link', { name: 'M3' })).toHaveAttribute(
      'href',
      '#portal/manager/missions/m3/detail',
    )
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(
      screen.getByRole('button', { name: 'Thêm mới nhiệm vụ' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chốt kế hoạch' })).toBeEnabled()
  })
  it('keeps the plan unfinalizable while checklist items are uncovered', async () => {
    vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
      ...plan,
      missions: plan.missions.map((m) =>
        m.missionId === 'm1'
          ? { ...m, checklistItemIds: ['A', 'B', 'C', 'D'] }
          : m,
      ),
      coverage: {
        ...plan.coverage,
        covered: 4,
        uncovered: 1,
        coverageReady: false,
        uncoveredItemIds: ['E'],
      },
    })
    const finalize = vi.spyOn(planningApi, 'finalizeExecutionPlan')
    render(<OrderMissionPlanningSection orderId="o" />)
    expect(
      await screen.findByText('Còn 1 công việc chưa được phân công'),
    ).toBeInTheDocument()
    const finalizeButton = screen.getByRole('button', { name: 'Chốt kế hoạch' })
    expect(finalizeButton).toBeDisabled()
    expect(finalizeButton).toHaveAttribute(
      'title',
      'Cần phân công toàn bộ công việc mới có thể chốt kế hoạch',
    )
    fireEvent.click(finalizeButton)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(finalize).not.toHaveBeenCalled()
    // The uncovered item is listed once, in the master checklist sidebar.
    expect(screen.getByText('Chưa phân công (1)')).toBeInTheDocument()
    expect(screen.getAllByText('Requirement E')).toHaveLength(1)
  })
  it('keeps a Mission checklist when removal fails, shows the error and does not retry', async () => {
    vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
      ...plan,
      missions: plan.missions.map((m) =>
        m.missionId === 'm1' ? { ...m, checklistItemIds: ['A', 'B'] } : m,
      ),
    })
    const update = vi
      .spyOn(planningApi, 'updateMissionChecklistAssignments')
      .mockRejectedValue(
        new ApiError('Kế hoạch đã được thay đổi', {
          code: 'EXECUTION_PLAN_REVISION_CONFLICT',
          status: 409,
          method: 'PUT',
          path: '/test',
        }),
      )
    render(<OrderMissionPlanningSection orderId="o" />)
    const card = await screen.findByRole('article', { name: 'M1' })
    fireEvent.click(
      within(card).getAllByRole('button', { name: /^Gỡ khỏi nhiệm vụ/ })[0],
    )
    expect(await within(card).findByRole('alert')).toHaveTextContent(
      'Kế hoạch đã được thay đổi',
    )
    expect(within(card).getByText('Requirement A')).toBeInTheDocument()
    expect(within(card).getByText('Requirement B')).toBeInTheDocument()
    expect(update).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledWith('m1', 7, ['B'])
  })
  it('refuses to remove the last checklist item of a Mission', async () => {
    vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
      ...plan,
      missions: plan.missions.map((m) =>
        m.missionId === 'm1' ? { ...m, checklistItemIds: ['A'] } : m,
      ),
    })
    const update = vi.spyOn(planningApi, 'updateMissionChecklistAssignments')
    render(<OrderMissionPlanningSection orderId="o" />)
    const card = await screen.findByRole('article', { name: 'M1' })
    fireEvent.click(
      within(card).getByRole('button', { name: /^Gỡ khỏi nhiệm vụ/ }),
    )
    expect(await within(card).findByRole('alert')).toBeInTheDocument()
    expect(update).not.toHaveBeenCalled()
  })
  it('finalizing through the confirmation dialog locks the plan for editing', async () => {
    const finalized = {
      ...plan,
      planStatus: 'FINALIZED' as const,
      missions: plan.missions.map((m) => ({ ...m, finalizedPlanRevision: 7 })),
    }
    vi.spyOn(planningApi, 'finalizeExecutionPlan').mockImplementation(
      async () => {
        vi.mocked(planningApi.getExecutionPlan).mockResolvedValue(finalized)
        return finalized
      },
    )
    render(<OrderMissionPlanningSection orderId="o" />)
    await screen.findByRole('article', { name: 'M1' })
    fireEvent.click(screen.getByRole('button', { name: 'Chốt kế hoạch' }))
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Chốt kế hoạch',
      }),
    )
    await waitFor(() =>
      expect(planningApi.finalizeExecutionPlan).toHaveBeenCalledWith(
        'o',
        7,
        undefined,
      ),
    )
    // The finalize action disappears once the refreshed plan is FINALIZED.
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Chốt kế hoạch' }),
      ).not.toBeInTheDocument(),
    )
    // Adding a Mission stays available, and each planning Mission can now be confirmed.
    expect(
      screen.getByRole('button', { name: 'Thêm mới nhiệm vụ' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Xác nhận' })).toHaveLength(3)
  })
  it('replacement route retains Order and cancelled original identity', () => {
    const route = {
      screen: 'missionCreate' as const,
      orderId: 'o',
      replacesMissionId: 'm1',
    }
    expect(parseManagerRoute(managerHref(route))).toEqual(route)
  })
  it('does not request a Mission replacement flow from the planning cards', async () => {
    // Replacement chains and "replace cancelled Mission" actions no longer have
    // UI in the Order planning workspace; cancelled Missions are just shown as
    // cancelled (see the cancelled-card test above).
    vi.mocked(planningApi.getOrderMissions).mockResolvedValue([
      { id: 'm1', orderId: 'o', missionCode: 'M1', status: 'CANCELLED' },
      { id: 'm2', orderId: 'o', missionCode: 'M2', status: 'PENDING_REVIEW' },
    ] as MissionResponse[])
    render(<OrderMissionPlanningSection orderId="o" />)
    await screen.findByRole('article', { name: 'M1' })
    expect(
      screen.queryByRole('button', { name: /Tạo Nhiệm vụ thay thế/ }),
    ).not.toBeInTheDocument()
  })
})
