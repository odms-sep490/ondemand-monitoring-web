import { getLanguage } from '../../../../shared/i18n'
import { missionResultReviewReadinessMessages } from './missionResultReviewReadiness.messages'
import { ApiError } from '../../../../shared/api/httpClient'
import type {
  MissionChecklistResponse,
} from '../../../mission/types/checklistExecution'

const msgs = () => missionResultReviewReadinessMessages[getLanguage()]

/** Present the canonical backend verdict; never reconstruct evidence eligibility or counts. */
export function missionResultReviewReadiness({
  missionId,
  missionStatus,
  checklist,
  loading = false,
  failed = false,
}: {
  missionId: string
  missionStatus: string
  checklist?: MissionChecklistResponse
  loading?: boolean
  failed?: boolean
}) {
  const matching =
    !loading && !failed && checklist?.missionId === missionId
      ? checklist
      : undefined
  const missionComplete = missionStatus === 'COMPLETED'
  const finalReady = matching?.readyForFinalApproval === true
  const checklistReady = matching?.readyForSubmission === true || finalReady
  const blockers = matching
    ? [
        ...(matching.blockingReasons ?? []),
        ...matching.executions.flatMap((item) => item.blockingReasons ?? []),
      ]
    : []
  // A pending optional/unrelated media file must not override the canonical verdict.
  const mediaPending =
    !finalReady && blockers.includes('MEDIA_APPROVAL_REQUIRED')
  const ready = missionComplete && finalReady
  let reason: string | null = null
  if (loading) reason = msgs().checking
  else if (!matching) reason = msgs().unknown
  else if (!missionComplete) reason = msgs().missionNotComplete
  else if (!finalReady) {
    const blocker = mediaPending ? 'MEDIA_APPROVAL_REQUIRED' : blockers[0]
    reason = (blocker && msgs().reasons[blocker]) || msgs().checklistNotReady
  }
  return {
    ready,
    reason,
    missionComplete,
    checklistReady,
    mediaPending,
    known: !!matching,
  }
}

/** Keep the original error object in action state; never render its API message/code. */
export function missionResultReviewErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return msgs().sessionExpired
    if (error.status === 403) return msgs().forbidden
    if (error.status === 404 || error.code === 'RESOURCE_NOT_FOUND')
      return msgs().notPending
    if (error.code === 'CHECKLIST_NOT_READY')
      return msgs().checklistNotReadyError
    if (error.code === 'ORDER_MEDIA_QUANTITY_NOT_MET') return error.message
    if (error.code === 'MISSION_STATUS_INVALID')
      return msgs().missionStatusChanged
    if (error.code === 'CONCURRENT_UPDATE') return msgs().concurrentUpdate
  }
  return msgs().fallbackError
}
