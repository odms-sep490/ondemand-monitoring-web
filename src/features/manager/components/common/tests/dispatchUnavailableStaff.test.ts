import { afterEach, describe, expect, it, vi } from 'vitest'

import { busyScheduleApi } from '../../../../busy-schedule/api/busyScheduleApi'
import type { WeeklyBusySchedule } from '../../../../busy-schedule/types'
import { operatorApi } from '../../../../staff/api/operatorApi'
import { loadDispatchStaff } from '../dispatchUnavailableStaff'

const window = { start: '2026-09-22T01:00:00Z', end: '2026-09-22T03:00:00Z' } // 08:00-10:00 VN
const a = { id: 'a', fullName: 'Ann', email: 'a@x.vn' }
const b = { id: 'b', fullName: 'Bob', email: 'b@x.vn' }
const c = { id: 'c', fullName: 'Cat', email: 'c@x.vn' }

const weekWith = (items: WeeklyBusySchedule['items']): WeeklyBusySchedule => ({
  weekStart: '2026-09-21',
  weekEnd: '2026-09-27',
  maxSessionsPerWeek: 4,
  usedSessions: items.length,
  remainingSessions: 4 - items.length,
  items,
})

afterEach(() => vi.restoreAllMocks())

describe('loadDispatchStaff', () => {
  it('flags staff missing from the mission-scoped list, with busy sessions as the reason', async () => {
    vi.spyOn(operatorApi, 'getAvailable').mockImplementation(async (missionId) =>
      missionId ? [a] : [a, b, c],
    )
    const getWeek = vi.spyOn(busyScheduleApi, 'getStaffWeek').mockImplementation(
      async (staffId) =>
        weekWith(
          staffId === 'b'
            ? [
                {
                  id: 'busy-1',
                  staffId: 'b',
                  staffName: 'Bob',
                  date: '2026-09-22',
                  dayOfWeek: 'TUESDAY',
                  session: 'MORNING',
                  startTime: '2026-09-21T23:00:00Z',
                  endTime: '2026-09-22T05:00:00Z',
                  notes: null,
                },
              ]
            : [],
        ),
    )
    const result = await loadDispatchStaff('m1', window)
    expect(result.people).toEqual([a])
    expect(result.unavailable.map((p) => [p.id, p.busySessions.length])).toEqual([
      ['b', 1],
      ['c', 0], // no busy session: held by another mission
    ])
    expect(getWeek).toHaveBeenCalledWith('b', '2026-09-21')
  })

  it('keeps working when the full directory or busy lookup fails', async () => {
    vi.spyOn(operatorApi, 'getAvailable').mockImplementation(async (missionId) => {
      if (!missionId) throw new Error('directory down')
      return [a]
    })
    const result = await loadDispatchStaff('m1', window)
    expect(result).toEqual({ people: [a], unavailable: [] })

    vi.mocked(operatorApi.getAvailable).mockImplementation(async (missionId) =>
      missionId ? [a] : [a, b],
    )
    vi.spyOn(busyScheduleApi, 'getStaffWeek').mockRejectedValue(new Error('403'))
    const again = await loadDispatchStaff('m1', window)
    expect(again.unavailable).toEqual([{ ...b, busySessions: [] }])
  })
})
