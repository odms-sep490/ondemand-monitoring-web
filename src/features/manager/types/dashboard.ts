export type DashboardSummary = {
  totalOrders: number
  totalQuoteValue: number
  pendingOrderCount: number
  pendingAdditionalChecklistCount: number
  waitingDepositCount: number
  activeMissionCount: number
  attentionRequiredCount: number
}

export type DistributionPoint = { key: string; count: number }
export type ServiceDistributionPoint = { serviceId: string; serviceName: string; count: number }
export type MissionTrendPoint = { periodStart: string; completed: number; failed: number }
export type PriceAdjustmentSummary = { approvedAtSystemPrice: number; adjustedByManager: number }

export type ActionItem = {
  id: string
  type: string
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'
  orderId?: string | null
  orderCode?: string | null
  missionId?: string | null
  checklistItemId?: string | null
  title: string
  description?: string
  status?: string
  systemCalculatedAmount?: number | null
  createdAt?: string
  actionType?: 'REVIEW_PRICING' | 'VIEW_ORDER' | 'VIEW_QUOTE' | 'VIEW_MISSION'
  ticketId?: string
  code?: string
  subtitle?: string
  submittedAtIso?: string
  scheduledStartIso?: string
  openedAtIso?: string
  createdAtIso?: string
  startedAtIso?: string
}

export type RecentOrder = {
  orderId: string
  orderCode: string
  customerName: string
  serviceName: string
  createdAt: string
  status: string
  additionalChecklistCount: number
  pendingAdditionalChecklistCount: number
  pricingState: string
}

export type PricingPipeline = {
  pricingReviewCount: number
  quoteReadyCount: number
  waitingCustomerCount: number
  waitingDepositCount: number
  depositPaidCount: number
}

export type MissionOverview = {
  scheduledCount: number
  readyCount: number
  inFlightCount: number
  returningCount: number
  completedTodayCount: number
  issueCount: number
}

export type ActiveMission = {
  missionId: string
  missionCode: string
  orderId: string
  orderCode: string
  operatorName: string | null
  droneName: string | null
  status: string
  scheduledStartAt: string
  attentionRequired: boolean
}

export type DashboardActivity = {
  id: string
  type: string
  orderId: string | null
  orderCode: string | null
  missionId: string | null
  description: string
  occurredAt: string
}

export type MissionStatusDayPoint = {
  date: string
  completed: number
  inFlight: number
  failed: number
  cancelled: number
}

export type DroneStatusBreakdown = {
  status: import('../../../shared/types/domain').DroneStatus
  count: number
}

export type ManagerDashboardData = {
  summary: DashboardSummary
  orderStatusDistribution: DistributionPoint[]
  serviceDistribution: ServiceDistributionPoint[]
  additionalServiceDistribution: DistributionPoint[]
  priceAdjustmentSummary: PriceAdjustmentSummary
  missionStatusDistribution: DistributionPoint[]
  missionTrend: MissionTrendPoint[]
  actionItems: ActionItem[]
  recentOrders: RecentOrder[]
  pricingPipeline: PricingPipeline
  missionOverview: MissionOverview
  activeMissions: ActiveMission[]
  recentActivities: DashboardActivity[]
  generatedAt: string
}

export type ManagerDashboardResponse = Partial<ManagerDashboardData> & {
  kpis?: {
    pendingOrders: { count: number; detail: string }
    missionsToday: { count: number; detail: string }
    missionsInFlight: { count: number; detail: string }
    dronesReady: { ready: number; total: number; detail: string }
    actionItems: { count: number; detail: string }
  }
  missionStatusByDay?: MissionStatusDayPoint[]
  droneStatusBreakdown?: DroneStatusBreakdown[]
  flyingMission?: unknown
  navCounts?: {
    pendingOrders: number
    openMaintenanceTickets: number
    mediaNeedsAction: number
  }
}
