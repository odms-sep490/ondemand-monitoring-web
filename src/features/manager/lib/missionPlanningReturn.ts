import { managerHref } from '../routes'
/** Resource assignment must return to the same planning scope, including both rework origins. */
export function missionPlanningReturnHref(
  mission: { id: string; purpose?: string | null } | null,
  missionId: string | undefined,
  orderId?: string,
) {
  if (mission?.purpose === 'REWORK')
    return managerHref({ screen: 'missionDispatch', missionId: mission.id })
  if (orderId) return managerHref({ screen: 'orderReview', orderId })
  return missionId
    ? managerHref({ screen: 'missionDetail', missionId })
    : undefined
}
