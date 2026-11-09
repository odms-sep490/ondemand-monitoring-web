import {
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { missionsApi } from '../../api/missionsApi'
import { droneApi } from '../../../staff/api/droneApi'
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

function renderMissionCard(missionOverride = mission) {
  return render(
    <MissionGridCard
      mission={missionOverride}
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

const availableDrones = [
  {
    id: 'drone-1',
    label: 'DRN-001 (DJI Mavic 3 Enterprise)',
    status: 'AVAILABLE',
  },
  {
    id: 'drone-2',
    label: 'DRN-002 (DJI Mavic 3 Enterprise)',
    status: 'AVAILABLE',
  },
]

function setMotionPreferenceForTest(reduced: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: reduced && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList)
}

async function openDevicePicker() {
  vi.spyOn(droneApi, 'getAvailable').mockResolvedValue(availableDrones)
  fireEvent.click(screen.getByRole('button', { name: /^Thêm$/ }))
  return screen.findByRole('group', { name: 'Thêm thiết bị cho nhiệm vụ' })
}

afterEach(() => vi.restoreAllMocks())

describe('MissionGridCard navigation', () => {
  it('opens Drone Team with the mission selected when the mission has a flight window', () => {
    renderMissionCard({
      ...mission,
      scheduledStartAt: '2026-11-07T08:00:00Z',
      scheduledEndAt: '2026-11-07T09:00:00Z',
    })

    expect(
      screen.getByRole('link', { name: 'Gán trong Đội drone' }),
    ).toHaveAttribute(
      'href',
      '#portal/manager/drones?assignmentMissionId=mission-1',
    )
  })

  it('does not show the Drone Team route when the mission is not yet eligible', () => {
    renderMissionCard()

    expect(
      screen.queryByRole('link', { name: 'Gán trong Đội drone' }),
    ).not.toBeInTheDocument()
  })
})

describe('MissionGridCard staff assignment', () => {
  // Staff assignment moved out of the card into the 3D office workspace; the
  // card now only hands off to it and lists who is already assigned.
  it('hands staff assignment off to the 3D office with the mission and order context', () => {
    renderMissionCard()

    const link = screen.getByRole('link', {
      name: /Phân công trong Văn phòng 3D/,
    })
    expect(link).toHaveAttribute(
      'href',
      '#portal/manager/schedule?assignmentMissionId=mission-1&assignmentCanEdit=1',
    )
    expect(
      screen.queryByRole('group', { name: 'Thêm nhân sự cho nhiệm vụ' }),
    ).not.toBeInTheDocument()
  })

  it('offers a read-only 3D office view when the card is disabled', () => {
    render(
      <MissionGridCard
        mission={mission}
        order={{} as OrderDetail}
        plan={plan}
        orderChecklistItems={[]}
        disabled
        onPlanChanged={vi.fn()}
        onRequestReason={vi.fn()}
        onEditMission={vi.fn()}
      />,
    )

    const link = screen.getByRole('link', { name: /Xem trong Văn phòng 3D/ })
    expect(link).toHaveAttribute(
      'href',
      '#portal/manager/schedule?assignmentMissionId=mission-1&assignmentCanEdit=0',
    )
    expect(
      screen.queryByRole('link', { name: /Phân công trong Văn phòng 3D/ }),
    ).not.toBeInTheDocument()
  })

  it('shows the assigned staff count and members without an inline picker', () => {
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

    expect(screen.getByText('Nhân sự (1/10)')).toBeInTheDocument()
    expect(screen.getByText(/Pilot One/)).toBeInTheDocument()
  })
})

describe('MissionGridCard drone assignment animation', () => {
  it('calls the existing assignment API and shows success only after confirmation', async () => {
    setMotionPreferenceForTest(true)
    const onPlanChanged = vi.fn()
    const assign = vi
      .spyOn(missionsApi, 'assignDevice')
      .mockResolvedValue({} as never)
    render(
      <MissionGridCard
        mission={mission}
        order={{} as OrderDetail}
        plan={plan}
        orderChecklistItems={[]}
        disabled={false}
        onPlanChanged={onPlanChanged}
        onRequestReason={vi.fn()}
      />,
    )

    const form = await openDevicePicker()
    expect(within(form).getByText('DRN-001 (DJI Mavic 3 Enterprise)')).toBeInTheDocument()
    fireEvent.click(
      within(form).getByRole('button', {
        name: 'Gán drone: DRN-001 (DJI Mavic 3 Enterprise)',
      }),
    )

    expect(await screen.findByText('Gán drone thành công.')).toBeInTheDocument()
    expect(assign).toHaveBeenCalledTimes(1)
    expect(assign).toHaveBeenCalledWith('mission-1', 'drone-1', 'MAIN')
    expect(onPlanChanged).toHaveBeenCalledTimes(1)
    // The mission prop is authoritative; no card/count is fabricated when the
    // parent has not yet supplied refreshed assignments.
    expect(screen.getByText('Thiết bị (0/10)')).toBeInTheDocument()
    expect(screen.queryByText('DRN-001', { selector: '.mg-assigned-drone-copy span' })).not.toBeInTheDocument()
  })

  it('keeps the device list unchanged and exposes the server error when assignment fails', async () => {
    setMotionPreferenceForTest(true)
    const assign = vi
      .spyOn(missionsApi, 'assignDevice')
      .mockRejectedValue(new Error('Drone không còn khả dụng'))
    renderMissionCard()

    const form = await openDevicePicker()
    fireEvent.click(
      within(form).getByRole('button', {
        name: 'Gán drone: DRN-001 (DJI Mavic 3 Enterprise)',
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Drone không còn khả dụng',
    )
    expect(assign).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Thiết bị (0/10)')).toBeInTheDocument()
    expect(
      within(screen.getByRole('group', { name: 'Thêm thiết bị cho nhiệm vụ' }))
        .getByRole('button', {
          name: 'Gán drone: DRN-001 (DJI Mavic 3 Enterprise)',
        }),
    ).toBeEnabled()
  })

  it('sends one request when the user double-clicks an assignment action', async () => {
    setMotionPreferenceForTest(true)
    let resolveAssignment!: (value: never) => void
    const assign = vi.spyOn(missionsApi, 'assignDevice').mockReturnValue(
      new Promise((resolve) => {
        resolveAssignment = resolve
      }),
    )
    renderMissionCard()

    const form = await openDevicePicker()
    const button = within(form).getByRole('button', {
      name: 'Gán drone: DRN-001 (DJI Mavic 3 Enterprise)',
    })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(assign).toHaveBeenCalledTimes(1)
    resolveAssignment({} as never)

    expect(await screen.findByText('Gán drone thành công.')).toBeInTheDocument()
    expect(assign).toHaveBeenCalledTimes(1)
  })

  it('waits at the target without showing success while the API is still pending', async () => {
    setMotionPreferenceForTest(false)
    let resolveAssignment!: (value: never) => void
    const assign = vi.spyOn(missionsApi, 'assignDevice').mockReturnValue(
      new Promise((resolve) => {
        resolveAssignment = resolve
      }),
    )
    renderMissionCard()

    const form = await openDevicePicker()
    fireEvent.click(
      within(form).getByRole('button', {
        name: 'Gán drone: DRN-001 (DJI Mavic 3 Enterprise)',
      }),
    )

    expect(
      await screen.findByText(
        'Drone đã tới vị trí. Đang xác nhận gán thiết bị…',
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('Gán drone thành công.')).not.toBeInTheDocument()
    expect(assign).toHaveBeenCalledTimes(1)
    resolveAssignment({} as never)
    expect(await screen.findByText('Gán drone thành công.')).toBeInTheDocument()
  })
})
