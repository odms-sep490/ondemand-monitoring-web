import { act } from 'react'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../../../shared/api/httpClient'
import { setLanguage } from '../../../../../shared/i18n'
import { missionsApi } from '../../../api/missionsApi'
import type { Mission, ResourceSuggestions } from '../../../types/missions'
import { MissionDispatchPage } from '../MissionDispatchPage'

const mission: Mission = {
  id: 'msn-2609-0153-1',
  orderId: 'ord-2609-0153',
  orderCode: 'ORD-2609-0153',
  missionCode: 'MSN-2609-0153-1',
  status: 'CREATED',
  attemptNumber: 1,
  droneId: null,
  operatorId: null,
  droneAssignmentId: null,
  operatorAssignmentId: null,
  scheduledStartAt: '2026-09-24T08:00:00+07:00',
  scheduledEndAt: '2026-09-24T09:30:00+07:00',
  addressText: 'KCN Hiệp Phước, Nhà Bè',
  centerLat: 10.6402,
  centerLon: 106.74,
  radiusM: 300,
  requiredSensor: 'THERMAL',
  nearestBase: 'Trạm Nhà Bè',
  mediaRequirements: [],
  flightPlan: {
    planType: 'ORBIT',
    centerLat: 10.6402,
    centerLon: 106.74,
    radiusM: 300,
    altitudeM: 60,
    speedMs: null,
    estimatedDurationSec: 1260,
    generatedBy: 'SYSTEM',
  },
  waypoints: [],
}

const feasible: ResourceSuggestions = {
  feasible: true,
  missionCode: 'MSN-2609-0153-1',
  attemptNumber: 1,
  scheduledStart: '2026-09-24T08:00:00+07:00',
  scheduledEnd: '2026-09-24T09:30:00+07:00',
  addressText: 'KCN Hiệp Phước, Nhà Bè',
  centerLat: 10.6402,
  centerLon: 106.74,
  radiusM: 300,
  mediaSummary: 'VIDEO 1 × 240 s · PHOTO 30',
  requiredDurationLabel: 'T_required ≈ 21 phút (ORBIT, 60 m)',
  requiredSensor: 'THERMAL',
  nearestBase: 'Trạm Nhà Bè',
  eligibleDroneCount: 3,
  eligibleOperatorCount: 3,
  topDrones: [
    {
      code: 'DRN-01',
      name: 'Đại Bàng',
      serialNumber: '1ZNBJ4K00C3A21',
      droneModelName: 'DJI Matrice 350 RTK',
      score: 91,
      batteryPct: 96,
      distanceKm: 2.2,
      enduranceMarginPct: 62,
      payload: 'THERMAL · Zenmuse H20T',
      hoursSinceMaintenance: 38,
      reason: 'Gần vị trí nhất.',
    },
    {
      code: 'DRN-05',
      name: 'Diều Hâu',
      serialNumber: '1ZNCE7M00A1F41',
      droneModelName: 'DJI Matrice 30T',
      score: 84,
      batteryPct: 88,
      distanceKm: 2.4,
      enduranceMarginPct: 51,
      payload: 'THERMAL · M30T tích hợp',
      hoursSinceMaintenance: 27,
      reason: 'Cùng trạm Nhà Bè.',
    },
  ],
  topOperators: [
    {
      code: 'HT',
      fullName: 'Hoàng Đức Thắng',
      licenseClass: 'Hạng B',
      licenseNumber: 'VN-UAV-0412-2024',
      licenseExpiry: '2026-10-11',
      score: 88,
      missionsWithModel: 14,
      successRatePct: 96,
      acceptanceRatePct: 92,
      missionsThisWeek: 2,
      reason: 'Đã bay 14 mission với Matrice 350.',
    },
    {
      code: 'BT',
      fullName: 'Bùi Anh Tuấn',
      licenseClass: 'Hạng B',
      licenseNumber: 'VN-UAV-0517-2024',
      licenseExpiry: '2027-08-02',
      score: 81,
      missionsWithModel: 9,
      successRatePct: 91,
      acceptanceRatePct: 88,
      missionsThisWeek: 1,
      reason: 'Kinh nghiệm tốt với dòng M350.',
    },
  ],
  rejected: {
    drones: [{ code: 'DRN-02', reason: 'Pin 71% < ngưỡng 80%' }],
    operators: [{ name: 'Đỗ Minh Quân', reason: 'Chứng chỉ hết hạn' }],
  },
  explanation: 'Gợi ý xếp hạng theo hard filter + điểm số.',
  timeline: {
    date: '24/09/2026',
    windowStart: '08:00',
    windowEnd: '09:30',
    resources: [
      {
        code: 'DRN-04',
        name: 'Sếu Đầu Đỏ',
        kind: 'DRONE',
        rejected: true,
        rejectedReason: 'bị loại: trùng lịch',
        bookings: [
          {
            missionCode: 'MSN-2609-0150-1',
            start: '2026-09-24T07:30:00+07:00',
            end: '2026-09-24T09:00:00+07:00',
            conflict: true,
          },
        ],
      },
    ],
  },
  alternatives: [],
}

const insufficient: ResourceSuggestions = {
  ...feasible,
  feasible: false,
  topDrones: [],
  topOperators: [],
  explanation: 'Không có drone đủ điều kiện.',
  alternatives: [
    {
      priority: 1,
      label: 'Phù hợp nhất',
      dateLabel: 'Thứ Hai, 22/09/2026',
      windowLabel: 'Chiều 13:00–17:00',
      eligibleDroneCount: 3,
      eligibleOperatorCount: 2,
    },
  ],
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DispatchPage', () => {
  it('shows a loading state, then renders drone suggestions (phase 1)', async () => {
    vi.spyOn(missionsApi, 'getMission').mockResolvedValue(mission)
    vi.spyOn(missionsApi, 'getResourceSuggestions').mockResolvedValue(feasible)
    render(<MissionDispatchPage missionId="msn-2609-0153-1" />)
    expect(screen.getByText('Đang tính điểm…')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('DRN-01 · Đại Bàng')).toBeInTheDocument(),
    )
    // Operator section is hidden until drone is locked (phase 2)
    expect(screen.queryByText('Hoàng Đức Thắng')).not.toBeInTheDocument()
  })

  it('sequential flow: lock drone → select operator → Phân công calls assign-drone then assign-operator', async () => {
    vi.spyOn(missionsApi, 'getMission').mockResolvedValue(mission)
    vi.spyOn(missionsApi, 'getResourceSuggestions').mockResolvedValue(feasible)
    const calls: string[] = []
    vi.spyOn(missionsApi, 'assignDrone').mockImplementation(async () => {
      calls.push('drone')
      return {
        ...mission,
        droneId: 'drn-01',
        droneAssignmentId: 'mda-1',
        status: 'RESOURCE_ASSIGNING',
      }
    })
    vi.spyOn(missionsApi, 'assignOperator').mockImplementation(async () => {
      calls.push('operator')
      return {
        ...mission,
        droneId: 'drn-01',
        operatorId: 'op-hoang-duc-thang',
        status: 'WAITING_OPERATOR_ACCEPTANCE',
      }
    })
    render(<MissionDispatchPage missionId="msn-2609-0153-1" />)
    await waitFor(() =>
      expect(screen.getByText('DRN-01 · Đại Bàng')).toBeInTheDocument(),
    )
    // Phase 1: lock drone
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Chọn drone này' })[0],
    )
    // Phase 2: operator section now visible after drone locked
    await waitFor(() =>
      expect(screen.getByText('Hoàng Đức Thắng')).toBeInTheDocument(),
    )
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Chọn phi công này' })[0],
    )
    fireEvent.click(screen.getByRole('button', { name: 'Phân công' }))
    await waitFor(() =>
      expect(screen.getByText(/Đã phân công thành công/)).toBeInTheDocument(),
    )
    expect(calls).toEqual(['drone', 'operator'])
  })

  it('auto-assign picks rank 1 for both drone and operator', async () => {
    vi.spyOn(missionsApi, 'getMission').mockResolvedValue(mission)
    vi.spyOn(missionsApi, 'getResourceSuggestions').mockResolvedValue(feasible)
    const droneSpy = vi.spyOn(missionsApi, 'assignDrone').mockResolvedValue({
      ...mission,
      droneId: 'drn-01',
      droneAssignmentId: 'mda-1',
      status: 'RESOURCE_ASSIGNING',
    })
    const operatorSpy = vi
      .spyOn(missionsApi, 'assignOperator')
      .mockResolvedValue({
        ...mission,
        droneId: 'drn-01',
        operatorId: 'op-hoang-duc-thang',
        status: 'WAITING_OPERATOR_ACCEPTANCE',
      })
    render(<MissionDispatchPage missionId="msn-2609-0153-1" />)
    await waitFor(() =>
      expect(screen.getByText('DRN-01 · Đại Bàng')).toBeInTheDocument(),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Phân công tự động (hạng 1)' }),
    )
    await waitFor(() =>
      expect(
        screen.getByText(/Đã phân công tự động thành công/),
      ).toBeInTheDocument(),
    )
    expect(droneSpy).toHaveBeenCalledWith('msn-2609-0153-1', 'DRN-01')
    expect(operatorSpy).toHaveBeenCalledWith('msn-2609-0153-1', 'HT')
  })

  it('shows the drone-conflict error when locking a conflicting drone', async () => {
    vi.spyOn(missionsApi, 'getMission').mockResolvedValue(mission)
    vi.spyOn(missionsApi, 'getResourceSuggestions').mockResolvedValue(feasible)
    vi.spyOn(missionsApi, 'assignDrone').mockRejectedValue(
      new ApiError(
        'Máy chủ từ chối: khung 07:30–09:00 vừa bị MSN-2609-0150-1 chiếm.',
        {
          status: 409,
          code: 'SCHEDULE_CONFLICT',
          method: 'POST',
          path: '/api/missions/msn-2609-0153-1/assign-drone',
        },
      ),
    )
    render(<MissionDispatchPage missionId="msn-2609-0153-1" />)
    await waitFor(() =>
      expect(screen.getByText('DRN-01 · Đại Bàng')).toBeInTheDocument(),
    )
    // Conflict surfaces immediately when locking the drone
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Chọn drone này' })[0],
    )
    await waitFor(() =>
      expect(screen.getByText(/MSN-2609-0150-1 chiếm/)).toBeInTheDocument(),
    )
  })

  it('shows the insufficient-resources state with alternative slots', async () => {
    vi.spyOn(missionsApi, 'getMission').mockResolvedValue(mission)
    vi.spyOn(missionsApi, 'getResourceSuggestions').mockResolvedValue(
      insufficient,
    )
    render(<MissionDispatchPage missionId="msn-2609-0153-1" />)
    await waitFor(() =>
      expect(
        screen.getByText('Không có drone đủ điều kiện'),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText('Phù hợp nhất')).toBeInTheDocument()
    expect(screen.getByText(/3 drone rảnh/)).toBeInTheDocument()
  })

  it('toggles the rejected-candidates block open/closed', async () => {
    vi.spyOn(missionsApi, 'getMission').mockResolvedValue(mission)
    vi.spyOn(missionsApi, 'getResourceSuggestions').mockResolvedValue(feasible)
    render(<MissionDispatchPage missionId="msn-2609-0153-1" />)
    await waitFor(() =>
      expect(screen.getByText('DRN-01 · Đại Bàng')).toBeInTheDocument(),
    )
    expect(screen.queryByText(/Pin 71%/)).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: /Đã bị loại ở hard filter/ }),
    )
    await waitFor(() => expect(screen.getByText(/Pin 71%/)).toBeInTheDocument())
    fireEvent.click(
      screen.getByRole('button', { name: /Đã bị loại ở hard filter/ }),
    )
    await waitFor(() =>
      expect(screen.queryByText(/Pin 71%/)).not.toBeInTheDocument(),
    )
  })

  it('release requires a non-blank reason', async () => {
    const assignedMission: Mission = {
      ...mission,
      droneId: 'drn-01',
      droneAssignmentId: 'mda-1',
      operatorId: 'op-1',
      operatorAssignmentId: 'moa-1',
      status: 'WAITING_OPERATOR_ACCEPTANCE',
    }
    vi.spyOn(missionsApi, 'getMission').mockResolvedValue(assignedMission)
    vi.spyOn(missionsApi, 'getResourceSuggestions').mockResolvedValue(feasible)
    const releaseSpy = vi.spyOn(missionsApi, 'releaseAssignment')
    render(<MissionDispatchPage missionId="msn-2609-0153-1" />)
    // When drone is already assigned, locked-drone banner shows (phase 2)
    await waitFor(() =>
      expect(
        screen.getByText('Bước 1 hoàn tất — Drone đã khóa'),
      ).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Thu hồi phân công' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thu hồi' }))
    expect(screen.getByText('Lý do là bắt buộc')).toBeInTheDocument()
    expect(releaseSpy).not.toHaveBeenCalled()
  })

  it('shows the "Đang tính điểm" loading state distinctly from the error state', async () => {
    vi.spyOn(missionsApi, 'getMission').mockResolvedValue(mission)
    vi.spyOn(missionsApi, 'getResourceSuggestions').mockRejectedValue(
      new ApiError('Timeout', {
        status: 504,
        method: 'GET',
        path: '/api/missions/msn-2609-0153-1/resource-suggestions',
      }),
    )
    render(<MissionDispatchPage missionId="msn-2609-0153-1" />)
    await waitFor(() =>
      expect(
        screen.getByText('Không lấy được gợi ý nguồn lực'),
      ).toBeInTheDocument(),
    )
  })

  it('renders English title and buttons when language is switched', async () => {
    vi.spyOn(missionsApi, 'getMission').mockResolvedValue(mission)
    vi.spyOn(missionsApi, 'getResourceSuggestions').mockResolvedValue(feasible)
    render(<MissionDispatchPage missionId="msn-2609-0153-1" />)
    act(() => setLanguage('en'))
    await waitFor(() =>
      expect(screen.getByText('Resource assignment')).toBeInTheDocument(),
    )
    expect(
      screen.getAllByRole('button', { name: 'Select this drone' })[0],
    ).toBeTruthy()
  })
})
