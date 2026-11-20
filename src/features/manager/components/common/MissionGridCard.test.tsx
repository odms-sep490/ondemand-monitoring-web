import {
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { missionsApi } from '../../api/missionsApi'
import { ApiError } from '../../../../shared/api/httpClient'
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

const scheduledMission = {
  ...mission,
  scheduledStartAt: '2026-11-07T08:00:00Z',
  scheduledEndAt: '2026-11-07T09:00:00Z',
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
    renderMissionCard(scheduledMission)

    expect(
      screen.getByRole('link', { name: 'Gán trong Đội drone' }),
    ).toHaveAttribute(
      'href',
      '#portal/manager/drones?assignmentMissionId=mission-1',
    )
  })

  it('requires a flight schedule before exposing staff or device assignment actions', () => {
    const onEditMission = vi.fn()
    render(
      <MissionGridCard
        mission={mission}
        order={{} as OrderDetail}
        plan={plan}
        orderChecklistItems={[]}
        disabled={false}
        onPlanChanged={vi.fn()}
        onRequestReason={vi.fn()}
        onEditMission={onEditMission}
      />,
    )

    expect(
      screen.queryByRole('link', { name: /Phân công trong Văn phòng 3D/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Gán trong Đội drone' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Thêm$/ })).not.toBeInTheDocument()
    expect(
      screen.getByText('Vui lòng cập nhật lịch bay trước khi phân công nhân sự.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Vui lòng cập nhật lịch bay trước khi phân công thiết bị.'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật lịch' }))
    expect(onEditMission).toHaveBeenCalledWith(mission)
  })
})

describe('MissionGridCard staff assignment', () => {
  // Staff assignment moved out of the card into the 3D office workspace; the
  // card now only hands off to it once a schedule exists and lists who is assigned.
  it('hands staff assignment off to the 3D office with the mission and order context', () => {
    renderMissionCard(scheduledMission)

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
        mission={scheduledMission}
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
    renderMissionCard(scheduledMission)

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
    renderMissionCard(scheduledMission)

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
    renderMissionCard(scheduledMission)

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


it('distinguishes internal supplementation from customer rework using the shared card', () => {
  render(<MissionGridCard mission={{ ...mission, purpose: 'REWORK', inspectionCorrectionId: 'correction', inspectionSourceMissionId: 'original', flightPermitStatus: 'APPROVED' }}
    order={{ id: 'order-1' } as OrderDetail} plan={plan} orderChecklistItems={[]} disabled
    sourceMission={{ id: 'original', code: 'MS-ORIGINAL' }}
    planningHref="#portal/manager/orders/order-1/inspection/original/correction"
    onPlanChanged={vi.fn()} onRequestReason={vi.fn()} />)
  const card = within(screen.getByRole('article', { name: 'MS-001' }))
  expect(card.getByText('Bổ sung sau nghiệm thu')).toBeInTheDocument()
  expect(card.getByRole('link', { name: 'MS-ORIGINAL' })).toHaveAttribute('href', '#portal/manager/missions/original/detail')
  expect(card.getByText('Đã được cấp phép')).toBeInTheDocument()
  expect(card.getByRole('link', { name: 'Mở lập kế hoạch' })).toHaveAttribute('href', '#portal/manager/orders/order-1/inspection/original/correction')
  expect(card.queryByRole('button', { name: 'Chỉnh sửa' })).toBeNull()
})

it('translates English backend schedule errors to Vietnamese when loading devices fails', async () => {
  vi.spyOn(droneApi, 'getAvailable').mockRejectedValue(
    new ApiError('Mission schedule is required for availability', {
      status: 400,
      code: 'INVALID_REQUEST',
      method: 'GET',
      path: '/manager/drones/available',
    }),
  )
  renderMissionCard(scheduledMission)

  fireEvent.click(screen.getByRole('button', { name: /^Thêm$/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Vui lòng cập nhật lịch bay (giờ bắt đầu và kết thúc) trước khi phân công nhân sự hoặc thiết bị.',
  )
})

it('translates plain Error schedule messages from recommendations API to Vietnamese', async () => {
  vi.spyOn(missionsApi, 'generateRecommendations').mockRejectedValue(
    new Error('Mission schedule is required for availability'),
  )
  renderMissionCard(mission)

  fireEvent.click(screen.getByRole('button', { name: /Gợi ý lịch & nguồn lực/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Vui lòng cập nhật lịch bay (giờ bắt đầu và kết thúc) trước khi phân công nhân sự hoặc thiết bị.',
  )
})
