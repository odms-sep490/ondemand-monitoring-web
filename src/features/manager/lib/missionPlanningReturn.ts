import { managerHref } from '../routes'
/** Resource assignment must return to the same planning scope, including both rework origins. */
export function missionPlanningReturnHref(
  mission: {
    id: string
    purpose?: string | null
    orderId?: string
    inspectionCorrectionId?: string | null
    inspectionSourceMissionId?: string | null
    resultRevisionCaseId?: string | null
  } | null,
  missionId: string | undefined,
  orderId?: string,
) {
  const sourceOrderId = mission?.orderId ?? orderId
  if (
    sourceOrderId &&
    mission?.inspectionCorrectionId &&
    mission.inspectionSourceMissionId
  )
    return managerHref({
      screen: 'inspectionPlanning',
      orderId: sourceOrderId,
      sourceMissionId: mission.inspectionSourceMissionId,
      correctionId: mission.inspectionCorrectionId,
    })
  if (sourceOrderId && mission?.resultRevisionCaseId)
    return managerHref({
      screen: 'missionCreate',
      orderId: sourceOrderId,
      reworkCaseId: mission.resultRevisionCaseId,
    })
  if (mission?.purpose === 'REWORK')
    return managerHref({ screen: 'missionDispatch', missionId: mission.id })
  if (orderId) return managerHref({ screen: 'orderReview', orderId })
  return missionId
    ? managerHref({ screen: 'missionDetail', missionId })
    : undefined
}
