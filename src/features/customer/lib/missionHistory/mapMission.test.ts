import { describe, expect, it } from 'vitest'

import { normalizeMissionStatus, toMediaProgress, toMissionRow } from './mapMission'

const dto = {
  id: 'ms1',
  missionCode: 'MSN-1',
  orderId: 'o1',
  orderTitle: 'Survey',
  address: null,
  status: 'COMPLETED' as const,
  scheduledStartAt: '2026-09-09T13:00:00+07:00',
  startedAt: '2026-09-09T13:05:00+07:00',
  completedAt: null,
  description: '  ',
}

describe('mission history mapping', () => {
  it('maps the DTO and picks the most advanced timestamp', () => {
    expect(toMissionRow(dto)).toMatchObject({
      code: 'MSN-1',
      address: null,
      description: null,
      when: '2026-09-09T13:05:00+07:00',
    })
    expect(toMissionRow({ ...dto, completedAt: '2026-09-09T13:48:00+07:00' }).when).toBe(
      '2026-09-09T13:48:00+07:00',
    )
  })

  it('treats an unknown status as PLANNING', () => {
    expect(normalizeMissionStatus('WEIRD')).toBe('PLANNING')
    expect(normalizeMissionStatus('FAILED')).toBe('FAILED')
  })

  it('derives the media progress phase', () => {
    expect(toMediaProgress({ availableCount: 0, processingCount: 0, rejectedCount: 0 }).phase).toBe('none')
    expect(toMediaProgress({ availableCount: 3, processingCount: 0, rejectedCount: 1 }).phase).toBe('ready')
    expect(toMediaProgress({ availableCount: 3, processingCount: 2, rejectedCount: 0 })).toMatchObject({
      phase: 'processing',
      processing: 2,
    })
  })
})
