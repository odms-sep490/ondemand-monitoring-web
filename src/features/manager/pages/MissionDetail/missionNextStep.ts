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
    case 'PLANNING':
    case 'RESOURCE_ASSIGNING':
      return {
        tone: 'go',
        title: n.assignTitle,
        detail: n.assignDetail,
      }
    case 'CREATED':
    case 'WAITING_DEPOSIT':
      return {
        tone: 'wait',
        title: n.awaitingOrderTitle,
        detail: n.awaitingOrderDetail,
      }
    case 'PENDING_CONFIRMATION':
      if (crew === 0) return { tone: 'go', title: n.assignTitle, detail: n.assignDetail }
      if (accepted >= crew) return null
      return {
        tone: 'wait',
        title: n.waitCrewTitle,
        detail: n.waitCrewDetail(accepted, crew),
      }
    case 'READY':
    case 'WAITING_OPERATOR_ACCEPTANCE':
      if (crew === 0) return { tone: 'go', title: n.assignTitle, detail: n.assignDetail }
      if (accepted >= crew) {
        return {
          tone: 'wait',
          title: n.scheduledTitle,
          detail: n.scheduledDetail,
        }
      }
      return {
        tone: 'wait',
        title: n.waitCrewTitle,
        detail: n.waitCrewDetail(accepted, crew),
      }
    case 'SCHEDULED':
      return {
        tone: 'wait',
        title: n.scheduledTitle,
        detail: n.scheduledDetail,
      }
    case 'CONNECTED':
      return {
        tone: 'wait',
        title: n.connectionTitle,
        detail: n.connectionDetail,
      }
    case 'PREFLIGHT_CHECKING':
      return {
        tone: 'wait',
        title: n.preflightTitle,
        detail: n.preflightDetail,
      }
    case 'READY_TO_FLY':
      return {
        tone: 'go',
        title: n.readyFlightTitle,
        detail: n.readyFlightDetail,
      }
    case 'IN_PROGRESS':
    case 'IN_FLIGHT':
    case 'RETURNING':
      return {
        tone: 'go',
        title: n.flightTitle,
        detail: n.flightDetail,
      }
    case 'POSTFLIGHT_CHECKING':
      return {
        tone: 'wait',
        title: n.postflightTitle,
        detail: n.postflightDetail,
      }
    case 'FAILED_PREFLIGHT':
      return {
        tone: 'bad',
        title: n.failedPreflightTitle,
        detail: n.failedPreflightDetail,
      }
    case 'AWAITING_REVIEW':
    case 'PENDING_REVIEW':
    case 'PENDING_APPROVAL':
      return {
        tone: 'wait',
        title: n.pendingManagerReviewTitle,
        detail: n.pendingManagerReviewDetail,
      }
    case 'COMPLETED':
      return {
        tone: 'done',
        title: n.completedTitle,
        detail: n.completedDetail,
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
