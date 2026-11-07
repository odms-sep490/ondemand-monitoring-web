import type { OperatorMission } from '../../types/mission'
import { ApiError } from '../../../../shared/api/httpClient'
import { monitoringErrorMessage } from '../../../mission/components/MonitoringChecklistSection'

/** Pilot has not answered yet: the screen's job is to support Accept/Reject. */
export function isAwaitingResponse(mission: OperatorMission) {
  return (
    mission.status === 'PENDING' &&
    mission.myResponseStatus !== 'ACCEPTED'
  )
}

export function actionErrorMessage(
  error: unknown,
  fallback: string,
  flightPermitNotApprovedMessage = 'Giấy phép bay chưa được phê duyệt. Vui lòng phê duyệt giấy phép bay trước khi bắt đầu nhiệm vụ.',
) {
  if (error instanceof ApiError) {
    const normalizedMessage = error.message
      .trim()
      .replace(/[.!?]+$/, '')
      .toLowerCase()

    if (
      normalizedMessage ===
      'flight permit must be approved before the mission can start'
    ) {
      return flightPermitNotApprovedMessage
    }

    if (
      error.code === 'MISSION_PERMISSIONS_UNAVAILABLE' ||
      [401, 403, 404, 409].includes(error.status ?? -1)
    ) {
      return monitoringErrorMessage(error)
    }

    if (error.code === 'NETWORK_ERROR' || (error.status ?? 0) >= 500) {
      return fallback
    }

    return error.message || fallback
  }

  if (error instanceof TypeError) return fallback
  return error instanceof Error && error.message ? error.message : fallback
}
