import { describe, expect, it } from 'vitest'
import type { ChecklistDeliveryAsset, ResultRevisionCase } from './api'
import { canUseDeliveryMedia } from './reworkPolicy'

const item = {
  strategy: 'REWORK',
  assignedReworkMissionId: 'rework-current',
  assignedReworkMissionStatus: 'COMPLETED',
} as ResultRevisionCase['items'][number]
const media = (missionId: string, mediaAssetId = `${missionId}-asset`) =>
  ({ missionId, mediaAssetId }) as ChecklistDeliveryAsset

describe('rework delivery sources', () => {
  it('allows only the completed assigned rework mission or backend-verified rework supplement', () => {
    expect(canUseDeliveryMedia(item, media('rework-current'))).toBe(true)
    expect(canUseDeliveryMedia(item, media('original'))).toBe(false)
    expect(canUseDeliveryMedia(item, media('rework-previous'))).toBe(false)

    const supplementAsset = media('rework-supplement', 'supp-1')
    const eligibleFromBackend = [supplementAsset]
    expect(
      canUseDeliveryMedia(item, supplementAsset, eligibleFromBackend),
    ).toBe(true)
    expect(
      canUseDeliveryMedia(item, media('original', 'old-1'), eligibleFromBackend),
    ).toBe(false)
  })
  it('blocks delivery before rework completion or without an assigned mission', () => {
    const supplementAsset = media('rework-supplement', 'supp-1')
    expect(
      canUseDeliveryMedia(
        { ...item, assignedReworkMissionStatus: 'IN_PROGRESS' },
        media('rework-current'),
      ),
    ).toBe(false)
    expect(
      canUseDeliveryMedia(
        { ...item, assignedReworkMissionStatus: 'IN_PROGRESS' },
        supplementAsset,
        [supplementAsset],
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
