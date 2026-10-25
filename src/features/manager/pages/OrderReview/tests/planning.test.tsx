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
import { missionStatusLabel } from '../../../../../shared/lib/statusTone'
import type { MissionStatus } from '../../../../../shared/types/domain'
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
      screen.queryByRole('button', { name: 'Tạo thêm Mission' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Chốt kế hoạch' }),
    ).not.toBeInTheDocument()
  })

  it.each(['RESOURCE_ASSIGNING', 'IN_FLIGHT', 'COMPLETED'])(
    'hides all safe-stop presentation for a %s Mission even with action capabilities',
    async (status) => {
      vi.mocked(planningApi.getOrderMissions).mockResolvedValue([
        {
          id: 'm1',
          orderId: 'o',
          missionCode: 'M1',
          status,
          deviceName: 'Drone 1',
          staffAssignments: [],
        },
      ] as unknown as MissionResponse[])
      vi.mocked(planningApi.getSafeStop).mockResolvedValue({
        ...stop,
        status: 'REQUESTED',
        failureReason: 'Technical cleanup error',
        canRequestSafeStop: true,
        canConfirmSafeStop: true,
        canCleanupSafeStop: true,
        canCancelMission: false,
      })
      const request = vi.spyOn(planningApi, 'requestSafeStop')
      const confirm = vi.spyOn(planningApi, 'confirmSafeStop')
      const cleanup = vi.spyOn(planningApi, 'cleanupSafeStop')
      const view = render(<OrderMissionPlanningSection orderId="o" />)
      await screen.findByRole('link', { name: 'M1' })
      await waitFor(() =>
        expect(planningApi.getSafeStop).toHaveBeenCalledTimes(1),
      )
      expect(
        screen.getAllByText(missionStatusLabel[status as MissionStatus]).length,
      ).toBeGreaterThan(0)
      expect(screen.getByText(/Drone 1/)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Tạo thêm Mission' }),
      ).toBeInTheDocument()
      expect(view.container.querySelector('.odm-planning-stop')).toBeNull()
      expect(
        screen.queryByRole('region', { name: /Safe-stop/ }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText(
          /Safe-stop \/ cleanup|Chưa yêu cầu|Technical cleanup error|Backend không tự điều khiển/,
        ),
      ).not.toBeInTheDocument()
      for (const name of [
        'Làm mới safe-stop',
        'Yêu cầu dừng an toàn',
        'Xác nhận đã an toàn',
        'Giải phóng tài nguyên',
      ]) {
        expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
      }
      expect(request).not.toHaveBeenCalled()
      expect(confirm).not.toHaveBeenCalled()
      expect(cleanup).not.toHaveBeenCalled()
    },
  )
  it('hides safe-stop loading/error UI and keeps cancellation fail-closed', async () => {
    vi.mocked(planningApi.getSafeStop).mockRejectedValue(
      new Error('Safe-stop unavailable'),
    )
    render(<OrderMissionPlanningSection orderId="o" />)
    await screen.findByRole('link', { name: 'M1' })
    await waitFor(() =>
      expect(planningApi.getSafeStop).toHaveBeenCalledTimes(3),
    )
    expect(
      screen.queryByText(/Đang tải safe-stop|Safe-stop unavailable/),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Hủy Mission M1' }),
    ).not.toBeInTheDocument()
  })
  it('keeps a completed Order Mission card historical with no empty operational block', async () => {
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
          assignmentCount: 3,
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
    vi.mocked(planningApi.getAssignments).mockResolvedValue({
      missionId: 'm1',
      revision: 7,
      assignments: [
        {
          assignmentId: 'a1',
          orderChecklistItemId: 'A',
          content: 'Requirement A',
          sourceType: 'CUSTOMER_CUSTOM',
          displayOrder: 0,
          active: true,
          version: 0,
        },
      ],
    })
    const view = render(<OrderMissionPlanningSection orderId="o" />)
    await screen.findByRole('link', { name: 'M1' })
    expect(screen.getAllByText('Khu A').length).toBeGreaterThan(0)
    expect(screen.getByText(/Đã chốt tại phiên bản 7/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Điều chỉnh kế hoạch' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Hủy Mission M1' }),
    ).not.toBeInTheDocument()
    const card = view.container.querySelector('.odm-planning-mission')!
    expect(card.querySelector('.odm-planning-stop')).toBeNull()
    expect(card.querySelector('details')).not.toBeNull()
    expect(
      await within(card as HTMLElement).findByText('Requirement A'),
    ).toBeInTheDocument()
    expect(
      within(card as HTMLElement).queryByRole('checkbox'),
    ).not.toBeInTheDocument()
    expect(
      within(card as HTMLElement).getByLabelText('Đã phân công'),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('heading', { name: 'Kế hoạch thực thi' }),
    ).toHaveLength(1)
    expect(
      screen.queryByText(/Chỉ đọc —|lặp lại không phải/),
    ).not.toBeInTheDocument()
  })
  it('loads persisted replacement chains after remount without creation-session state', async () => {
    vi.mocked(planningApi.getOrderMissions).mockResolvedValue([
      {
        id: 'm1',
        orderId: 'o',
        missionCode: 'M1',
        status: 'CANCELLED',
        replacesMissionId: null,
      },
      {
        id: 'm2',
        orderId: 'o',
        missionCode: 'M2',
        status: 'CANCELLED',
        replacesMissionId: 'm1',
      },
      {
        id: 'm3',
        orderId: 'o',
        missionCode: 'M3',
        status: 'RESOURCE_ASSIGNING',
        replacesMissionId: 'm2',
      },
    ] as MissionResponse[])
    const first = render(<OrderMissionPlanningSection orderId="o" />)
    await screen.findAllByText(/Thay thế cho/)
    first.unmount()
    render(<OrderMissionPlanningSection orderId="o" />)
    const relations = await screen.findAllByText(/Thay thế cho/)
    expect(
      within(relations[0]).getByRole('link', { name: 'M1', hidden: true }),
    ).toHaveAttribute('href', '#portal/manager/missions/m1/detail')
    expect(
      within(relations[1]).getByRole('link', { name: 'M2', hidden: true }),
    ).toHaveAttribute('href', '#portal/manager/missions/m2/detail')
    expect(
      screen.getAllByText(/Được thay thế bởi/).length,
    ).toBeGreaterThanOrEqual(2)
  })
  it('does not infer cancellation from READY_FOR_CANCELLATION when the server denies it', async () => {
    vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
      ...plan,
      planStatus: 'FINALIZED',
    })
    vi.mocked(planningApi.getSafeStop).mockResolvedValue({
      ...stop,
      status: 'READY_FOR_CANCELLATION',
      canCancelMission: false,
    })
    render(<OrderMissionPlanningSection orderId="o" />)
    await screen.findByRole('link', { name: 'M1' })
    await waitFor(() =>
      expect(planningApi.getSafeStop).toHaveBeenCalledTimes(3),
    )
    expect(screen.queryByText('READY_FOR_CANCELLATION')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hủy Mission M1' }))
    expect(
      screen.queryByRole('button', { name: 'Hủy Mission' }),
    ).not.toBeInTheDocument()
  })
  it('enables actual cancellation only after refreshing an explicit server capability', async () => {
    vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
      ...plan,
      planStatus: 'FINALIZED',
    })
    let permitted = false
    vi.mocked(planningApi.getSafeStop).mockImplementation(
      async (missionId) => ({
        ...stop,
        missionId,
        status: 'READY_FOR_CANCELLATION',
        canRequestSafeStop: false,
        canCleanupSafeStop: true,
        canCancelMission: missionId === 'm1' && permitted,
      }),
    )
    const cleanup = vi.spyOn(planningApi, 'cleanupSafeStop')
    render(<OrderMissionPlanningSection orderId="o" />)
    await screen.findByRole('link', { name: 'M1' })
    await waitFor(() =>
      expect(planningApi.getSafeStop).toHaveBeenCalledTimes(3),
    )
    expect(
      screen.queryByRole('button', { name: 'Giải phóng tài nguyên' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Hủy Mission' }),
    ).not.toBeInTheDocument()
    permitted = true
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại kế hoạch' }))
    expect(
      await screen.findByRole('button', { name: 'Hủy Mission M1' }),
    ).toBeEnabled()
    expect(cleanup).not.toHaveBeenCalled()
  })
  it('shows every Mission, exact links, authoritative repeated coverage and second create', async () => {
    render(<OrderMissionPlanningSection orderId="o" />)
    fireEvent.click(await screen.findByRole('button', { name: /^M3/ }))
    expect(await screen.findByRole('link', { name: 'M3' })).toHaveAttribute(
      'href',
      '#portal/manager/missions/m3/detail',
    )
    expect(
      screen.getByRole('button', { name: 'Tạo thêm Mission' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Phân công lặp').parentElement).toHaveTextContent(
      '1',
    )
    expect(
      screen.getByRole('button', { name: 'Chốt kế hoạch' }),
    ).toBeEnabled()
  })
  it('does not repeat uncovered items in the summary and refuses to continue', async () => {
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
    const onAssign = vi.fn()
    const finalize = vi.spyOn(planningApi, 'finalizeExecutionPlan')
    render(<OrderMissionPlanningSection orderId="o" onAssignResources={onAssign} />)
    expect(await screen.findByRole('note')).toHaveTextContent(
      'Còn 1 checklist chưa gán',
    )
    fireEvent.click(
      await screen.findByRole('button', { name: 'Chốt kế hoạch' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Còn checklist chưa được gán',
    )
    expect(onAssign).not.toHaveBeenCalled()
    expect(finalize).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('list', { name: 'Checklist chưa phủ' }),
    ).not.toBeInTheDocument()
  })
  it('submits split assignments with repeated E across sibling Missions', async () => {
    const update = vi
      .spyOn(planningApi, 'updateMissionChecklistAssignments')
      .mockResolvedValue({ missionId: 'm1', revision: 7, assignments: [] })
    render(<OrderMissionPlanningSection orderId="o" />)
    for (const [id, indices] of [
      ['m1', [0, 2, 4]],
      ['m2', [1, 3, 4]],
    ] as const) {
      fireEvent.click(
        await screen.findByRole('button', {
          name: new RegExp(`^${id.toUpperCase()}`),
        }),
      )
      const field = await screen.findByRole('group', {
        name: `Checklist ${id}`,
      })
      await waitFor(() =>
        expect(within(field).getAllByRole('checkbox')[0]).toBeEnabled(),
      )
      for (const index of indices)
        fireEvent.click(within(field).getAllByRole('checkbox')[index])
      fireEvent.click(
        within(field.closest('details')!).getByRole('button', {
          name: 'Lưu phân công',
        }),
      )
      await waitFor(() =>
        expect(update).toHaveBeenCalledWith(
          id,
          7,
          id === 'm1' ? ['A', 'C', 'E'] : ['B', 'D', 'E'],
        ),
      )
      await waitFor(() =>
        expect(planningApi.getExecutionPlan).toHaveBeenCalledTimes(
          id === 'm1' ? 2 : 3,
        ),
      )
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Tải lại kế hoạch' }),
        ).toBeEnabled(),
      )
    }
    expect(screen.getByText('Phân công lặp').parentElement).toHaveTextContent(
      '1',
    )
  })
  it('keeps unsaved selection after stale conflict, refreshes and does not retry', async () => {
    const update = vi
      .spyOn(planningApi, 'updateMissionChecklistAssignments')
      .mockRejectedValue(
        new ApiError('Stale', {
          code: 'EXECUTION_PLAN_REVISION_CONFLICT',
          status: 409,
          method: 'PUT',
          path: '/test',
        }),
      )
    render(<OrderMissionPlanningSection orderId="o" />)
    const field = await screen.findByRole('group', { name: 'Checklist m1' })
    await waitFor(() =>
      expect(within(field).getAllByRole('checkbox')[0]).toBeEnabled(),
    )
    fireEvent.click(within(field).getAllByRole('checkbox')[0])
    fireEvent.click(
      within(field.closest('details')!).getByRole('button', {
        name: 'Lưu phân công',
      }),
    )
    expect(
      await screen.findByText(/Kế hoạch đã được thay đổi/),
    ).toBeInTheDocument()
    expect(within(field).getAllByRole('checkbox')[0]).toBeChecked()
    expect(update).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledWith('m1', 7, ['A'])
  })
  it('finalize refresh locks assignment/create and amendment preserves finalized Missions', async () => {
    const finalized = {
      ...plan,
      planStatus: 'FINALIZED' as const,
      missions: plan.missions.map((m) => ({ ...m, finalizedPlanRevision: 7 })),
    }
    vi.spyOn(planningApi, 'finalizeExecutionPlan').mockImplementation(
      async () => {
        vi.mocked(planningApi.getExecutionPlan).mockResolvedValue(finalized)
        vi.mocked(planningApi.getOrderMissions).mockResolvedValue(
          ['m1', 'm2', 'm3'].map(
            (id) =>
              ({
                id,
                orderId: 'o',
                missionCode: id.toUpperCase(),
                status: 'READY',
                staffAssignments: [],
              }) as unknown as MissionResponse,
          ),
        )
        return finalized
      },
    )
    vi.spyOn(planningApi, 'amendExecutionPlan').mockImplementation(async () => {
      vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
        ...finalized,
        planStatus: 'DRAFT',
      })
      return {
        orderId: 'o',
        executionPlanStatus: 'DRAFT',
        executionPlanRevision: 7,
        amendedAt: '',
        amendmentReason: 'Weather',
      }
    })
    const view = render(
      <OrderMissionPlanningSection orderId="o" onAssignResources={vi.fn()} />,
    )
    fireEvent.click(await screen.findByRole('button', { name: /^M1/ }))
    fireEvent.click(
      await screen.findByRole('button', { name: 'Chốt kế hoạch' }),
    )
    await waitFor(() => expect(planningApi.finalizeExecutionPlan).toHaveBeenCalled())
    view.unmount()
    render(<OrderMissionPlanningSection orderId="o" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Điều chỉnh kế hoạch' }),
    )
    expect(
      screen.queryByRole('button', { name: 'Tạo thêm Mission' }),
    ).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Lý do điều chỉnh kế hoạch'), {
      target: { value: 'Weather' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận điều chỉnh' }))
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Điều chỉnh kế hoạch',
      }),
    )
    expect(
      await screen.findByRole('button', { name: 'Tạo thêm Mission' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText('Đã chốt tại phiên bản 7', { exact: false }),
    ).toHaveLength(3)
    expect(
      screen.queryByRole('button', { name: 'Lưu phân công' }),
    ).not.toBeInTheDocument()
  })
  it('replacement route retains Order and cancelled original identity', () => {
    const route = {
      screen: 'missionCreate' as const,
      orderId: 'o',
      replacesMissionId: 'm1',
    }
    expect(parseManagerRoute(managerHref(route))).toEqual(route)
  })
  it('cancel safe-stop blocker remains visible and does not remove the Mission locally', async () => {
    vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
      ...plan,
      planStatus: 'FINALIZED',
    })
    const safetyCommands = [
      vi.spyOn(planningApi, 'requestSafeStop'),
      vi.spyOn(planningApi, 'confirmSafeStop'),
      vi.spyOn(planningApi, 'cleanupSafeStop'),
    ]
    const cancel = vi.spyOn(planningApi, 'cancelMission').mockRejectedValue(
      new ApiError('Unsafe', {
        code: 'MISSION_CANCELLATION_REQUIRES_SAFE_STOP',
        status: 409,
        method: 'POST',
        path: '/cancel',
      }),
    )
    render(<OrderMissionPlanningSection orderId="o" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Hủy Mission M1' }),
    )
    fireEvent.change(screen.getByLabelText('Lý do hủy M1'), {
      target: { value: 'Weather' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Xác nhận hủy Mission' }),
    )
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Hủy Mission',
      }),
    )
    expect(
      await screen.findByText(/Mission chưa đủ điều kiện hủy/),
    ).not.toHaveTextContent('MISSION_CANCELLATION_REQUIRES_SAFE_STOP')
    expect(screen.queryByText(/Xem bảng safe-stop/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'M1' })).toBeInTheDocument()
    expect(cancel).toHaveBeenCalledWith('m1', {
      expectedPlanRevision: 7,
      reason: 'Weather',
    })
    expect(cancel).toHaveBeenCalledTimes(1)
    for (const command of safetyCommands) expect(command).not.toHaveBeenCalled()
  })
  it('only offers replacement after actual cancellation, not safe-stop readiness', async () => {
    vi.mocked(planningApi.getOrderMissions).mockResolvedValue([
      { id: 'm1', orderId: 'o', missionCode: 'M1', status: 'CANCELLED' },
      { id: 'm2', orderId: 'o', missionCode: 'M2', status: 'PENDING_REVIEW' },
    ] as MissionResponse[])
    vi.mocked(planningApi.getSafeStop).mockResolvedValue({
      ...stop,
      status: 'READY_FOR_CANCELLATION',
    })
    render(<OrderMissionPlanningSection orderId="o" />)
    expect(
      await screen.findByRole('button', {
        name: 'Tạo Mission thay thế cho M1',
      }),
    ).toBeEnabled()
    expect(
      screen.queryByRole('button', { name: 'Tạo Mission thay thế cho M2' }),
    ).not.toBeInTheDocument()
  })
})
describe('safe-stop role boundaries', () => {
  it('reopens a cleaned Mission in the workflow card instead of a second editable cancellation form', async () => {
    vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
      ...plan,
      planStatus: 'FINALIZED',
    })
    vi.mocked(planningApi.getOrderMissions).mockResolvedValue([
      {
        id: 'm1',
        orderId: 'o',
        missionCode: 'M1',
        status: 'POSTFLIGHT_CHECKING',
        staffAssignments: [],
      },
    ] as unknown as MissionResponse[])
    vi.mocked(planningApi.getSafeStop).mockResolvedValue({
      ...stop,
      status: 'READY_FOR_CANCELLATION',
      requestedAt: '2026-10-10T00:00:00Z',
      confirmedAt: '2026-10-10T01:00:00Z',
      cleanedAt: '2026-10-10T02:00:00Z',
      reason: 'Thời tiết xấu',
      canCleanupSafeStop: true,
    })
    render(<OrderMissionPlanningSection orderId="o" />)
    const trigger = await screen.findByRole('button', {
      name: 'Hủy Mission M1',
    })
    expect(
      screen.getAllByRole('button', { name: 'Hủy Mission M1' }),
    ).toHaveLength(1)
    fireEvent.click(trigger)
    await screen.findByText('Sẵn sàng hủy')
    expect(screen.getByRole('button', { name: 'Hủy Mission' })).toBeEnabled()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Xác nhận hủy Mission' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Giải phóng tài nguyên' }),
    ).not.toBeInTheDocument()
  })
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
  it('Manager actions and cancellation fail closed with an older capability-less response', async () => {
    vi.mocked(planningApi.getSafeStop).mockResolvedValue({
      ...stop,
      canRequestSafeStop: undefined,
      canConfirmSafeStop: undefined,
      canCleanupSafeStop: undefined,
      canCancelMission: undefined,
    })
    render(<OrderMissionPlanningSection orderId="o" />)
    await screen.findByRole('link', { name: 'M1' })
    await waitFor(() =>
      expect(planningApi.getSafeStop).toHaveBeenCalledTimes(3),
    )
    expect(
      screen.queryByRole('button', { name: 'Yêu cầu dừng an toàn' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Giải phóng tài nguyên' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Hủy Mission M1' }),
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
