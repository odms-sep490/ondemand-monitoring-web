import type { MissionPaymentAllocation, MissionPaymentMilestone } from './types'

/**
 * Returns whether a mission payment milestone has been handed over to the customer
 * and is eligible to appear in customer-facing payment views.
 */
export function isHandedOverMissionMilestone(
  milestone: MissionPaymentMilestone,
): boolean {
  return (
    milestone.handedOverAt != null &&
    Number.isFinite(Date.parse(milestone.handedOverAt)) &&
    milestone.status !== 'NOT_YET_DUE'
  )
}

/**
 * Extracts handed-over mission milestones from a payment allocation payload.
 */
export function getHandedOverMissionMilestones(
  allocation: MissionPaymentAllocation | null,
): MissionPaymentMilestone[] {
  return allocation?.milestones.filter(isHandedOverMissionMilestone) ?? []
}

/**
 * Checks whether a milestone currently has an active redirect checkout session.
 */
export function hasActiveMissionCheckout(
  milestone: MissionPaymentMilestone,
): boolean {
  return Boolean(
    milestone.status === 'PENDING' &&
      milestone.payments.some(
        (payment) =>
          (payment.status === 'PENDING' || payment.status === 'PROCESSING') &&
          Boolean(payment.paymentUrl),
      ),
  )
}

/**
 * Checks whether the customer can initiate or resume payment for a milestone.
 */
export function canPayMissionMilestone(
  milestone: MissionPaymentMilestone,
): boolean {
  return milestone.status === 'UNPAID' || hasActiveMissionCheckout(milestone)
}

/**
 * Finds handed-over milestones still awaiting payment for a specific mission (or order scope).
 */
export function getActionableHandedOverMilestones(
  allocation: MissionPaymentAllocation | null,
  missionId?: string,
): MissionPaymentMilestone[] {
  const handedOver = getHandedOverMissionMilestones(allocation)
  const scoped = missionId
    ? handedOver.filter((milestone) => milestone.missionId === missionId)
    : handedOver
  return scoped.filter(
    (milestone) =>
      milestone.status === 'UNPAID' ||
      milestone.status === 'PENDING' ||
      milestone.status === 'EXPIRED',
  )
}
