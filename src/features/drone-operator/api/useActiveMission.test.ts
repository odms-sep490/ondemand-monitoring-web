import { describe, expect, it } from 'vitest'

import { isSelectableMission, mergeMissionSnapshot } from './useActiveMission'

describe('active mission selection', () => {
  it('never merges sibling device or schedule data into the selected Mission', () => {
    expect(
      mergeMissionSnapshot(
        { id: 'm1', status: 'COMPLETED' },
        {
          id: 'm2',
          status: 'SCHEDULED',
          deviceId: 'device-m2',
          scheduledStartAt: '2026-10-09T00:00:00Z',
        },
      ),
    ).toEqual({ id: 'm1', status: 'COMPLETED' })
  })
  it('keeps scheduled missions selectable after the operator accepts them', () => {
    expect(isSelectableMission('SCHEDULED')).toBe(true)
  })

  it('keeps the mission selectable while moving through connect and preflight', () => {
    expect(isSelectableMission('CONNECTED')).toBe(true)
    expect(isSelectableMission('PREFLIGHT_CHECKING')).toBe(true)
    expect(isSelectableMission('READY_TO_FLY')).toBe(true)
    expect(isSelectableMission('FAILED_PREFLIGHT')).toBe(true)
  })

  it('keeps the assigned device from the list when detail temporarily omits it', () => {
    expect(
      mergeMissionSnapshot(
        { id: 'm-1', status: 'READY_TO_FLY', deviceId: null },
        { id: 'm-1', status: 'CONNECTED', deviceId: 'device-0052' },
      )?.deviceId,
    ).toBe('device-0052')
  })

  it('keeps the device code from the list when detail temporarily omits it', () => {
    expect(
      mergeMissionSnapshot(
        { id: 'm-1', status: 'READY_TO_FLY', deviceId: null, droneCode: null },
        {
          id: 'm-1',
          status: 'CONNECTED',
          deviceId: '390b6b53-00a1-446c-abb2-93d8ffcd6454',
          droneCode: 'DRN-02',
        },
      )?.droneCode,
    ).toBe('DRN-02')
  })
})
