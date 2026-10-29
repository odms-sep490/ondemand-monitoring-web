import type { OperatorMission } from '../../types/mission'
import { missionHasSafeStop } from '../../../mission/lib/missionOperationalState'
import { monitoringErrorMessage } from '../../../mission/components/MonitoringChecklistSection'

/** Pilot has not answered yet: the screen's job is to support Accept/Reject. */
export function isAwaitingResponse(mission: OperatorMission) {
  return (
    mission.status === 'PENDING' &&
    mission.myResponseStatus !== 'ACCEPTED' &&
    !missionHasSafeStop(mission)
  )
}

export function actionErrorMessage(
  error: unknown,
  fallback: string,
  lang: 'vi' | 'en' = 'vi',
) {
  return error instanceof Error && error.message
    ? monitoringErrorMessage(error, lang)
    : fallback
}
