import { getLanguage } from '../../../../shared/i18n'
import type { ActionItem, ManagerDashboardData } from '../../types/dashboard'
import type { ManagerRoute } from '../../routes'

export function actionItemRoute(item: ActionItem): ManagerRoute {
  if (item.actionType === 'VIEW_MISSION' && item.missionId) {
    return { screen: 'missionDetail', missionId: item.missionId }
  }
  if (item.orderId) return { screen: 'orderReview', orderId: item.orderId }
  if (item.type === 'MAINTENANCE_TICKET') return { screen: 'maintenance' }
  return { screen: 'dashboard' }
}

export function statusLabel(status: string): string {
  return status.replaceAll('_', ' ')
}

export function formatDashboardDate(value: string): string {
  return new Intl.DateTimeFormat(getLanguage() === 'en' ? 'en-US' : 'vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

/** Defaults null/omitted backend fields so rendering never dereferences null. */
export function normalizeDashboard(
  raw: Partial<Record<keyof ManagerDashboardData, unknown>> | ManagerDashboardData,
): ManagerDashboardData {
  const r = raw as Record<string, unknown>
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
  const obj = <T extends object>(v: unknown, empty: T): T => ({
    ...empty,
    ...((v && typeof v === 'object' ? v : {}) as Partial<T>),
  })
  return {
    summary: obj(r.summary, {
      totalOrders: 0,
      totalQuoteValue: 0,
      pendingOrderCount: 0,
      pendingAdditionalChecklistCount: 0,
      waitingDepositCount: 0,
      activeMissionCount: 0,
      attentionRequiredCount: 0,
    }),
    orderStatusDistribution: arr(r.orderStatusDistribution),
    serviceDistribution: arr(r.serviceDistribution),
    additionalServiceDistribution: arr(r.additionalServiceDistribution),
    priceAdjustmentSummary: obj(r.priceAdjustmentSummary, {
      approvedAtSystemPrice: 0,
      adjustedByManager: 0,
    }),
    missionStatusDistribution: arr(r.missionStatusDistribution),
    missionTrend: arr(r.missionTrend),
    actionItems: arr(r.actionItems),
    recentOrders: arr(r.recentOrders),
    pricingPipeline: obj(r.pricingPipeline, {
      pricingReviewCount: 0,
      quoteReadyCount: 0,
      waitingCustomerCount: 0,
      waitingDepositCount: 0,
      depositPaidCount: 0,
    }),
    missionOverview: obj(r.missionOverview, {
      scheduledCount: 0,
      readyCount: 0,
      inFlightCount: 0,
      returningCount: 0,
      completedTodayCount: 0,
      issueCount: 0,
    }),
    activeMissions: arr(r.activeMissions),
    recentActivities: arr(r.recentActivities),
    generatedAt: typeof r.generatedAt === 'string' ? r.generatedAt : new Date().toISOString(),
  }
}

/** Relative age ("2 giờ trước") measured against the time the snapshot was generated. */
export function formatAge(value: string | undefined, reference: string, locale: string, nowLabel: string): string {
  if (!value) return ''
  const diffMs = new Date(reference).getTime() - new Date(value).getTime()
  if (Number.isNaN(diffMs)) return ''
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return nowLabel
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  if (minutes < 1440) return rtf.format(-Math.floor(minutes / 60), 'hour')
  return rtf.format(-Math.floor(minutes / 1440), 'day')
}

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

export function orderStatusTone(status: string): BadgeTone {
  if (status === 'COMPLETED' || status === 'APPROVED') return 'success'
  if (status === 'PENDING' || status === 'NEEDS_INFO') return 'warning'
  if (status === 'REJECTED' || status === 'CANCELLED') return 'danger'
  if (status === 'IN_PROGRESS') return 'info'
  return 'neutral'
}

/** Groups action items by their `type`, keeping first-seen order of the types. */
export function groupActionItems(items: ActionItem[]): { type: string; items: ActionItem[] }[] {
  const groups = new Map<string, ActionItem[]>()
  for (const item of items) {
    const list = groups.get(item.type)
    if (list) list.push(item)
    else groups.set(item.type, [item])
  }
  return [...groups].map(([type, list]) => ({ type, items: list }))
}
