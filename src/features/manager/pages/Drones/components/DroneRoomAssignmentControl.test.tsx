import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { droneApi } from '../../../../staff/api/droneApi'
import { missionsApi } from '../../../api/missionsApi'
import type {
  MissionCalendarItem,
  MissionResponse,
} from '../../../types/missions'
import type { DeviceResponse } from '../../../types/drones'
import { DroneRoomAssignmentControl } from './DroneRoomAssignmentControl'

const mission = {
  id: 'mission-1',
  missionCode: 'MS-1',
  orderCode: 'ORD-1',
  status: 'READY',
  scheduledStartAt: '2026-11-07T08:00:00Z',
  scheduledEndAt: '2026-11-07T09:00:00Z',
  droneId: 'drone-1',
  droneName: 'Drone cũ',
  deviceAssignments: [
    {
      id: 'assignment-1',
      deviceId: 'drone-1',
      deviceCode: 'DRN-001',
      deviceName: 'Drone cũ',
      deviceSerialNumber: 'SERIAL-1',
      deviceStatus: 'ASSIGNED',
      deviceRole: 'MAIN',
      checkupStatus: 'PLANNING',
      assignedAt: null,
    },
  ],
} as unknown as MissionCalendarItem

const selectedDrone = {
  id: 'drone-2',
  name: 'Drone mới',
  serialNumber: 'SERIAL-2',
  status: 'AVAILABLE',
} as DeviceResponse

const assignedMissionResponse = {
  id: mission.id,
  orderId: 'order-1',
  orderCode: mission.orderCode,
  orderTitle: 'Order 1',
  customerName: 'Customer',
  missionCode: mission.missionCode,
  status: mission.status,
  operatorId: null,
  staffAssignments: [],
  deviceAssignments: [
    {
      id: 'assignment-2',
      deviceId: selectedDrone.id,
      deviceCode: 'DRN-002',
      deviceName: selectedDrone.name,
      deviceSerialNumber: selectedDrone.serialNumber,
      deviceStatus: 'ASSIGNED',
      deviceRole: 'MAIN',
      checkupStatus: 'PLANNING',
      assignedAt: null,
    },
  ],
  droneId: selectedDrone.id,
  droneCode: 'DRN-002',
  latitude: null,
  longitude: null,
  address: null,
  scheduledStartAt: mission.scheduledStartAt,
  scheduledEndAt: mission.scheduledEndAt,
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
} as unknown as MissionResponse

beforeEach(() => {
  vi.spyOn(missionsApi, 'listMissions').mockResolvedValue({ items: [mission] })
  vi.spyOn(droneApi, 'getAvailable').mockResolvedValue([
    { id: selectedDrone.id, label: 'Drone mới', status: 'AVAILABLE' },
  ])
  vi.spyOn(missionsApi, 'assignDevice').mockResolvedValue(
    assignedMissionResponse,
  )
})

describe('DroneRoomAssignmentControl', () => {
  it('assigns the selected room drone and asks before replacing the primary drone', async () => {
    const onAssignmentChanged = vi.fn()
    render(
      <DroneRoomAssignmentControl
        drone={selectedDrone}
        lang="vi"
        onAssignmentChanged={onAssignmentChanged}
      />,
    )

    await screen.findByRole('option', { name: /MS-1/ })
    fireEvent.change(screen.getByLabelText('Nhiệm vụ'), {
      target: { value: mission.id },
    })

    const confirmReplacement = await screen.findByLabelText(
      'Tôi xác nhận thay drone chính hiện tại.',
    )
    const assignButton = screen.getByRole('button', { name: 'Gán drone' })
    expect(assignButton).toBeDisabled()

    fireEvent.click(confirmReplacement)
    await waitFor(() => expect(assignButton).toBeEnabled())
    fireEvent.click(assignButton)

    await waitFor(() => {
      expect(missionsApi.assignDevice).toHaveBeenCalledWith(
        mission.id,
        selectedDrone.id,
        'MAIN',
      )
    })
    expect(await screen.findByText('Đã gán drone vào nhiệm vụ.')).toBeTruthy()
    expect(onAssignmentChanged).toHaveBeenCalledWith(
      expect.objectContaining({ droneId: selectedDrone.id }),
    )
  })
})
