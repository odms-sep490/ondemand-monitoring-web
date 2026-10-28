import { describe, expect, it } from 'vitest'

import {
  toFlightDrone,
  toFlightMission,
  toOperatorMission,
} from './liveMission'

const mission = {
  id: '540c79a9-c987-4ea2-a46b-57a7ae967f93',
  missionCode: 'MS-8E897AE9',
  status: 'IN_FLIGHT',
  deviceId: '390b6b53-00a1-446c-abb2-93d8ffcd6454',
  droneCode: 'DRN-02',
  orderTitle: 'Giám sát khu vực',
  plan: {
    waypoints: [
      { id: '2', sequence: 2, simX: 2, simY: 3, altitudeM: 10 },
      { id: '1', sequence: 1, simX: 0, simY: 0, altitudeM: 5 },
    ],
  },
}

describe('live mission mapping', () => {
  it('preserves pending review and never treats unknown statuses as accepted', () => {
    expect(
      toOperatorMission({ ...mission, status: 'PENDING_REVIEW' }).status,
    ).toBe('PENDING_REVIEW')
    expect(
      toOperatorMission({ ...mission, status: 'FUTURE_STATUS' }).status,
    ).toBe('UNKNOWN')
    expect(
      toOperatorMission({ ...mission, status: 'FUTURE_STATUS' }).backendStatus,
    ).toBe('FUTURE_STATUS')
  })

  it('preserves planning statuses instead of showing them as unsupported', () => {
    expect(toOperatorMission({ ...mission, status: 'PLANNING' }).status).toBe('PLANNING')
    expect(toOperatorMission({ ...mission, status: 'READY' }).status).toBe('READY')
    expect(toOperatorMission({ ...mission, status: 'WAITING_DEPOSIT' }).status).toBe('WAITING_DEPOSIT')
  })
  it('keeps the backend ID for API calls and the code for display', () => {
    expect(toOperatorMission(mission).id).toBe(mission.id)
    expect(toOperatorMission(mission).missionCode).toBe(mission.missionCode)
    expect(toOperatorMission(mission).droneCode).toBe(mission.droneCode)
    expect(toFlightMission(mission).backendId).toBe(mission.id)
    expect(toFlightMission(mission).id).toBe(mission.missionCode)
    expect(toFlightDrone(mission).id).toBe(mission.deviceId)
    expect(toFlightDrone(mission).name).toBe(mission.droneCode)
  })

  it('uses only the assigned mission route in sequence order', () => {
    expect(
      toFlightMission(mission).routePoints?.map((point) => point.sequence),
    ).toEqual([1, 2])
  })

  it('shows an accepted crew assignment as accepted even while other crew are pending', () => {
    const mapped = toOperatorMission(
      {
        ...mission,
        status: 'READY',
        staffAssignments: [
          { staffId: 'staff-1', responseStatus: 'ACCEPTED' },
          { staffId: 'staff-2', responseStatus: 'PENDING' },
        ],
      },
      'staff-1',
    )

    expect(mapped.myResponseStatus).toBe('ACCEPTED')
    expect(mapped.status).toBe('ACCEPTED')
  })

  it('keeps the Accept action for legacy READY missions with a pending assignment', () => {
    const mapped = toOperatorMission(
      {
        ...mission,
        status: 'READY',
        staffAssignments: [{ staffId: 'staff-1', responseStatus: 'PENDING' }],
      },
      'staff-1',
    )

    expect(mapped.myResponseStatus).toBe('PENDING')
    expect(mapped.status).toBe('PENDING')
  })

  it('maps the manager scheduled end time for operator mission detail', () => {
    const mapped = toOperatorMission({
      ...mission,
      scheduledStartAt: '2026-10-05T00:35:00.000Z',
      scheduledEndAt: '2026-10-05T02:05:00.000Z',
    })

    expect(mapped.startTime).toBe('07:35')
    expect(mapped.endTime).toBe('09:05')
  })

  it('maps assigned device database fields for mission detail', () => {
    const mapped = toOperatorMission({
      ...mission,
      droneName: null,
      deviceName: 'Drone test 0054',
      deviceSerialNumber: 'SN-0054',
      deviceStatus: 'AVAILABLE',
      deviceModelCode: 'ASTAR-X1',
      deviceModelName: 'A* Monitoring Drone X1',
      deviceManufacturer: 'OnDemand Monitor',
      devicePayload: '4K camera',
    })

    expect(mapped.droneName).toBe('Drone test 0054')
    expect(mapped.deviceSerialNumber).toBe('SN-0054')
    expect(mapped.deviceStatus).toBe('AVAILABLE')
    expect(mapped.deviceModelCode).toBe('ASTAR-X1')
    expect(mapped.deviceManufacturer).toBe('OnDemand Monitor')
    expect(mapped.droneModel).toBe('A* Monitoring Drone X1')
    expect(mapped.dronePayload).toBe('4K camera')
  })
})
