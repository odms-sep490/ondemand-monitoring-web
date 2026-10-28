import type {
  MissionStatus,
  OrderStatus,
} from '../../../../shared/types/domain'

/**
 * Two independent levels of work:
 *  - ORDER stages happen once per Order.
 *  - MISSION stages repeat for every Mission of that Order.
 * They are modelled separately so the UI never draws them as one straight line.
 */
export const ORDER_STAGES = [
  'intake',
  'criteria',
  'decision',
  'deposit',
  'planning',
] as const
export type OrderStage = (typeof ORDER_STAGES)[number]

export const MISSION_STAGES = [
  'permit',
  'execute',
  'done',
] as const
export type MissionStage = (typeof MISSION_STAGES)[number]

/**
 * The Order planning flow ends after the flight permit. Execution and result
 * review live on the dedicated Mission detail screen.
 */
export const MISSION_PLANNING_STAGES = MISSION_STAGES.slice(0, 2) as readonly MissionStage[]

/** done = can be reopened read-only; blocked = cannot continue (e.g. after a rejection). */
export type StageState = 'done' | 'current' | 'waiting' | 'upcoming' | 'blocked'

/** Review pages 1–4 (info, area, criteria, quote+decision) grouped into Order stages. */
export function reviewStepToOrderStage(step: 1 | 2 | 3 | 4): OrderStage {
  if (step === 1) return 'intake'
  if (step === 4) return 'decision'
  return 'criteria'
}

export function orderStageToReviewStep(stage: OrderStage): 1 | 2 | 4 | null {
  if (stage === 'intake') return 1
  if (stage === 'criteria') return 2
  if (stage === 'decision') return 4
  return null
}

export type OrderProgress = {
  current: OrderStage | 'complete'
  /** The current stage is stalled on someone else (the customer's deposit). */
  waiting: boolean
  terminal: 'rejected' | 'cancelled' | null
}

export function orderProgress({
  status,
  depositPaid,
  reviewStep,
  planFinalized,
}: {
  status: OrderStatus
  depositPaid: boolean
  reviewStep: 1 | 2 | 3 | 4
  planFinalized?: boolean
}): OrderProgress {
  if (status === 'REJECTED' || status === 'CANCELLED')
    return {
      current: 'decision',
      waiting: false,
      terminal: status === 'REJECTED' ? 'rejected' : 'cancelled',
    }
  if (status === 'APPROVED') {
    if (planFinalized) {
      return { current: 'complete', waiting: false, terminal: null }
    }
    return {
      current: depositPaid ? 'planning' : 'deposit',
      waiting: !depositPaid,
      terminal: null,
    }
  }
  if (['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(status))
    return { current: 'complete', waiting: false, terminal: null }
  return {
    current: reviewStepToOrderStage(reviewStep),
    waiting: false,
    terminal: null,
  }
}

export function orderStageState(
  stage: OrderStage,
  progress: OrderProgress,
): StageState {
  if (progress.current === 'complete') return 'done'
  const at = ORDER_STAGES.indexOf(stage)
  const now = ORDER_STAGES.indexOf(progress.current)
  if (at < now) return 'done'
  if (at === now) return progress.waiting ? 'waiting' : 'current'
  return progress.terminal ? 'blocked' : 'upcoming'
}

export type MissionProgress = {
  current: MissionStage
  /** True when the last stage is finished too (Mission COMPLETED). */
  finished: boolean
  terminal: 'failed' | 'cancelled' | null
}

export function missionProgress(
  status: MissionStatus,
  flightPermitStatus?: 'NOT_REQUESTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | null,
): MissionProgress {
  if (status === 'COMPLETED')
    return { current: 'done', finished: true, terminal: null }
  if (status === 'FAILED')
    return { current: 'execute', finished: false, terminal: 'failed' }
  if (status === 'CANCELLED')
    return { current: 'permit', finished: false, terminal: 'cancelled' }
  let stage: MissionStage = (
    {
      PLANNING: 'permit',
      CREATED: 'permit',
      WAITING_DEPOSIT: 'permit',
      READY: 'permit',
      RESOURCE_ASSIGNING: 'permit',
      WAITING_OPERATOR_ACCEPTANCE: 'permit',
      SCHEDULED: 'permit',
      CONNECTED: 'permit',
      PREFLIGHT_CHECKING: 'permit',
      READY_TO_FLY: 'permit',
      FAILED_PREFLIGHT: 'permit',
      PENDING_APPROVAL: 'permit',
      IN_FLIGHT: 'execute',
      IN_PROGRESS: 'execute',
      RETURNING: 'execute',
      POSTFLIGHT_CHECKING: 'execute',
      PENDING_REVIEW: 'done',
    } as Record<MissionStatus, MissionStage>
  )[status]
  if (flightPermitStatus === 'APPROVED' && stage === 'permit') {
    stage = 'execute'
  }
  return { current: stage, finished: false, terminal: null }
}

export function missionStageState(
  stage: MissionStage,
  progress: MissionProgress,
): StageState {
  const at = MISSION_STAGES.indexOf(stage)
  const now = MISSION_STAGES.indexOf(progress.current)
  if (progress.finished) return 'done'
  if (at < now) return 'done'
  if (at === now) return progress.terminal ? 'blocked' : 'current'
  return 'upcoming'
}

/** Mission flavour for the Mission rail: not started / in progress / finished / blocked. */
export type MissionBucket = 'finished' | 'active' | 'queued' | 'blocked'
export function missionBucket(status: MissionStatus): MissionBucket {
  if (status === 'COMPLETED') return 'finished'
  if (status === 'FAILED' || status === 'CANCELLED') return 'blocked'
  if (['PLANNING', 'CREATED', 'WAITING_DEPOSIT'].includes(status)) return 'queued'
  return 'active'
}
