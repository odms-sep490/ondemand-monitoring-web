import { describe, expect, it } from 'vitest'
import type { ChecklistDeliveryAsset, ResultRevisionCase } from './api'
import { canUseDeliveryMedia } from './reworkPolicy'

const item = {
  strategy: 'REWORK',
  assignedReworkMissionId: 'rework-current',
  assignedReworkMissionStatus: 'COMPLETED',
} as ResultRevisionCase['items'][number]
const media = (missionId: string) => ({ missionId }) as ChecklistDeliveryAsset

describe('rework delivery sources', () => {
  it('allows only the completed assigned rework mission', () => {
    expect(canUseDeliveryMedia(item, media('rework-current'))).toBe(true)
    expect(canUseDeliveryMedia(item, media('original'))).toBe(false)
    expect(canUseDeliveryMedia(item, media('rework-previous'))).toBe(false)
  })
  it('blocks delivery before rework completion or without an assigned mission', () => {
    expect(
      canUseDeliveryMedia(
        { ...item, assignedReworkMissionStatus: 'IN_PROGRESS' },
        media('rework-current'),
      ),
    ).toBe(false)
    expect(
      canUseDeliveryMedia(
        { ...item, assignedReworkMissionId: null },
        media('rework-current'),
      ),
    ).toBe(false)
  })
  it('preserves reserve-media and initial delivery selection', () => {
    expect(
      canUseDeliveryMedia(
        { ...item, strategy: 'RESERVE_MEDIA' },
        media('original'),
      ),
    ).toBe(true)
    expect(canUseDeliveryMedia(undefined, media('original'))).toBe(true)
  })
})
