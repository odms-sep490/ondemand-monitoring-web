import { act } from 'react'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../../../shared/api/httpClient'
import { setLanguage } from '../../../../../shared/i18n'
import { ordersApi } from '../../../api/ordersApi'
import { missionsApi } from '../../../api/missionsApi'
import { planningApi } from '../../../api/planningApi'
import type { Mission } from '../../../types/missions'
import type { OrderMissionBrief } from '../../../types/orders'
import { MissionCreatePage } from '../MissionCreatePage'

const brief: OrderMissionBrief = {
  id: 'ord-2609-0153',
  code: 'ORD-2609-0153',
  serviceName: 'Kiểm tra nhiệt mái nhà xưởng KCN Hiệp Phước',
  customerFullName: 'Trần Thị Thu Hà',
  preferredDate: '24/09',
  preferredDateFrom: '2026-09-24T07:00:00+07:00',
  preferredDateTo: '2026-09-26T11:00:00+07:00',
  preferredTimeName: 'Sáng',
  addressText: 'KCN Hiệp Phước, Nhà Bè',
  center: { lat: 10.6402, lon: 106.74 },
  radiusM: 300,
  mediaRequirements: [
    { label: 'VIDEO × 1 · 240 giây' },
    { label: 'PHOTO × 30 · 640×512' },
  ],
}

beforeEach(() => {
  vi.spyOn(planningApi, 'getExecutionPlan').mockResolvedValue({
    orderId: brief.id,
    planStatus: 'DRAFT',
    revision: 0,
    missions: [],
    coverage: {
      total: 0,
      covered: 0,
      uncovered: 0,
      repeated: 0,
      coverageReady: true,
      uncoveredItemIds: [],
    },
    blockers: [],
  })
})

const createdMission: Mission = {
  id: 'msn-2609-0153-1',
  orderId: 'ord-2609-0153',
  orderCode: 'ORD-2609-0153',
  missionCode: 'MSN-2609-0153-1',
  status: 'CREATED',
  droneId: null,
  operatorId: null,
  droneAssignmentId: null,
  operatorAssignmentId: null,
  scheduledStartAt: '2026-09-24T08:00:00+07:00',
  scheduledEndAt: '2026-09-24T09:30:00+07:00',
  addressText: brief.addressText,
  centerLat: 10.6402,
  centerLon: 106.74,
  radiusM: 300,
  requiredSensor: 'THERMAL',
  mediaRequirements: [],
  flightPlan: {
    planType: 'ORBIT',
    centerLat: 10.6402,
    centerLon: 106.74,
    radiusM: 300,
    altitudeM: 60,
    speedMs: 8,
    estimatedDurationSec: 600,
    generatedBy: 'SYSTEM',
  },
  waypoints: [],
}

afterEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
  window.location.hash = ''
})

describe('CreateMissionPage', () => {
  it('associates empty scope validation with the field without creating a Mission', async () => {
    const create = vi.spyOn(missionsApi, 'createMission')
    render(<MissionCreatePage orderId={brief.id} initialBrief={brief} />)
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Tạo nhiệm vụ' }),
      ).toBeEnabled(),
    )
    const scope = screen.getByLabelText(/Tên \/ phạm vi công việc của nhiệm vụ/)
    fireEvent.change(scope, { target: { value: ' ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo nhiệm vụ' }))
    expect(scope).toHaveAttribute('aria-invalid', 'true')
    expect(scope).toHaveAttribute(
      'aria-describedby',
      'mission-scope-help mission-scope-error',
    )
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(create).not.toHaveBeenCalled()
  })
  it('presents a localized scope default without exposing the internal request default', async () => {
    render(<MissionCreatePage orderId={brief.id} initialBrief={brief} />)
    expect(await screen.findByText('Phiên bản 0')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Kế hoạch thực thi' }),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText(/Tên \/ phạm vi công việc của nhiệm vụ/),
    ).toHaveValue('Toàn bộ phạm vi đơn hàng')
    expect(
      screen.getByText(
        'Nhiệm vụ sẽ sử dụng phạm vi địa lý hiện có của đơn hàng.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByDisplayValue('Whole Order scope'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByLabelText(/Tên \/ phạm vi công việc của nhiệm vụ/),
    ).toHaveAttribute('aria-describedby', 'mission-scope-help')
  })
  it('localizes the planning card and scope display in English', async () => {
    setLanguage('en')
    try {
      render(<MissionCreatePage orderId={brief.id} initialBrief={brief} />)
      expect(await screen.findByText('Version 0')).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: 'Order execution plan' }),
      ).toBeInTheDocument()
      expect(screen.getByLabelText(/Mission name \/ work scope/)).toHaveValue(
        'Entire Order scope',
      )
    } finally {
      setLanguage('vi')
    }
  })
  it('does not preselect checklist items that already have mission coverage', async () => {
    const checklistBrief: OrderMissionBrief = {
      ...brief,
      checklistItems: [
        {
          id: 'check-a',
          sourceChecklistId: null,
          sourceType: 'CUSTOMER_CUSTOM',
          content: 'Inspect the roof structure',
          displayOrder: 0,
        },
        {
          id: 'check-b',
          sourceChecklistId: null,
          sourceType: 'CUSTOMER_CUSTOM',
          content: 'Capture the north elevation',
          displayOrder: 1,
        },
      ],
    }
    vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
      orderId: brief.id,
      planStatus: 'DRAFT',
      revision: 3,
      missions: [
        {
          missionId: 'existing-mission',
          scopeLabel: 'Existing coverage',
          assignmentCount: 2,
          checklistItemIds: ['check-a', 'check-b'],
        },
      ],
      coverage: {
        total: 2,
        covered: 2,
        uncovered: 0,
        repeated: 0,
        coverageReady: true,
        uncoveredItemIds: [],
      },
      blockers: [],
    })

    const view = render(
      <MissionCreatePage orderId={brief.id} initialBrief={checklistBrief} />,
    )
    await screen.findAllByText('Đã gán: Existing coverage')
    const checklist = view.container.querySelector(
      '.odm-mission-checklist-selection-card',
    ) as HTMLElement

    expect(within(checklist).getByText('Đã chọn 0/2 mục')).toBeInTheDocument()
    expect(within(checklist).getAllByRole('checkbox')).toHaveLength(2)
    expect(
      within(checklist)
        .getAllByRole('checkbox')
        .every((box) => !(box as HTMLInputElement).checked),
    ).toBe(true)

    fireEvent.click(
      within(checklist).getByRole('button', { name: 'Chọn tất cả' }),
    )
    expect(
      await within(checklist).findByText('Đã chọn 2/2 mục'),
    ).toBeInTheDocument()
    expect(
      within(checklist)
        .getAllByRole('checkbox')
        .every((box) => (box as HTMLInputElement).checked),
    ).toBe(true)
  })
  it('creates a second planning Mission using authoritative revision, not sibling count', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
      orderId: brief.id,
      planStatus: 'DRAFT',
      revision: 4,
      missions: [
        {
          missionId: 'existing',
          scopeLabel: 'First',
          assignmentCount: 0,
          finalizedPlanRevision: null,
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
    })
    const create = vi
      .spyOn(missionsApi, 'createMission')
      .mockResolvedValue(createdMission)
    render(<MissionCreatePage orderId={brief.id} />)
    // Wait for the authoritative plan revision before asserting the outgoing
    // optimistic-lock token; the order form may be ready while this loads.
    await screen.findByText('Phiên bản 4')
    const start = await screen.findByLabelText('Giờ cất cánh')
    fireEvent.change(start, { target: { value: '2026-09-24T09:00' } })
    fireEvent.change(screen.getByLabelText('Giờ kết thúc dự kiến'), {
      target: { value: '2026-09-24T10:00' },
    })
    fireEvent.change(
      screen.getByLabelText(/Tên \/ phạm vi công việc của nhiệm vụ/),
      { target: { value: 'Second scope' } },
    )
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Tạo nhiệm vụ' }),
      ).toBeEnabled(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tạo nhiệm vụ' }))
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        brief.id,
        expect.objectContaining({ scopeLabel: 'Second scope' }),
      ),
    )
  })
  it('allows a replacement Mission when the execution plan is finalized', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
      orderId: brief.id,
      planStatus: 'FINALIZED',
      revision: 4,
      missions: [],
      coverage: {
        total: 0,
        covered: 0,
        uncovered: 0,
        repeated: 0,
        coverageReady: true,
        uncoveredItemIds: [],
      },
      blockers: [],
    })
    render(<MissionCreatePage orderId={brief.id} />)
    expect(
      await screen.findByText(
        'Kế hoạch đã chốt. Có thể tạo nhiệm vụ thay thế và chốt riêng nhiệm vụ đó.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tạo nhiệm vụ' })).toBeEnabled()
  })
  it('shows the customer window but leaves the flight schedule for staff to choose', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    render(
      <MissionCreatePage orderId="ord-2609-0153" now={new Date(2026, 8, 19)} />,
    )
    expect(screen.getByText('Đang tải…')).toBeInTheDocument()
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo nhiệm vụ' }),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText('Khoảng thời gian khách yêu cầu')).toBeTruthy()
    expect(
      screen.getByText('24/09/2026 → 26/09/2026 · Buổi sáng · 07:00–11:00'),
    ).toBeTruthy()
    expect(
      screen.getByText('Dự báo thời tiết theo khoảng khách yêu cầu'),
    ).toBeTruthy()
    await waitFor(() =>
      expect(screen.getByText('24/09/2026')).toBeInTheDocument(),
    )
    expect(screen.getByText('25/09/2026')).toBeInTheDocument()
    expect(screen.getByText('26/09/2026')).toBeInTheDocument()
    const startInput = screen.getByLabelText('Giờ cất cánh') as HTMLInputElement
    const endInput = screen.getByLabelText(
      'Giờ kết thúc dự kiến',
    ) as HTMLInputElement
    expect(startInput.value).toBe('')
    expect(endInput.value).toBe('')
    expect(screen.queryByText('Flight plan')).not.toBeInTheDocument()
    expect(screen.queryByText('Kiểu bay')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: 'Xem trước đường bay' }),
    ).toBeNull()
  })

  it('shows the error state with a mono debug line when the brief fails to load', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockRejectedValue(
      new ApiError('Đơn chưa được duyệt', {
        status: 409,
        method: 'GET',
        path: '/api/orders/ord-2609-0153/mission-brief',
      }),
    )
    render(<MissionCreatePage orderId="ord-2609-0153" />)
    await waitFor(() =>
      expect(
        screen.getByText('Không tải được đơn để tạo nhiệm vụ'),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText(/mission-brief · 409/)).toBeInTheDocument()
  })

  it('sends the idempotent planning contract and navigates to detail on success', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    vi.spyOn(missionsApi, 'createMission').mockResolvedValue(createdMission)
    render(
      <MissionCreatePage orderId="ord-2609-0153" now={new Date(2026, 8, 19)} />,
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo nhiệm vụ' }),
      ).toBeInTheDocument(),
    )
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Tạo nhiệm vụ' }),
      ).toBeEnabled(),
    )
    fireEvent.change(screen.getByLabelText('Giờ cất cánh'), {
      target: { value: '2026-09-24T08:00' },
    })
    fireEvent.change(screen.getByLabelText('Giờ kết thúc dự kiến'), {
      target: { value: '2026-09-24T09:30' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo nhiệm vụ' }))
    await waitFor(() =>
      expect(missionsApi.createMission).toHaveBeenCalledWith(
        'ord-2609-0153',
        expect.objectContaining({
          scopeLabel: 'Whole Order scope',
          scheduledStart: '2026-09-24T01:00:00.000Z',
          scheduledEnd: '2026-09-24T02:30:00.000Z',
        }),
      ),
    )
    await waitFor(() =>
      expect(window.location.hash).toBe('#portal/manager/orders/ord-2609-0153'),
    )
  })

  it('blocks submit when the finish time is before takeoff time', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    vi.spyOn(missionsApi, 'createMission').mockResolvedValue(createdMission)
    render(
      <MissionCreatePage orderId="ord-2609-0153" now={new Date(2026, 8, 19)} />,
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo nhiệm vụ' }),
      ).toBeInTheDocument(),
    )
    fireEvent.change(screen.getByLabelText('Giờ cất cánh'), {
      target: { value: '2026-09-11T18:58' },
    })
    fireEvent.change(screen.getByLabelText('Giờ kết thúc dự kiến'), {
      target: { value: '2026-09-10T15:58' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo nhiệm vụ' }))
    expect(
      await screen.findByText('Giờ kết thúc phải sau giờ cất cánh.'),
    ).toBeInTheDocument()
    expect(missionsApi.createMission).not.toHaveBeenCalled()
  })

  it('422 shows the design error copy with retry', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    vi.spyOn(missionsApi, 'createMission').mockRejectedValue(
      new ApiError('Dịch vụ tạo đường bay báo lỗi cho khu vực này.', {
        status: 422,
        code: 'FLIGHT_PLAN_GENERATION_FAILED',
        method: 'POST',
        path: '/api/orders/ord-2609-0153/missions',
      }),
    )
    render(
      <MissionCreatePage orderId="ord-2609-0153" now={new Date(2026, 8, 19)} />,
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo nhiệm vụ' }),
      ).toBeInTheDocument(),
    )
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Tạo nhiệm vụ' }),
      ).toBeEnabled(),
    )
    fireEvent.change(screen.getByLabelText('Giờ cất cánh'), {
      target: { value: '2026-09-24T08:00' },
    })
    fireEvent.change(screen.getByLabelText('Giờ kết thúc dự kiến'), {
      target: { value: '2026-09-24T09:30' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo nhiệm vụ' }))
    await waitFor(() =>
      expect(
        screen.getByText('Không tạo được kế hoạch bay'),
      ).toBeInTheDocument(),
    )
    expect(
      screen.queryByRole('button', { name: 'Nhập waypoint thủ công' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Thêm waypoint' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
    expect(
      screen.queryByText(/FLIGHT_PLAN_GENERATION_FAILED/),
    ).not.toBeInTheDocument()
  })

  it('renders English title and labels when language is switched', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    render(
      <MissionCreatePage orderId="ord-2609-0153" now={new Date(2026, 8, 19)} />,
    )
    act(() => setLanguage('en'))
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Create mission' }),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText('Customer requested window')).toBeTruthy()
    expect(
      screen.getByText('Actual flight schedule selected by staff'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Create mission' })).toBeTruthy()
  })
})
