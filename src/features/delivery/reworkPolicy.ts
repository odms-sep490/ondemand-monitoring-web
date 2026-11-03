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
): boolean {
  return (
    item?.strategy !== 'REWORK' ||
    Boolean(
      item.assignedReworkMissionId &&
      item.assignedReworkMissionStatus === 'COMPLETED' &&
      asset.missionId === item.assignedReworkMissionId,
    )
  )
}
