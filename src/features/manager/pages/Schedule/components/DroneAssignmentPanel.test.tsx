import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AvailableDrone } from '../../../../staff/api/droneApi'
import { droneApi } from '../../../../staff/api/droneApi'
import { missionsApi } from '../../../api/missionsApi'
import type { MissionCalendarItem, MissionResponse } from '../../../types/missions'
import { DroneAssignmentPanel } from './DroneAssignmentPanel'

vi.mock('../../Drones/components/DroneRoomScene', () => ({
  DroneRoomScene: ({
    drones,
    onSelect,
    label,
  }: {
    drones: AvailableDrone[]
    onSelect: (droneId: string) => void
    label: string
  }) => (
    <div role="region" aria-label={label}>
      {drones.map((drone) => (
        <button key={drone.id} type="button" onClick={() => onSelect(drone.id)}>
          {`Select 3D ${drone.label}`}
        </button>
      ))}
    </div>
  ),
}))

const mission = {
  id: 'mission-1',
  orderId: 'order-1',
  missionCode: 'MS-001',
  status: 'PLANNING',
  scheduledStartAt: '2026-11-06T04:00:00Z',
  scheduledEndAt: '2026-11-06T05:00:00Z',
  droneId: null,
  deviceAssignments: [],
} as unknown as MissionCalendarItem

const assignmentResponse = {
  id: 'mission-1',
  orderId: 'order-1',
  missionCode: 'MS-001',
  status: 'PLANNING',
  scheduledStartAt: '2026-11-06T04:00:00Z',
  scheduledEndAt: '2026-11-06T05:00:00Z',
  orderTitle: 'Inspection',
  customerName: 'Customer',
  operatorId: null,
  droneId: 'drone-1',
  droneCode: 'DR-001',
  latitude: null,
  longitude: null,
  address: null,
  startedAt: null,
  completedAt: null,
  description: null,
  failureReason: null,
  rejectionReason: null,
  mediaType: null,
  plan: null,
  preflightRetryCount: 0,
  preflightPassed: false,
  preflightFaultType: null,
  preflightFailureReason: null,
  preflightCheckedAt: null,
  deviceAssignments: [],
} as unknown as MissionResponse

const drone: AvailableDrone = {
  id: 'drone-1',
  label: 'Drone 1 (Mavic 3 Enterprise)',
  status: 'AVAILABLE',
}

beforeEach(() => {
  vi.spyOn(droneApi, 'getAvailable').mockResolvedValue([])
  vi.spyOn(missionsApi, 'assignDevice').mockResolvedValue(assignmentResponse)
})

afterEach(() => vi.restoreAllMocks())

describe('DroneAssignmentPanel', () => {
  it('keeps the room available while the API returns no assignable drone', async () => {
    render(
      <DroneAssignmentPanel
        mission={mission}
        canEdit
        lang="vi"
        onAssignmentChanged={vi.fn()}
      />,
    )

    expect(await screen.findByRole('region', { name: 'Khu vực chọn drone 3D' }))
      .toBeInTheDocument()
    expect(await screen.findByText('Không có drone khả dụng trong khung giờ này.'))
      .toBeInTheDocument()
    expect(droneApi.getAvailable).toHaveBeenCalledWith('mission-1')
  })

  it('syncs a 3D selection with the list and sends the existing mission assignment', async () => {
    vi.mocked(droneApi.getAvailable).mockResolvedValue([drone])
    const onAssignmentChanged = vi.fn()

    render(
      <DroneAssignmentPanel
        mission={mission}
        canEdit
        lang="vi"
        onAssignmentChanged={onAssignmentChanged}
      />,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Select 3D Drone 1 (Mavic 3 Enterprise)' }))
    expect(screen.getByRole('button', { name: /Drone 1 \(Mavic 3 Enterprise\).*Sẵn sàng/ }))
      .toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Gán drone' }))
    await waitFor(() => expect(missionsApi.assignDevice).toHaveBeenCalledWith('mission-1', 'drone-1', 'MAIN'))
    expect(onAssignmentChanged).toHaveBeenCalledOnce()
  })
})
