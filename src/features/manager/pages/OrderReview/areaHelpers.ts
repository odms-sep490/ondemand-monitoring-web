import type { OrderDetail, LegalReviewStatus } from '../../types/orders'
import type { SavedAreaReview, AreaReviewChoice } from './areaTypes'
import { ordersApi } from '../../api/ordersApi'
import { managerHref } from '../../routes'
import { getLanguage } from '../../../../shared/i18n'
import { areaHelpersMessages } from './areaHelpers.messages'

const am = () => areaHelpersMessages[getLanguage()]

export function areaReviewFromOrder(
  order: OrderDetail,
): SavedAreaReview | null {
  if (!order.legalReviewStatus || order.legalReviewStatus === 'NOT_REVIEWED')
    return null
  const reviewedAt = order.flightAreaReviewedAt
    ? new Date(order.flightAreaReviewedAt).getTime()
    : Number.NaN
  const updatedAt = order.updatedAt
    ? new Date(order.updatedAt).getTime()
    : Number.NaN
  // A customer location correction updates the order after the verdict was
  // recorded. That verdict belongs to the old coordinates and is only history.
  if (
    order.status === 'PENDING' &&
    Number.isFinite(reviewedAt) &&
    Number.isFinite(updatedAt) &&
    updatedAt - reviewedAt > 1_000
  ) {
    return null
  }
  return {
    status: order.legalReviewStatus,
    requestedScopeFeasible: order.requestedScopeFeasible ?? null,
    reason: order.flightAreaReviewReason ?? null,
    note: order.flightAreaReviewNote ?? null,
    reviewer: order.flightAreaReviewedByName ?? null,
    reviewedAt: order.flightAreaReviewedAt ?? null,
  }
}

export const REVIEW_OPTIONS: Array<{
  status: AreaReviewChoice
  label: string
  hint: string
}> = [
  {
    status: 'NOT_REQUIRED',
    get label() {
      return am().options.notRequired.label
    },
    get hint() {
      return am().options.notRequired.hint
    },
  },
  {
    status: 'CHANGE_LOCATION',
    get label() {
      return am().options.changeLocation.label
    },
    get hint() {
      return am().options.changeLocation.hint
    },
  },
  {
    status: 'REJECTED',
    get label() {
      return am().options.rejected.label
    },
    get hint() {
      return am().options.rejected.hint
    },
  },
]

// Language-aware view over the reasons list: every read resolves against the
// current language, so the export keeps its array shape.
export const UNSUITABLE_REASONS: string[] = new Proxy([] as string[], {
  get: (_target, key) => Reflect.get(am().unsuitableReasons, key),
  has: (_target, key) => Reflect.has(am().unsuitableReasons, key),
  ownKeys: () => Reflect.ownKeys(am().unsuitableReasons),
  getOwnPropertyDescriptor: (_target, key) => {
    const descriptor = Reflect.getOwnPropertyDescriptor(
      am().unsuitableReasons,
      key,
    )
    return descriptor ? { ...descriptor, configurable: true } : undefined
  },
})

export function areaReviewLabel(status: LegalReviewStatus) {
  const labels: Record<LegalReviewStatus, string> = am().reviewLabels
  return labels[status]
}

export async function resolveUnsuitable(
  order: OrderDetail,
  review: SavedAreaReview,
  decision: 'NEED_INFO' | 'REJECTED',
  confirm: (question: {
    title: string
    body: string
    action?: string
    tone?: 'warning' | 'danger'
  }) => Promise<boolean>,
): Promise<boolean> {
  const needInfo = decision === 'NEED_INFO'
  const c = am().confirm
  const accepted = await confirm({
    title: needInfo ? c.needInfoTitle : c.rejectTitle,
    body: needInfo ? c.needInfoBody : c.rejectBody,
    action: needInfo ? c.needInfoAction : c.rejectAction,
    tone: needInfo ? 'warning' : 'danger',
  })
  if (!accepted) return false
  const reason = [review.reason, review.note].filter(Boolean).join(' — ')
  await ordersApi.submitApproval(order.id, {
    decision,
    reason,
    ...(needInfo ? { requestedUpdateScope: 'LOCATION' as const } : {}),
  })
  window.location.hash = managerHref({ screen: 'orderQueue' })
  return true
}

export function openMinistryMap(zoneCode: string) {
  window.open('https://cambay.mod.gov.vn/', '_blank', 'noopener,noreferrer')
  void navigator.clipboard?.writeText(zoneCode).catch(() => undefined)
}
