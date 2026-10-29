import { useState } from 'react'
import { StateView } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { managerApi } from '../../api/dashboardApi'
import '../../manager.css'
import './dashboard.scss'
import { dashboardPageMessages } from './DashboardPage.messages'
import { DashboardHeader, type DashboardRange } from './components/DashboardHeader'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import { KpiRow } from './components/KpiRow'
import { ActionListCard } from './components/ActionListCard'
import { RecentOrdersCard } from './components/RecentOrdersCard'
import { ActiveMissionsCard, PipelineCard, RecentActivityCard } from './components/SideCards'
import { AnalyticsCharts } from './components/AnalyticsCharts'
import { formatDashboardDate } from './dashboardHelpers'
import type {
  ManagerDashboardData,
  ManagerDashboardResponse,
} from '../../types/dashboard'

function normalizeDashboard(data: ManagerDashboardResponse): ManagerDashboardData {
  return {
    summary: data.summary ?? {
      totalOrders: 0,
      totalQuoteValue: 0,
      pendingOrderCount: data.kpis?.pendingOrders.count ?? 0,
      pendingAdditionalChecklistCount: 0,
      waitingDepositCount: 0,
      activeMissionCount: data.kpis?.missionsInFlight.count ?? 0,
      attentionRequiredCount: data.kpis?.actionItems.count ?? 0,
    },
    orderStatusDistribution: Array.isArray(data.orderStatusDistribution) ? data.orderStatusDistribution : [],
    serviceDistribution: Array.isArray(data.serviceDistribution) ? data.serviceDistribution : [],
    additionalServiceDistribution: Array.isArray(data.additionalServiceDistribution) ? data.additionalServiceDistribution : [],
    priceAdjustmentSummary: data.priceAdjustmentSummary ?? { approvedAtSystemPrice: 0, adjustedByManager: 0 },
    missionStatusDistribution: Array.isArray(data.missionStatusDistribution) ? data.missionStatusDistribution : [],
    missionTrend: Array.isArray(data.missionTrend) ? data.missionTrend : [],
    actionItems: Array.isArray(data.actionItems) ? data.actionItems : [],
    recentOrders: Array.isArray(data.recentOrders) ? data.recentOrders : [],
    pricingPipeline: data.pricingPipeline ?? {
      pricingReviewCount: 0,
      quoteReadyCount: 0,
      waitingCustomerCount: 0,
      waitingDepositCount: 0,
      depositPaidCount: 0,
    },
    missionOverview: data.missionOverview ?? {
      scheduledCount: 0,
      readyCount: 0,
      inFlightCount: data.kpis?.missionsInFlight.count ?? 0,
      returningCount: 0,
      completedTodayCount: 0,
      issueCount: 0,
    },
    activeMissions: Array.isArray(data.activeMissions) ? data.activeMissions : [],
    recentActivities: Array.isArray(data.recentActivities) ? data.recentActivities : [],
    generatedAt: data.generatedAt ?? new Date().toISOString(),
  }
}

export function DashboardPage() {
  const { t } = useI18n(dashboardPageMessages)
  const [range, setRange] = useState<DashboardRange>('30D')
  const query = useApiQuery((signal) => managerApi.getDashboard(range, signal), [range])

  if (query.loading) return <DashboardSkeleton t={t} />
  if (query.error) {
    return (
      <StateView state="error" title={t.loadError} error={query.error} onRetry={query.reload} />
    )
  }
  if (!query.data) return null

  const data = normalizeDashboard(query.data)
  return (
    <div className="mgr-dash">
      <DashboardHeader
        subtitle={`${t.generatedAt}: ${formatDashboardDate(data.generatedAt)}`}
        range={range}
        pendingCount={data.summary.pendingOrderCount}
        onRangeChange={setRange}
        onRefresh={query.reload}
      />

      <KpiRow data={data} />

      <div className="mgr-pair">
        <ActiveMissionsCard missions={data.activeMissions} />
        <RecentActivityCard activities={data.recentActivities} />
      </div>

      <PipelineCard pipeline={data.pricingPipeline} />

      <div className="mgr-columns">
        <ActionListCard items={data.actionItems} generatedAt={data.generatedAt} />
        <RecentOrdersCard orders={data.recentOrders} />
      </div>

      <AnalyticsCharts data={data} />
    </div>
  )
}
