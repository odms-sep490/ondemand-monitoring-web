import { getLanguage } from '../../../../shared/i18n'
import type { NextStep } from './missionDetailTypes'
import { missionDetailPageMessages } from './MissionDetailPage.messages'

/** Plain-language "what is happening / what is next" for the manager, by Mission status. */
export function missionNextStep(
  status: string,
  accepted: number,
  crew: number,
): NextStep | null {
  const n = missionDetailPageMessages[getLanguage()].extra.nextStep
  switch (status) {
    case 'RESOURCE_ASSIGNING':
      return {
        tone: 'go',
        title: n.assignTitle,
        detail: n.assignDetail,
      }
    case 'WAITING_CREW_CONFIRMATION':
    case 'WAITING_OPERATOR_ACCEPTANCE':
      return {
        tone: 'wait',
        title: n.waitCrewTitle,
        detail:
          crew > 0 ? n.waitCrewDetail(accepted, crew) : n.waitCrewDetailNoCrew,
      }
    case 'SCHEDULED':
      return {
        tone: 'wait',
        title: n.scheduledTitle,
        detail: n.scheduledDetail,
      }
    case 'FAILED_PREFLIGHT':
      return {
        tone: 'bad',
        title: n.failedPreflightTitle,
        detail: n.failedPreflightDetail,
      }
    case 'PENDING_REVIEW':
      return {
        tone: 'go',
        title: n.pendingReviewTitle,
        detail: n.pendingReviewDetail,
      }
    case 'FAILED':
    case 'CANCELLED':
      return {
        tone: 'bad',
        title: status === 'FAILED' ? n.failedTitle : n.cancelledTitle,
        detail: n.endedDetail,
      }
    default:
      return null
  }
}
