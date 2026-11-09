import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { OrderMissionPlanningSection } from '../components/OrderMissionPlanningSection'
import { ordersApi } from '../../../api/ordersApi'
import { planningApi } from '../../../api/planningApi'
import { missionsApi } from '../../../api/missionsApi'
import { missionApi } from '../../../../mission/api/missionApi'
import { droneApi } from '../../../../staff/api/droneApi'
import { operatorApi } from '../../../../staff/api/operatorApi'
import type { MissionResponse } from '../../../types/missions'
import type { OrderDetail, OrderMissionBrief } from '../../../types/orders'
import type { ExecutionPlan } from '../../../types/planning'
import { financeApi } from '../../../../finance/api'
import type { Invoice } from '../../../../finance/types'

const items = ['A', 'B', 'C', 'D', 'E'].map((id, displayOrder) => ({
  id,
  content: `Requirement ${id}`,
  displayOrder,
  sourceType: 'CUSTOMER_CUSTOM' as const,
  sourceChecklistId: null,
}))
let missions: MissionResponse[],
  revision: number,
  finalized: boolean,
  selected: Record<string, string[]>
function plan(): ExecutionPlan {
  const covered = new Set(Object.values(selected).flat())
  return {
    orderId: 'o',
    planStatus: finalized ? 'FINALIZED' : 'DRAFT',
    revision,
    missions: missions.map((m) => ({
      missionId: m.id,
      scopeLabel: m.missionCode,
      assignmentCount: selected[m.id]?.length ?? 0,
      checklistItemIds: selected[m.id] ?? [],
      finalizedPlanRevision: finalized ? revision : null,
    })),
    coverage: {
      total: 5,
      covered: covered.size,
      uncovered: 5 - covered.size,
      repeated: Object.values(selected).flat().length - covered.size,
      coverageReady: covered.size === 5,
      uncoveredItemIds: items
        .filter((i) => !covered.has(i.id))
        .map((i) => i.id),
    },
    blockers: [],
  }
}
it('reuses only the initial Order snapshot and fetches authoritative Order on refresh', async () => {
  render(
    <OrderMissionPlanningSection
      orderId="o"
      initialOrder={
        { id: 'o', status: 'APPROVED', checklistItems: items } as OrderDetail
      }
    />,
  )
  await screen.findByRole('link', { name: 'M1' })
  expect(ordersApi.getOrder).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Tải lại kế hoạch' }))
  await waitFor(() => expect(ordersApi.getOrder).toHaveBeenCalledTimes(1))
})

it('never reuses an initial snapshot belonging to a sibling Order', async () => {
  render(
    <OrderMissionPlanningSection
      orderId="o"
      initialOrder={
        {
          id: 'foreign',
          status: 'APPROVED',
          checklistItems: [],
        } as unknown as OrderDetail
      }
    />,
  )
  await screen.findByRole('link', { name: 'M1' })
  expect(ordersApi.getOrder).toHaveBeenCalledTimes(1)
  expect(ordersApi.getOrder).toHaveBeenCalledWith('o', expect.any(AbortSignal))
})

it('does not consume the initial snapshot in an aborted StrictMode request', async () => {
  render(
    <StrictMode>
      <OrderMissionPlanningSection
        orderId="o"
        initialOrder={
          { id: 'o', status: 'APPROVED', checklistItems: items } as OrderDetail
        }
      />
    </StrictMode>,
  )
  await screen.findByRole('link', { name: 'M1' })
  expect(ordersApi.getOrder).not.toHaveBeenCalled()
})
beforeEach(() => {
  vi.spyOn(financeApi, 'getManagerInvoice').mockResolvedValue({
    id: 'invoice-paid',
    paidAmount: 500,
    depositAmount: 500,
    remainingAmount: 0,
    finalPaymentAllowed: false,
  } as Invoice)
  missions = ['m1', 'm2'].map(
    (id) =>
      ({
        id,
        orderId: 'o',
        missionCode: id.toUpperCase(),
        status: 'PLANNING',
        scheduledStartAt: '2026-10-10T03:00:00Z',
        scheduledEndAt: '2026-10-10T04:00:00Z',
        staffAssignments: [],
      }) as unknown as MissionResponse,
  )
  revision = 2
  finalized = false
  selected = { m1: [], m2: [] }
  window.location.hash = '#portal/manager/orders/o'
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.spyOn(missionApi, 'getMissionById').mockImplementation(
    async (id) =>
      structuredClone(missions.find((m) => m.id === id)!) as unknown as Awaited<
        ReturnType<typeof missionApi.getMissionById>
      >,
  )
  vi.spyOn(ordersApi, 'getOrder').mockImplementation(
    async () =>
      ({ id: 'o', status: 'APPROVED', checklistItems: items }) as OrderDetail,
  )
  vi.spyOn(planningApi, 'getExecutionPlan').mockImplementation(async () =>
    plan(),
  )
  vi.spyOn(planningApi, 'getOrderMissions').mockImplementation(async () =>
    structuredClone(missions),
  )
  vi.spyOn(planningApi, 'getAssignments').mockImplementation(async (id) => ({
    missionId: id,
    revision,
    assignments: (selected[id] ?? []).map((key, index) => ({
      assignmentId: id + key,
      orderChecklistItemId: key,
      content: `Requirement ${key}`,
      sourceType: 'CUSTOMER_CUSTOM',
      displayOrder: index,
      active: true,
      version: 0,
    })),
  }))
  vi.spyOn(planningApi, 'updateMissionChecklistAssignments').mockImplementation(
    async (id, _revision, ids) => {
      selected[id] = ids
      revision++
      return { missionId: id, revision, assignments: [] }
    },
  )
  vi.spyOn(planningApi, 'finalizeExecutionPlan').mockImplementation(
    async () => {
      finalized = true
      revision++
      missions = missions.map((mission) => ({
        ...mission,
        status: 'PLANNING',
      }))
      return plan()
    },
  )
  vi.spyOn(droneApi, 'getAvailable').mockResolvedValue([
    { id: 'd1', label: 'Drone 1' },
    { id: 'd2', label: 'Drone 2' },
  ])
  vi.spyOn(operatorApi, 'getAvailable').mockResolvedValue([
    { id: 's1', fullName: 'Crew 1', email: 'one@test.local' },
    { id: 's2', fullName: 'Crew 2', email: 'two@test.local' },
  ])
  vi.spyOn(missionApi, 'assignResources').mockImplementation(
    async (id, deviceIds, staff) => {
      const m = missions.find((m) => m.id === id)!
      m.deviceId = (deviceIds as string[])[0]
      m.deviceName = m.deviceId === 'd1' ? 'Drone 1' : 'Drone 2'
      m.staffAssignments = Object.entries(staff).flatMap(([role, ids]) =>
        (ids as string[]).map((staffId) => ({
          id: id + role,
          staffId,
          staffName: staffId === 's1' ? 'Crew 1' : 'Crew 2',
          assignedRole: role,
        })),
      ) as MissionResponse['staffAssignments']
      return {} as Awaited<ReturnType<typeof missionApi.assignResources>>
    },
  )
})
afterEach(() => {
  vi.restoreAllMocks()
  window.location.hash = ''
  sessionStorage.clear()
})
it('does not load drone or staff candidates until a picker is opened on a finalized plan', async () => {
  finalized = true
  render(<OrderMissionPlanningSection orderId="o" />)
  await screen.findByRole('link', { name: 'M1' })
  expect(
    screen.queryByRole('button', { name: 'Lưu tài nguyên' }),
  ).not.toBeInTheDocument()
  expect(droneApi.getAvailable).not.toHaveBeenCalled()
  expect(operatorApi.getAvailable).not.toHaveBeenCalled()
})
it('links a completed Mission card to its dedicated result page', async () => {
  finalized = true
  missions[0].status = 'COMPLETED'
  render(<OrderMissionPlanningSection orderId="o" />)
  expect(await screen.findByRole('link', { name: 'M1' })).toHaveAttribute(
    'href',
    '#portal/manager/missions/m1/detail',
  )
})
describe('Order-centric workspace', () => {
  it('lists each Mission card with only its own checklist items by exact Mission ID', async () => {
    selected = { m1: ['A', 'C'], m2: ['B', 'D', 'E'] }
    render(<OrderMissionPlanningSection orderId="o" />)
    const m1 = await screen.findByRole('article', { name: 'M1' })
    const m2 = screen.getByRole('article', { name: 'M2' })
    expect(within(m1).getByText('Requirement A')).toBeInTheDocument()
    expect(within(m1).getByText('Requirement C')).toBeInTheDocument()
    expect(within(m1).queryByText('Requirement B')).not.toBeInTheDocument()
    expect(within(m2).getByText('Requirement B')).toBeInTheDocument()
    expect(within(m2).getByText('Requirement E')).toBeInTheDocument()
    expect(within(m2).queryByText('Requirement A')).not.toBeInTheDocument()
    // Editing is per card and never fires until the manager removes an item.
    expect(planningApi.updateMissionChecklistAssignments).not.toHaveBeenCalled()
  })
  it('removes a checklist item from one Mission only and refreshes the plan', async () => {
    selected = { m1: ['A', 'C', 'E'], m2: ['B', 'D', 'E'] }
    render(<OrderMissionPlanningSection orderId="o" />)
    const m1 = await screen.findByRole('article', { name: 'M1' })
    const remove = within(m1).getAllByRole('button', {
      name: /^Gỡ khỏi nhiệm vụ/,
    })
    expect(remove).toHaveLength(3)
    fireEvent.click(remove[2])
    await waitFor(() =>
      expect(planningApi.updateMissionChecklistAssignments).toHaveBeenCalledWith(
        'm1',
        2,
        ['A', 'C'],
      ),
    )
    await waitFor(() => expect(selected.m1).toEqual(['A', 'C']))
    expect(selected.m2).toEqual(['B', 'D', 'E'])
  })
  it('locks the plan through the confirmation dialog, then lets each Mission be confirmed', async () => {
    selected = { m1: ['A', 'C', 'E'], m2: ['B', 'D', 'E'] }
    vi.spyOn(missionsApi, 'confirmMissionPlanning').mockResolvedValue(
      {} as Awaited<ReturnType<typeof missionsApi.confirmMissionPlanning>>,
    )
    render(<OrderMissionPlanningSection orderId="o" />)
    await screen.findByRole('article', { name: 'M1' })
    expect(
      screen.queryByRole('button', { name: /^Xác nhận nhiệm vụ/ }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Chốt kế hoạch' }))
    // The app dialog, not window.confirm, asks before the plan is locked.
    const dialog = await screen.findByRole('dialog')
    expect(window.confirm).not.toHaveBeenCalled()
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Chốt kế hoạch' }),
    )
    await waitFor(() =>
      expect(planningApi.finalizeExecutionPlan).toHaveBeenCalledWith('o', 2),
    )
    // A finalized plan is no longer editable: the finalize action goes away
    // and each Mission can now be confirmed.
    const confirmM1 = within(
      await screen.findByRole('article', { name: 'M1' }),
    ).getByRole('button', { name: 'Xác nhận' })
    expect(
      screen.queryByRole('button', { name: 'Chốt kế hoạch' }),
    ).not.toBeInTheDocument()
    fireEvent.click(confirmM1)
    await waitFor(() =>
      expect(missionsApi.confirmMissionPlanning).toHaveBeenCalledWith('m1'),
    )
  })
  it('hands resource assignment off to the 3D office and drone team with Order return context', async () => {
    finalized = true
    missions = missions.map((mission) => ({ ...mission, status: 'PLANNING' }))
    render(<OrderMissionPlanningSection orderId="o" />)
    const m1 = await screen.findByRole('article', { name: 'M1' })
    expect(
      within(m1).getByRole('link', { name: /Phân công trong Văn phòng 3D/ }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining('assignmentMissionId=m1'),
    )
    expect(
      within(m1).queryByLabelText('Chọn nhân sự cho Phi công'),
    ).not.toBeInTheDocument()
    expect(window.location.hash).toBe('#portal/manager/orders/o')
  })
  it('reports every checklist item as assigned once the whole plan is covered', async () => {
    selected = { m1: ['A', 'B', 'C'], m2: ['D', 'E'] }
    render(<OrderMissionPlanningSection orderId="o" />)
    await screen.findByRole('article', { name: 'M1' })
    const sidebar = screen.getByRole('complementary', {
      name: 'Danh sách nhiệm vụ',
    })
    expect(
      within(sidebar).getByText('Đã phân công (5/5)'),
    ).toBeInTheDocument()
    expect(
      within(sidebar).getByText('Tất cả nhiệm vụ đã được phân công đầy đủ'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/công việc chưa được phân công/)).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Chốt kế hoạch' }),
    ).toBeEnabled()
  })
  it('creates two Missions inline without leaving the Order route', async () => {
    missions = []
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue({
      id: 'o',
      code: 'ORD-1',
      serviceName: 'Monitoring',
      customerFullName: 'Customer',
      preferredTimeName: 'Sáng',
      preferredDateFrom: '2026-10-10',
      preferredDateTo: '2026-10-11',
      center: null,
      mediaRequirements: [],
    } as unknown as OrderMissionBrief)
    vi.spyOn(missionsApi, 'createMission').mockImplementation(async () => {
      const id = 'm' + (missions.length + 1)
      missions.push({
        id,
        orderId: 'o',
        missionCode: id.toUpperCase(),
        status: 'PLANNING',
        staffAssignments: [],
      } as unknown as MissionResponse)
      revision++
      return missions.at(-1)! as unknown as Awaited<
        ReturnType<typeof missionsApi.createMission>
      >
    })
    render(<OrderMissionPlanningSection orderId="o" />)
    for (let i = 1; i <= 2; i++) {
      fireEvent.click(
        await screen.findByRole('button', { name: 'Thêm mới nhiệm vụ' }),
      )
      await screen.findByRole('heading', { name: 'Tạo nhiệm vụ mới' })
      fireEvent.change(screen.getByLabelText('Giờ cất cánh'), {
        target: { value: '2026-10-10T08:00' },
      })
      fireEvent.change(screen.getByLabelText('Giờ kết thúc dự kiến'), {
        target: { value: '2026-10-10T09:00' },
      })
      fireEvent.change(
        screen.getByLabelText(/Tên \/ phạm vi công việc của nhiệm vụ/),
        { target: { value: `Khu ${i}` } },
      )
      // The form renders before its plan/replacement queries finish. Wait for
      // the real readiness gate rather than clicking a still-disabled button.
      const createButton = screen.getByRole('button', { name: 'Tạo nhiệm vụ' })
      await waitFor(() => expect(createButton).toBeEnabled())
      fireEvent.click(createButton)
      await screen.findByRole('link', { name: 'M' + i })
      expect(missionsApi.createMission).toHaveBeenCalledTimes(i)
      expect(window.location.hash).toBe('#portal/manager/orders/o')
    }
    expect(screen.getAllByRole('article', { name: /^M[12]$/ })).toHaveLength(2)
  })
})
