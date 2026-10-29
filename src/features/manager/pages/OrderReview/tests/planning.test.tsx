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
import type { ExecutionPlan, SafeStop } from '../../../types/planning'
import { OrderMissionPlanningSection } from '../components/OrderMissionPlanningSection'
import { SafeStopPanel } from '../../../components/common/SafeStopPanel'
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
const stop: SafeStop = {
  missionId: 'm1',
  status: null,
  requestedAt: null,
  confirmedAt: null,
  cleanedAt: null,
  failureReason: null,
  requiresLanding: false,
  canRequestSafeStop: true,
  canConfirmSafeStop: false,
  canCleanupSafeStop: false,
  canCancelMission: true,
}
beforeEach(() => {
  vi.spyOn(financeApi, 'getManagerInvoice').mockResolvedValue({
    id: 'invoice-paid',
    paidAmount: 500,
    depositAmount: 500,
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
  vi.spyOn(planningApi, 'getSafeStop').mockResolvedValue(stop)
})
afterEach(() => vi.restoreAllMocks())
describe('Manager multi-Mission planning', () => {
  it('locks planning while the customer deposit is still unpaid', async () => {
    vi.mocked(financeApi.getManagerInvoice).mockResolvedValue({
      id: 'invoice-unpaid',
      paidAmount: 0,
      depositAmount: 500,
    } as Invoice)

    render(<OrderMissionPlanningSection orderId="o" />)

    expect(
      await screen.findByText('Đang chờ khách hàng thanh toán đặt cọc'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Đã thanh toán\s+0\s*\/\s*500/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Thêm mới nhiệm vụ' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Chốt kế hoạch' }),
    ).not.toBeInTheDocument()
  })

  it('shows every Mission card with exact links and authoritative repeated coverage', async () => {
    render(<OrderMissionPlanningSection orderId="o" />)
    for (const id of ['m1', 'm2', 'm3']) {
      expect(
        await screen.findByRole('link', { name: id.toUpperCase() }),
      ).toHaveAttribute('href', `#portal/manager/missions/${id}/detail`)
    }
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(
      screen.getByRole('button', { name: 'Thêm mới nhiệm vụ' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Phân công lặp').parentElement).toHaveTextContent(
      '1',
    )
    expect(screen.getByRole('button', { name: 'Chốt kế hoạch' })).toBeEnabled()
  })
  it('keeps finalize disabled and never finalizes while checklist items are uncovered', async () => {
    vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
      ...plan,
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
    const button = screen.getByRole('button', { name: 'Chốt kế hoạch' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(finalize).not.toHaveBeenCalled()
  })
  it('finalizes the plan at its current revision only after confirmation', async () => {
    const finalized = {
      ...plan,
      planStatus: 'FINALIZED' as const,
      missions: plan.missions.map((m) => ({ ...m, finalizedPlanRevision: 7 })),
    }
    const finalize = vi
      .spyOn(planningApi, 'finalizeExecutionPlan')
      .mockImplementation(async () => {
        vi.mocked(planningApi.getExecutionPlan).mockResolvedValue(finalized)
        return finalized
      })
    render(<OrderMissionPlanningSection orderId="o" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Chốt kế hoạch' }),
    )
    const dialog = await screen.findByRole('dialog')
    expect(finalize).not.toHaveBeenCalled()
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Chốt kế hoạch' }),
    )
    await waitFor(() => expect(finalize).toHaveBeenCalledWith('o', 7))
    // The refreshed plan is locked: no more create / finalize actions.
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Thêm mới nhiệm vụ' }),
      ).not.toBeInTheDocument(),
    )
    expect(
      screen.queryByRole('button', { name: 'Chốt kế hoạch' }),
    ).not.toBeInTheDocument()
  })
  describe('work items on a Mission card', () => {
    beforeEach(() => {
      vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
        ...plan,
        missions: plan.missions.map((m) =>
          m.missionId === 'm1' ? { ...m, checklistItemIds: ['A', 'B'] } : m,
        ),
      })
    })
    const removeLabel = 'Gỡ khỏi nhiệm vụ (chuyển về Chưa phân công)'
    it('shows assigned work items and removes one with the current revision', async () => {
      const update = vi
        .spyOn(planningApi, 'updateMissionChecklistAssignments')
        .mockResolvedValue({ missionId: 'm1', revision: 8, assignments: [] })
      render(<OrderMissionPlanningSection orderId="o" />)
      const card = await screen.findByRole('article', { name: 'M1' })
      expect(within(card).getByText('Requirement A')).toBeInTheDocument()
      expect(within(card).getByText('Requirement B')).toBeInTheDocument()
      fireEvent.click(within(card).getAllByRole('button', { name: removeLabel })[0])
      await waitFor(() => expect(update).toHaveBeenCalledWith('m1', 7, ['B']))
    })
    it('refuses to remove the last work item of a Mission', async () => {
      vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
        ...plan,
        missions: plan.missions.map((m) =>
          m.missionId === 'm1' ? { ...m, checklistItemIds: ['A'] } : m,
        ),
      })
      const update = vi.spyOn(planningApi, 'updateMissionChecklistAssignments')
      render(<OrderMissionPlanningSection orderId="o" />)
      const card = await screen.findByRole('article', { name: 'M1' })
      fireEvent.click(within(card).getByRole('button', { name: removeLabel }))
      expect(await within(card).findByRole('alert')).toHaveTextContent(
        'Mỗi nhiệm vụ phải có ít nhất một công việc',
      )
      expect(update).not.toHaveBeenCalled()
    })
    it('surfaces a stale-revision conflict on the card and does not retry', async () => {
      const update = vi
        .spyOn(planningApi, 'updateMissionChecklistAssignments')
        .mockRejectedValue(
          new ApiError('Stale plan', {
            code: 'EXECUTION_PLAN_REVISION_CONFLICT',
            status: 409,
            method: 'PUT',
            path: '/test',
          }),
        )
      render(<OrderMissionPlanningSection orderId="o" />)
      const card = await screen.findByRole('article', { name: 'M1' })
      fireEvent.click(within(card).getAllByRole('button', { name: removeLabel })[0])
      expect(await within(card).findByRole('alert')).toHaveTextContent(
        'Stale plan',
      )
      expect(within(card).getByText('Requirement A')).toBeInTheDocument()
      expect(update).toHaveBeenCalledTimes(1)
    })
  })
  describe('cancelling a READY Mission', () => {
    beforeEach(() => {
      vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
        ...plan,
        planStatus: 'FINALIZED',
      })
      vi.mocked(planningApi.getOrderMissions).mockResolvedValue([
        {
          id: 'm1',
          orderId: 'o',
          missionCode: 'M1',
          status: 'READY',
          staffAssignments: [],
        },
      ] as unknown as MissionResponse[])
    })
    it('requires a reason and cancels at the current plan revision', async () => {
      const cancel = vi
        .spyOn(planningApi, 'cancelMission')
        .mockResolvedValue(undefined as never)
      render(<OrderMissionPlanningSection orderId="o" />)
      fireEvent.click(
        await screen.findByRole('button', { name: 'Hủy nhiệm vụ M1' }),
      )
      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByRole('button', { name: 'Xác nhận' })).toBeDisabled()
      expect(cancel).not.toHaveBeenCalled()
      fireEvent.change(within(dialog).getByRole('textbox'), {
        target: { value: 'Weather' },
      })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận' }))
      await waitFor(() =>
        expect(cancel).toHaveBeenCalledWith('m1', {
          expectedPlanRevision: 7,
          reason: 'Weather',
        }),
      )
    })
    it('keeps the Mission visible with the server error when cancellation is refused', async () => {
      const cancel = vi.spyOn(planningApi, 'cancelMission').mockRejectedValue(
        new ApiError('Mission chưa đủ điều kiện hủy', {
          code: 'MISSION_CANCELLATION_REQUIRES_SAFE_STOP',
          status: 409,
          method: 'POST',
          path: '/cancel',
        }),
      )
      const safetyCommands = [
        vi.spyOn(planningApi, 'requestSafeStop'),
        vi.spyOn(planningApi, 'confirmSafeStop'),
        vi.spyOn(planningApi, 'cleanupSafeStop'),
      ]
      render(<OrderMissionPlanningSection orderId="o" />)
      fireEvent.click(
        await screen.findByRole('button', { name: 'Hủy nhiệm vụ M1' }),
      )
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(within(dialog).getByRole('textbox'), {
        target: { value: 'Weather' },
      })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận' }))
      const card = await screen.findByRole('article', { name: 'M1' })
      expect(await within(card).findByRole('alert')).toHaveTextContent(
        /Mission chưa đủ điều kiện hủy/,
      )
      expect(screen.getByRole('link', { name: 'M1' })).toBeInTheDocument()
      expect(cancel).toHaveBeenCalledTimes(1)
      for (const command of safetyCommands)
        expect(command).not.toHaveBeenCalled()
    })
    it('offers no cancel action for PLANNING, COMPLETED or CANCELLED Missions', async () => {
      vi.mocked(planningApi.getOrderMissions).mockResolvedValue([
        { id: 'm1', orderId: 'o', missionCode: 'M1', status: 'PLANNING' },
        { id: 'm2', orderId: 'o', missionCode: 'M2', status: 'COMPLETED' },
        {
          id: 'm3',
          orderId: 'o',
          missionCode: 'M3',
          status: 'CANCELLED',
          failureReason: 'Weather',
        },
      ] as unknown as MissionResponse[])
      render(<OrderMissionPlanningSection orderId="o" />)
      await screen.findByRole('link', { name: 'M3' })
      expect(screen.getByText(/Weather/)).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /^Hủy nhiệm vụ/ }),
      ).not.toBeInTheDocument()
    })
  })
  it('replacement route retains Order and cancelled original identity', () => {
    const route = {
      screen: 'missionCreate' as const,
      orderId: 'o',
      replacesMissionId: 'm1',
    }
    expect(parseManagerRoute(managerHref(route))).toEqual(route)
  })
})
describe('safe-stop role boundaries', () => {
  it('Manager can request but never confirm crew landing even if capability is true', async () => {
    vi.mocked(planningApi.getSafeStop).mockResolvedValue({
      ...stop,
      canConfirmSafeStop: true,
      canCancelMission: false,
    })
    render(
      <SafeStopPanel
        missionId="m1"
        revision={7}
        manager
        onChanged={() => {}}
      />,
    )
    expect(
      await screen.findByRole('button', { name: 'Yêu cầu dừng an toàn' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Xác nhận đã an toàn' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Giải phóng tài nguyên' }),
    ).not.toBeInTheDocument()
  })
  it('only exposes cleanup from explicit server capability and waits for server state', async () => {
    vi.mocked(planningApi.getSafeStop).mockResolvedValue({
      ...stop,
      status: 'IN_PROGRESS',
      canCleanupSafeStop: true,
      canCancelMission: false,
    })
    const cleanup = vi
      .spyOn(planningApi, 'cleanupSafeStop')
      .mockImplementation(async () => {
        vi.mocked(planningApi.getSafeStop).mockResolvedValue({
          ...stop,
          status: 'READY_FOR_CANCELLATION',
          cleanedAt: '2026-10-07T00:00:00Z',
        })
        return { ...stop, status: 'READY_FOR_CANCELLATION' }
      })
    render(<SafeStopPanel missionId="m1" manager onChanged={() => {}} />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Giải phóng tài nguyên' }),
    )
    expect(await screen.findByText('Sẵn sàng hủy')).toBeInTheDocument()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })
  it('crew action fails closed without capability', async () => {
    vi.mocked(planningApi.getSafeStop).mockResolvedValue({
      ...stop,
      status: 'REQUESTED',
      canRequestSafeStop: undefined,
      canConfirmSafeStop: undefined,
      canCleanupSafeStop: undefined,
      canCancelMission: undefined,
    })
    render(<SafeStopPanel missionId="m1" onChanged={() => {}} />)
    await screen.findByText('Đã yêu cầu dừng')
    expect(
      screen.queryByRole('button', { name: 'Xác nhận đã an toàn' }),
    ).not.toBeInTheDocument()
  })
  it('assigned crew with server capability must explicitly attest before confirmation', async () => {
    vi.mocked(planningApi.getSafeStop).mockResolvedValue({
      ...stop,
      status: 'REQUESTED',
      canConfirmSafeStop: true,
    })
    const confirm = vi
      .spyOn(planningApi, 'confirmSafeStop')
      .mockResolvedValue({ ...stop, status: 'IN_PROGRESS' })
    render(<SafeStopPanel missionId="m1" onChanged={() => {}} />)
    const button = await screen.findByRole('button', {
      name: 'Xác nhận đã an toàn',
    })
    expect(button).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Ghi nhận an toàn'), {
      target: { value: 'Landed and disarmed' },
    })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(button)
    await waitFor(() =>
      expect(confirm).toHaveBeenCalledWith('m1', 'Landed and disarmed'),
    )
  })
})
