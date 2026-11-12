import { describe, expect, it } from 'vitest'

import type { BusySchedule } from '../types'
import {
  addDays,
  busyOverlapping,
  cellKey,
  indexBusyItems,
  isSessionPast,
  mondayOf,
  todayIso,
  vnDateOf,
  weekAnchorsForWindow,
  weekDays,
} from './busySessions'

const item = (date: string, session: BusySchedule['session'], start: string, end: string): BusySchedule => ({
  id: `${date}-${session}`,
  staffId: 's1',
  staffName: 'S',
  date,
  dayOfWeek: 'MONDAY',
  session,
  startTime: start,
  endTime: end,
  notes: null,
})

describe('busySessions', () => {
  it('computes Monday-based weeks', () => {
    expect(mondayOf('2026-09-27')).toBe('2026-09-21') // Sunday
    expect(mondayOf('2026-09-21')).toBe('2026-09-21')
    expect(weekDays('2026-09-21')).toHaveLength(7)
    expect(addDays('2026-09-28', -7)).toBe('2026-09-21')
  })

  it('uses the Vietnam calendar date', () => {
    expect(vnDateOf('2026-09-21T18:00:00Z')).toBe('2026-09-22')
    expect(todayIso(Date.parse('2026-09-21T01:00:00Z'))).toBe('2026-09-21')
  })

  it('indexes busy sessions by date and session', () => {
    const busy = item('2026-09-22', 'MORNING', '2026-09-21T23:00:00Z', '2026-09-22T05:00:00Z')
    const map = indexBusyItems([busy])
    expect(map.get(cellKey('2026-09-22', 'MORNING'))).toBe(busy)
    expect(map.get(cellKey('2026-09-22', 'EVENING'))).toBeUndefined()
  })

  it('marks sessions that already started as past', () => {
    const now = Date.parse('2026-09-21T08:00:00Z') // 15:00 VN
    expect(isSessionPast('2026-09-21', 'MORNING', now)).toBe(true)
    expect(isSessionPast('2026-09-21', 'AFTERNOON', now)).toBe(true)
    expect(isSessionPast('2026-09-21', 'EVENING', now)).toBe(false)
  })

  it('finds busy sessions overlapping a mission window (half-open)', () => {
    const morning = item('2026-09-22', 'MORNING', '2026-09-21T23:00:00Z', '2026-09-22T05:00:00Z')
    expect(busyOverlapping([morning], '2026-09-22T04:00:00Z', '2026-09-22T06:00:00Z')).toEqual([morning])
    expect(busyOverlapping([morning], '2026-09-22T05:00:00Z', '2026-09-22T06:00:00Z')).toEqual([])
  })

  it('lists every week touched by a window', () => {
    expect(weekAnchorsForWindow('2026-09-27T10:00:00Z', '2026-09-28T01:00:00Z')).toEqual([
      '2026-09-21',
      '2026-09-28',
    ])
  })
})
