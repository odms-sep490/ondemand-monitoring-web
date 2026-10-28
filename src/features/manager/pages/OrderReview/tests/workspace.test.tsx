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
function choose(id: string) {
  fireEvent.click(
    screen.getByRole('button', { name: new RegExp(`^${id.toUpperCase()}`) }),
  )
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
  await screen.findByRole('button', { name: /^M1/ })
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
  await screen.findByRole('button', { name: /^M1/ })
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
  await screen.findByRole('button', { name: /^M1/ })
  expect(ordersApi.getOrder).not.toHaveBeenCalled()
})
beforeEach(() => {
  vi.spyOn(financeApi, 'getManagerInvoice').mockResolvedValue({
    id: 'invoice-paid',
    paidAmount: 500,
    depositAmount: 500,
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
  vi.spyOn(planningApi, 'getSafeStop').mockImplementation(
    async (missionId) =>
      ({
        missionId,
        canCancelMission: false,
      }) as Awaited<ReturnType<typeof planningApi.getSafeStop>>,
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
        status: 'READY',
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
it('fails closed for finalized responses without materialization metadata', async () => {
  finalized = true
  vi.mocked(planningApi.getExecutionPlan).mockImplementation(async () => ({
    ...plan(),
    missions: plan().missions.map((scope) => ({
      ...scope,
      finalizedPlanRevision: null,
    })),
  }))
  render(<OrderMissionPlanningSection orderId="o" />)
  await screen.findByRole('button', { name: /^M1/ })
  expect(
    screen.queryByRole('button', { name: 'Lưu tài nguyên' }),
  ).not.toBeInTheDocument()
  expect(droneApi.getAvailable).not.toHaveBeenCalled()
  expect(operatorApi.getAvailable).not.toHaveBeenCalled()
})
it('opens the dedicated result page for a completed Mission', async () => {
  finalized = true
  missions[0].status = 'COMPLETED'
  render(<OrderMissionPlanningSection orderId="o" />)
  fireEvent.click(await screen.findByRole('button', { name: /^M1/ }))
  expect(window.location.hash).toBe('#portal/manager/missions/m1/detail')
})
async function saveChecklist(id: string, indices: number[]) {
  choose(id)
  const group = await screen.findByRole('group', { name: `Checklist ${id}` })
  await waitFor(() =>
    expect(within(group).getAllByRole('checkbox')[0]).toBeEnabled(),
  )
  indices.forEach((i) =>
    fireEvent.click(within(group).getAllByRole('checkbox')[i]),
  )
  fireEvent.click(
    within(group.closest('details')!).getByRole('button', {
      name: 'Lưu phân công',
    }),
  )
  await waitFor(() => expect(selected[id]).toHaveLength(indices.length))
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Tải lại kế hoạch' }),
    ).toBeEnabled(),
  )
}
describe('Order-centric workspace', () => {
  it('plans split checklist, finalizes and enters the original wizard without an inline resource form', async () => {
    const onAssign = vi.fn()
    const view = render(
      <OrderMissionPlanningSection orderId="o" onAssignResources={onAssign} />,
    )
    await screen.findByRole('link', { name: 'M1' })
    expect(
      screen.queryByRole('region', { name: 'Tài nguyên m1' }),
    ).not.toBeInTheDocument()
    await saveChecklist('m1', [0, 2, 4])
    await saveChecklist('m2', [1, 3, 4])
    expect(selected).toEqual({ m1: ['A', 'C', 'E'], m2: ['B', 'D', 'E'] })
    expect(screen.getByText('Đã phân công').parentElement).toHaveTextContent(
      '5',
    )
    // "Next" locks the plan and hands over to resource assignment in one step.
    fireEvent.click(screen.getByRole('button', { name: 'Chốt kế hoạch' }))
    await waitFor(() =>
      expect(planningApi.finalizeExecutionPlan).toHaveBeenCalledTimes(1),
    )
    expect(onAssign).toHaveBeenCalled()
    // The parent leaves this screen after "Next"; reopen the Order to see the locked plan.
    view.unmount()
    render(<OrderMissionPlanningSection orderId="o" />)
    await screen.findByRole('button', { name: 'Điều chỉnh kế hoạch' })
    choose('m1')
    fireEvent.click(
      await screen.findByRole('button', { name: 'Phân công nguồn lực cho M1' }),
    )
    await screen.findByLabelText('Chọn nhân sự cho Phi công')
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Tài nguyên m1' }),
    ).not.toBeInTheDocument()
    expect(window.location.hash).toBe('#portal/manager/orders/o')
  })
  it('preserves unsaved checkbox edits by exact Mission ID when switching', async () => {
    render(<OrderMissionPlanningSection orderId="o" />)
    const group = await screen.findByRole('group', { name: 'Checklist m1' })
    await waitFor(() =>
      expect(within(group).getAllByRole('checkbox')[0]).toBeEnabled(),
    )
    fireEvent.click(within(group).getAllByRole('checkbox')[0])
    choose('m2')
    expect(
      within(screen.getByRole('group', { name: 'Checklist m2' })).getAllByRole(
        'checkbox',
      )[0],
    ).not.toBeChecked()
    choose('m1')
    expect(
      within(screen.getByRole('group', { name: 'Checklist m1' })).getAllByRole(
        'checkbox',
      )[0],
    ).toBeChecked()
    expect(planningApi.updateMissionChecklistAssignments).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: 'Chốt kế hoạch' }),
    ).toBeInTheDocument()
  })
  it('returns from resource Mission selection to the same Order planning workspace', async () => {
    finalized = true
    missions = missions.map((mission) => ({ ...mission, status: 'READY' }))
    render(<OrderMissionPlanningSection orderId="o" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Phân công nguồn lực cho M1' }),
    )
    await screen.findByLabelText('Chọn nhân sự cho Phi công')
    fireEvent.click(screen.getByRole('button', { name: 'Về kế hoạch Order' }))
    expect(await screen.findByRole('link', { name: 'M1' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#portal/manager/orders/o')
  })
  it('hides the resource assignment action after every Mission is fully assigned', async () => {
    finalized = true
    missions = missions.map((mission) => ({
      ...mission,
      status: 'READY',
      deviceId: 'd1',
      deviceName: 'Drone 1',
      staffAssignments: [
        {
          id: `${mission.id}-pilot`,
          staffId: 's1',
          staffName: 'Crew 1',
          assignedRole: 'PILOT',
        },
        {
          id: `${mission.id}-operator`,
          staffId: 's1',
          staffName: 'Crew 1',
          assignedRole: 'OPERATOR',
        },
        {
          id: `${mission.id}-maintainer`,
          staffId: 's1',
          staffName: 'Crew 1',
          assignedRole: 'MAINTAINER',
        },
        {
          id: `${mission.id}-inspector`,
          staffId: 's1',
          staffName: 'Crew 1',
          assignedRole: 'INSPECTOR',
        },
      ],
    })) as MissionResponse[]

    render(<OrderMissionPlanningSection orderId="o" />)

    expect(
      await screen.findByText('✓ Tất cả Mission đã được phân công đầy đủ.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Phân công nguồn lực cho/ }),
    ).not.toBeInTheDocument()
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
        status: 'RESOURCE_ASSIGNING',
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
        await screen.findByRole('button', { name: 'Tạo thêm Mission' }),
      )
      await screen.findByRole('heading', { name: 'Tạo Mission mới' })
      fireEvent.change(screen.getByLabelText('Giờ cất cánh'), {
        target: { value: '2026-10-10T08:00' },
      })
      fireEvent.change(screen.getByLabelText('Giờ kết thúc dự kiến'), {
        target: { value: '2026-10-10T09:00' },
      })
      // The form renders before its plan/replacement queries finish. Wait for
      // the real readiness gate rather than clicking a still-disabled button.
      const createButton = screen.getByRole('button', { name: 'Tạo Mission' })
      await waitFor(() => expect(createButton).toBeEnabled())
      fireEvent.click(createButton)
      await screen.findByRole('link', { name: 'M' + i })
      expect(missionsApi.createMission).toHaveBeenCalledTimes(i)
      expect(window.location.hash).toBe('#portal/manager/orders/o')
    }
    expect(screen.getAllByRole('button', { name: /^M[12]/ })).toHaveLength(2)
  })
})
