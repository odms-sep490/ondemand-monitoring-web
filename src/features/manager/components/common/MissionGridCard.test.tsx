import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { missionsApi } from '../../api/missionsApi'
import { operatorApi } from '../../../staff/api/operatorApi'
import type { MissionResponse } from '../../types/missions'
import type { OrderDetail } from '../../types/orders'
import type { ExecutionPlan } from '../../types/planning'
import { MissionGridCard } from './MissionGridCard'

const mission = {
  id: 'mission-1',
  orderId: 'order-1',
  orderTitle: 'Roof inspection',
  customerName: 'Customer One',
  missionCode: 'MS-001',
  status: 'PLANNING',
  resourcePrepareStatus: 'PLANNING',
  staffAssignments: [],
  deviceAssignments: [],
  droneId: null,
  scheduledStartAt: null,
  scheduledEndAt: null,
} as unknown as MissionResponse

const plan: ExecutionPlan = {
  orderId: 'order-1',
  planStatus: 'DRAFT',
  revision: 1,
  missions: [
    {
      missionId: 'mission-1',
      scopeLabel: 'Roof inspection',
      assignmentCount: 0,
      checklistItemIds: [],
    },
  ],
  coverage: {
    total: 0,
    covered: 0,
    uncovered: 0,
    repeated: 0,
    coverageReady: true,
    uncoveredItemIds: [],
  },
  blockers: [],
}

const operators = [
  { id: 'staff-1', fullName: 'Pilot One', email: 'one@example.test' },
  { id: 'staff-2', fullName: 'Pilot Two', email: 'two@example.test' },
  { id: 'staff-3', fullName: 'Operator Three', email: 'three@example.test' },
]

function renderMissionCard() {
  return render(
    <MissionGridCard
      mission={mission}
      order={{} as OrderDetail}
      plan={plan}
      orderChecklistItems={[]}
      disabled={false}
      onPlanChanged={vi.fn()}
      onRequestReason={vi.fn()}
      onEditMission={vi.fn()}
    />,
  )
}

async function openStaffPicker() {
  fireEvent.click(screen.getByRole('button', { name: '+ Thêm' }))
  return screen.findByRole('group', { name: 'Thêm nhân sự cho nhiệm vụ' })
}

afterEach(() => vi.restoreAllMocks())

describe('MissionGridCard staff assignment', () => {
  it('assigns all four roles to one staff member and batches another person in one save', async () => {
    vi.spyOn(operatorApi, 'getAvailable').mockResolvedValue(operators)
    const assign = vi
      .spyOn(missionsApi, 'assignStaff')
      .mockResolvedValue({} as never)
    renderMissionCard()

    const form = await openStaffPicker()
    fireEvent.click(within(form).getByRole('checkbox', { name: /Pilot One/ }))
    for (const role of ['Vận hành', 'Bảo trì', 'Nghiệm thu']) {
      fireEvent.click(within(form).getByRole('checkbox', { name: role }))
    }
    fireEvent.click(within(form).getByRole('checkbox', { name: /Pilot Two/ }))
    fireEvent.click(
      within(form).getByRole('button', {
        name: 'Gán 2 người · 5 vai trò',
      }),
    )

    await waitFor(() => expect(assign).toHaveBeenCalledTimes(5))
    expect(assign).toHaveBeenNthCalledWith(1, 'mission-1', 'staff-1', 'PILOT')
    expect(assign).toHaveBeenNthCalledWith(
      2,
      'mission-1',
      'staff-1',
      'OPERATOR',
    )
    expect(assign).toHaveBeenNthCalledWith(
      3,
      'mission-1',
      'staff-1',
      'MAINTAINER',
    )
    expect(assign).toHaveBeenNthCalledWith(
      4,
      'mission-1',
      'staff-1',
      'INSPECTOR',
    )
    expect(assign).toHaveBeenNthCalledWith(5, 'mission-1', 'staff-2', 'PILOT')
    expect(
      screen.queryByRole('group', { name: 'Thêm nhân sự cho nhiệm vụ' }),
    ).not.toBeInTheDocument()
  })

  it('keeps only unassigned roles after a partial failure so the manager can retry', async () => {
    vi.spyOn(operatorApi, 'getAvailable').mockResolvedValue(operators)
    const assign = vi
      .spyOn(missionsApi, 'assignStaff')
      .mockImplementation(async (_missionId, staffId, role) => {
        if (staffId === 'staff-1' && role === 'MAINTAINER') {
          throw new Error('Vai trò không còn khả dụng')
        }
        return {} as never
      })
    renderMissionCard()

    let form = await openStaffPicker()
    fireEvent.click(within(form).getByRole('checkbox', { name: /Pilot One/ }))
    for (const role of ['Vận hành', 'Bảo trì', 'Nghiệm thu']) {
      fireEvent.click(within(form).getByRole('checkbox', { name: role }))
    }
    fireEvent.click(
      within(form).getByRole('button', {
        name: 'Gán 1 người · 4 vai trò',
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Đã gán 2/4 vai trò',
    )
    form = screen.getByRole('group', { name: 'Thêm nhân sự cho nhiệm vụ' })
    expect(
      within(form).getByRole('checkbox', { name: /Pilot One/ }),
    ).toBeChecked()
    expect(
      within(form).getByRole('button', { name: 'Gán 1 người · 2 vai trò' }),
    ).toBeEnabled()

    assign.mockImplementation(async () => ({}) as never)
    fireEvent.click(
      within(form).getByRole('button', { name: 'Gán 1 người · 2 vai trò' }),
    )
    await waitFor(() => expect(assign).toHaveBeenCalledTimes(5))
    expect(assign).toHaveBeenNthCalledWith(
      4,
      'mission-1',
      'staff-1',
      'MAINTAINER',
    )
    expect(assign).toHaveBeenNthCalledWith(
      5,
      'mission-1',
      'staff-1',
      'INSPECTOR',
    )
  })

  it('lets an already assigned staff member add missing roles without using another staff slot', async () => {
    vi.spyOn(operatorApi, 'getAvailable').mockResolvedValue(operators)
    const assign = vi
      .spyOn(missionsApi, 'assignStaff')
      .mockResolvedValue({} as never)
    render(
      <MissionGridCard
        mission={
          {
            ...mission,
            staffAssignments: [
              {
                id: 'assignment-1',
                staffId: 'staff-1',
                staffName: 'Pilot One',
                assignedRole: 'PILOT',
                responseStatus: 'PENDING',
              },
            ],
          } as unknown as MissionResponse
        }
        order={{} as OrderDetail}
        plan={plan}
        orderChecklistItems={[]}
        disabled={false}
        onPlanChanged={vi.fn()}
        onRequestReason={vi.fn()}
        onEditMission={vi.fn()}
      />,
    )

    const form = await openStaffPicker()
    expect(screen.getByText('Nhân sự (1/10)')).toBeInTheDocument()
    fireEvent.click(within(form).getByRole('checkbox', { name: /Pilot One/ }))
    expect(
      within(form).getByRole('checkbox', { name: /Phi công.*Đã gán/ }),
    ).toBeChecked()
    expect(
      within(form).getByRole('checkbox', { name: 'Vận hành' }),
    ).toBeChecked()
    fireEvent.click(
      within(form).getByRole('button', { name: 'Gán 1 người · 1 vai trò' }),
    )

    await waitFor(() => expect(assign).toHaveBeenCalledTimes(1))
    expect(assign).toHaveBeenCalledWith('mission-1', 'staff-1', 'OPERATOR')
  })

  it('selects all four roles for one person with one action', async () => {
    vi.spyOn(operatorApi, 'getAvailable').mockResolvedValue(operators)
    const assign = vi
      .spyOn(missionsApi, 'assignStaff')
      .mockResolvedValue({} as never)
    renderMissionCard()

    const form = await openStaffPicker()
    fireEvent.click(within(form).getByRole('checkbox', { name: /Pilot One/ }))
    fireEvent.click(
      within(form).getByRole('button', { name: 'Chọn cả 4 vai trò' }),
    )
    fireEvent.click(
      within(form).getByRole('button', {
        name: 'Gán 1 người · 4 vai trò',
      }),
    )

    await waitFor(() => expect(assign).toHaveBeenCalledTimes(4))
    expect(assign).toHaveBeenNthCalledWith(1, 'mission-1', 'staff-1', 'PILOT')
    expect(assign).toHaveBeenNthCalledWith(
      2,
      'mission-1',
      'staff-1',
      'OPERATOR',
    )
    expect(assign).toHaveBeenNthCalledWith(
      3,
      'mission-1',
      'staff-1',
      'MAINTAINER',
    )
    expect(assign).toHaveBeenNthCalledWith(
      4,
      'mission-1',
      'staff-1',
      'INSPECTOR',
    )
  })
})
