import type { MissionStatus, OrderStatus } from '../../../../shared/types/domain'
import type { OrderStep, OrderStepKey, OrderStepState, OrderTimelineEvent } from './types'

const HAPPY_PATH: OrderStepKey[] = [
  'submitted',
  'approved',
  'quote',
  'deposit',
  'planning',
  'inProgress',
  'completed',
]

export type OrderFinanceProgress = {
  loading?: boolean
  quote?: { status: string; approvedAt: string | null; acceptedAt: string | null } | null
  invoice?: { depositAmount: number; paidAmount: number; issuedAt: string } | null
}

export type OrderMissionProgress = {
  status: MissionStatus
  scheduledStartAt: string | null
}

const PLANNING_COMPLETED_STATUSES = new Set<MissionStatus>([
  'WAITING_CREW_CONFIRMATION',
  'WAITING_OPERATOR_ACCEPTANCE',
  'SCHEDULED',
  'CONNECTED',
  'PREFLIGHT_CHECKING',
  'READY_TO_FLY',
  'FAILED_PREFLIGHT',
  'PENDING_APPROVAL',
  'IN_FLIGHT',
  'IN_PROGRESS',
  'RETURNING',
  'POSTFLIGHT_CHECKING',
  'PENDING_REVIEW',
  'COMPLETED',
])

/** Index of the current happy-path step per status; `HAPPY_PATH.length` means all done. */
const CURRENT_INDEX: Partial<Record<OrderStatus, number>> = {
  SUBMITTED: 1,
  PENDING: 1,
  NEEDS_INFO: 1,
  SCHEDULED: 4,
  IN_PROGRESS: 5,
  COMPLETED: HAPPY_PATH.length,
}

/** The timeline event that proves a given step, if the BE returned one. */
function eventFor(key: OrderStepKey, events: OrderTimelineEvent[]): OrderTimelineEvent | undefined {
  switch (key) {
    case 'submitted':
      return events.find((e) => e.kind === 'created')
    case 'approved':
      return events.find((e) => e.kind === 'approved')
    case 'rejected':
      return events.find((e) => e.kind === 'rejected')
    case 'inProgress':
      return events.find((e) => e.kind === 'status' && e.status === 'IN_PROGRESS')
    case 'completed':
      return events.find((e) => e.kind === 'status' && e.status === 'COMPLETED')
    case 'cancelled':
      return events.find((e) => e.kind === 'status' && e.status === 'CANCELLED')
  }
}

function step(
  key: OrderStepKey,
  state: OrderStepState,
  events: OrderTimelineEvent[],
  finance?: OrderFinanceProgress,
  missions: OrderMissionProgress[] = [],
): OrderStep {
  const event = eventFor(key, events)
  const financialDate =
    key === 'quote'
      ? finance?.quote?.acceptedAt ?? finance?.quote?.approvedAt
      : key === 'deposit'
        ? finance?.invoice?.issuedAt
        : null
  const planningDate = key === 'planning'
    ? missions
        .filter((mission) => mission.scheduledStartAt && PLANNING_COMPLETED_STATUSES.has(mission.status))
        .map((mission) => mission.scheduledStartAt!)
        .sort()[0] ?? null
    : null
  return { key, state, at: event?.at ?? financialDate ?? planningDate, actor: event?.actor ?? null, note: event?.note ?? null }
}

/**
 * Ordered progress steps for an order: submitted, approved, in progress, completed.
 * REJECTED and CANCELLED end the path with a terminal step and nothing upcoming; for those
 * only the steps the events prove are listed. Draft-like statuses have no progress yet.
 * Dates, actors and notes are copied from the events and never invented.
 */
export function buildOrderSteps(
  status: OrderStatus,
  events: OrderTimelineEvent[],
  finance?: OrderFinanceProgress,
  missions: OrderMissionProgress[] = [],
): OrderStep[] {
  if (status === 'REJECTED') {
    return [step('submitted', 'done', events), step('rejected', 'failed', events)]
  }
  if (status === 'CANCELLED') {
    const reached: OrderStep[] = []
    if (eventFor('submitted', events)) reached.push(step('submitted', 'done', events))
    if (eventFor('approved', events)) reached.push(step('approved', 'done', events))
    return [...reached, step('cancelled', 'cancelled', events)]
  }
  let current = CURRENT_INDEX[status]
  if (status === 'APPROVED') {
    if (!finance?.invoice) current = 2
    else if (finance.invoice.paidAmount < finance.invoice.depositAmount) current = 3
    else current = 4
  }
  const planningCompleted = missions.some(
    (mission) => Boolean(mission.scheduledStartAt) && PLANNING_COMPLETED_STATUSES.has(mission.status),
  )
  if (planningCompleted && current === 4) current = 5
  if (current === undefined) return []
  return HAPPY_PATH.map((key, index) =>
    step(key, index < current ? 'done' : index === current ? 'current' : 'upcoming', events, finance, missions),
  )
}
