import type { ResultRevisionCase, ChecklistDeliveryAsset } from './api'

export function canCreateRework(item: ResultRevisionCase['items'][number]) {
  return (
    item.scopeDecision === 'IN_SCOPE' &&
    item.strategy === 'REWORK' &&
    item.status === 'IN_PROGRESS' &&
    (!item.assignedReworkMissionId ||
      ['FAILED', 'CANCELLED'].includes(item.assignedReworkMissionStatus ?? ''))
  )
}

export function canUseDeliveryMedia(
  item: ResultRevisionCase['items'][number] | undefined,
  asset: ChecklistDeliveryAsset,
  eligibleMedia?: readonly Pick<
    ChecklistDeliveryAsset,
    'mediaAssetId' | 'missionId'
  >[],
): boolean {
  if (item?.strategy !== 'REWORK') return true
  if (
    !item.assignedReworkMissionId ||
    item.assignedReworkMissionStatus !== 'COMPLETED'
  ) {
    return false
  }
  if (eligibleMedia) {
    return eligibleMedia.some(
      (candidate) =>
        candidate.mediaAssetId === asset.mediaAssetId &&
        candidate.missionId === asset.missionId,
    )
  }
  return asset.missionId === item.assignedReworkMissionId
}
