import type {
  SupportAnalyticsDto,
  SupportTicketDto,
} from '../../api/supportApi'
import {
  getTopHelpfulArticles,
  getTotalHelpfulVotes,
} from '../../utils/faqAnalytics'

const IN_PROGRESS_STATUSES = ['IN_PROGRESS', 'ASSIGNED', 'WAITING_FOR_STAFF']
const RESOLVED_STATUSES = ['RESOLVED', 'CLOSED']

const isWaitingCustomer = (t: SupportTicketDto) =>
  t.status === 'WAITING_FOR_CUSTOMER' ||
  (t.status as string) === 'WAITING_CUSTOMER'

export type QueueCounts = {
  open: number
  inProgress: number
  waitingCustomer: number
  resolved: number
}

export function countQueue(tickets: SupportTicketDto[]): QueueCounts {
  return {
    open: tickets.filter((t) => t.status === 'OPEN').length,
    inProgress: tickets.filter((t) => IN_PROGRESS_STATUSES.includes(t.status))
      .length,
    waitingCustomer: tickets.filter(isWaitingCustomer).length,
    resolved: tickets.filter((t) => RESOLVED_STATUSES.includes(t.status))
      .length,
  }
}

export type SupportInsights = {
  totalHelpfulVotes: number
  deflectionRate: number
  avgResponseTimeMins: number | string
  slaComplianceRate: number | string
  topHelpfulArticles: { id: string; question: string; votesCount: number }[]
  ordersPct: number
  missionsPct: number
  mediaPct: number
}

/** FAQ deflection, SLA and category metrics (backend analytics with a local fallback). */
export function computeInsights(
  allTickets: SupportTicketDto[],
  backendAnalytics: SupportAnalyticsDto | undefined,
): SupportInsights {
  const totalHelpfulVotes =
    backendAnalytics?.totalHelpfulVotes ?? getTotalHelpfulVotes()
  const totalTicketsCount = backendAnalytics?.totalTickets ?? allTickets.length

  const deflectionRate =
    backendAnalytics?.deflectionRate ??
    (totalTicketsCount + totalHelpfulVotes > 0
      ? Math.round(
          (totalHelpfulVotes / (totalHelpfulVotes + totalTicketsCount)) * 1000,
        ) / 10
      : 0)

  let handledCount = 0
  let totalResponseMinutes = 0
  let slaMetCount = 0

  allTickets.forEach((t) => {
    let responseTimeMins: number | null = null
    if (t.messages && t.messages.length > 0) {
      const firstStaffMsg = t.messages.find(
        (m) => m.senderRole === 'STAFF' || m.senderRole === 'MANAGER',
      )
      if (firstStaffMsg) {
        const openTime = new Date(t.openedAt).getTime()
        const respTime = new Date(firstStaffMsg.createdAt).getTime()
        if (respTime >= openTime) {
          responseTimeMins = (respTime - openTime) / (1000 * 60)
        }
      }
    }
    if (responseTimeMins === null && t.resolvedAt) {
      const openTime = new Date(t.openedAt).getTime()
      const resolveTime = new Date(t.resolvedAt).getTime()
      if (resolveTime >= openTime) {
        responseTimeMins = (resolveTime - openTime) / (1000 * 60)
      }
    }

    if (responseTimeMins !== null && !isNaN(responseTimeMins)) {
      handledCount++
      totalResponseMinutes += responseTimeMins
      if (responseTimeMins <= 30) {
        slaMetCount++
      }
    }
  })

  const avgResponseTimeMins =
    backendAnalytics?.avgResponseTimeMins ??
    (handledCount > 0 ? (totalResponseMinutes / handledCount).toFixed(1) : '0')
  const slaComplianceRate =
    backendAnalytics?.slaComplianceRate ??
    (handledCount > 0 ? ((slaMetCount / handledCount) * 100).toFixed(1) : '100')

  const topHelpfulArticles =
    backendAnalytics?.topHelpfulArticles &&
    backendAnalytics.topHelpfulArticles.length > 0
      ? backendAnalytics.topHelpfulArticles.map((a) => ({
          id: a.articleId,
          question: a.articleQuestion,
          votesCount: a.votesCount,
        }))
      : getTopHelpfulArticles(3)

  const ordersCatCount = allTickets.filter(
    (t) => t.category === 'ORDERS',
  ).length
  const missionsCatCount = allTickets.filter(
    (t) => t.category === 'MISSIONS' || t.category === 'SCHEDULING',
  ).length

  const ordersPct =
    backendAnalytics?.categoryBreakdown?.ORDERS ??
    (totalTicketsCount > 0
      ? Math.round((ordersCatCount / totalTicketsCount) * 100)
      : 0)
  const missionsPct =
    backendAnalytics?.categoryBreakdown?.MISSIONS ??
    (totalTicketsCount > 0
      ? Math.round((missionsCatCount / totalTicketsCount) * 100)
      : 0)
  const mediaPct =
    backendAnalytics?.categoryBreakdown?.MEDIA ??
    (totalTicketsCount > 0 ? Math.max(0, 100 - ordersPct - missionsPct) : 0)

  return {
    totalHelpfulVotes,
    deflectionRate,
    avgResponseTimeMins,
    slaComplianceRate,
    topHelpfulArticles,
    ordersPct,
    missionsPct,
    mediaPct,
  }
}

export function filterTickets(
  allTickets: SupportTicketDto[],
  statusFilter: string,
  categoryFilter: string,
  searchQuery: string,
): SupportTicketDto[] {
  return allTickets.filter((t) => {
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'OPEN' && t.status !== 'OPEN') return false
      if (
        statusFilter === 'IN_PROGRESS' &&
        !IN_PROGRESS_STATUSES.includes(t.status)
      )
        return false
      if (statusFilter === 'WAITING_FOR_CUSTOMER' && !isWaitingCustomer(t))
        return false
      if (statusFilter === 'RESOLVED' && !RESOLVED_STATUSES.includes(t.status))
        return false
      if (
        statusFilter !== 'OPEN' &&
        statusFilter !== 'IN_PROGRESS' &&
        statusFilter !== 'WAITING_FOR_CUSTOMER' &&
        statusFilter !== 'RESOLVED' &&
        t.status !== statusFilter
      )
        return false
    }
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const match =
        t.ticketCode.toLowerCase().includes(q) ||
        t.customerName?.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.orderId && t.orderId.toLowerCase().includes(q)) ||
        (t.missionId && t.missionId.toLowerCase().includes(q))
      if (!match) return false
    }
    return true
  })
}
