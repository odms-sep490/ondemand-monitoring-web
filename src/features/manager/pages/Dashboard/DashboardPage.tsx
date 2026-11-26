import { Skeleton, Tabs } from 'antd'
import { lazy, Suspense, useState } from 'react'
import { StateView } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { managerApi } from '../../api/dashboardApi'
import '../../manager.css'
import './dashboard.scss'
import { dashboardPageMessages } from './DashboardPage.messages'
import {
  DashboardHeader,
  type DashboardRange,
} from './components/DashboardHeader'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import { DashboardFinancePanel } from './components/DashboardFinancePanel'
import { KpiRow } from './components/KpiRow'
import type { DashboardKpiAvailability } from './components/KpiRow'
import { ActionListCard } from './components/ActionListCard'
import { RecentOrdersCard } from './components/RecentOrdersCard'
import { PipelineCard, RecentActivityCard } from './components/SideCards'
import {
  AnalyticsCharts,
  MissionTrendCard,
  OrderStatusCard,
} from './components/AnalyticsCharts'
import { ReferenceMissionPanel } from './components/ReferenceMissionPanel'
import { formatDashboardDate } from './dashboardHelpers'
import type {
  ManagerDashboardData,
  ManagerDashboardResponse,
} from '../../types/dashboard'

const ResourceLifecyclePage = lazy(() =>
  import('../../../resource-lifecycle').then((m) => ({
    default: m.ResourceLifecyclePage,
  })),
)

function normalizeDashboard(
  data: ManagerDashboardResponse,
): ManagerDashboardData {
  return {
    summary: data.summary ?? {
      totalOrders: 0,
      totalQuoteValue: 0,
      pendingOrderCount: data.kpis?.pendingOrders.count ?? 0,
      pendingAdditionalChecklistCount: 0,
      waitingDepositCount: data.pricingPipeline?.waitingDepositCount ?? 0,
      activeMissionCount:
        data.kpis?.missionsInFlight?.count ??
        data.missionOverview?.inFlightCount ??
        0,
      attentionRequiredCount: data.kpis?.actionItems.count ?? 0,
    },
    orderStatusDistribution: Array.isArray(data.orderStatusDistribution)
      ? data.orderStatusDistribution
      : [],
    serviceDistribution: Array.isArray(data.serviceDistribution)
      ? data.serviceDistribution
      : [],
    additionalServiceDistribution: Array.isArray(
      data.additionalServiceDistribution,
    )
      ? data.additionalServiceDistribution
      : [],
    priceAdjustmentSummary: data.priceAdjustmentSummary ?? {
      approvedAtSystemPrice: 0,
      adjustedByManager: 0,
    },
    missionStatusDistribution: Array.isArray(data.missionStatusDistribution)
      ? data.missionStatusDistribution
      : [],
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
    activeMissions: Array.isArray(data.activeMissions)
      ? data.activeMissions
      : [],
    recentActivities: Array.isArray(data.recentActivities)
      ? data.recentActivities
      : [],
    generatedAt: data.generatedAt ?? new Date().toISOString(),
  }
}

export function DashboardPage() {
  const { t, lang } = useI18n(dashboardPageMessages)
  const [range, setRange] = useState<DashboardRange>('30D')
  const query = useApiQuery(
    (signal) => managerApi.getDashboard(range, signal),
    [range],
  )

  if (query.loading) return <DashboardSkeleton t={t} />
  if (query.error) {
    return (
      <StateView
        state="error"
        title={t.loadError}
        error={query.error}
        onRetry={query.reload}
      />
    )
  }
  if (!query.data) return null

  const response = query.data
  const data = normalizeDashboard(response)
  const availability: DashboardKpiAvailability = {
    pendingReview:
      response.summary !== undefined ||
      response.kpis?.pendingOrders !== undefined,
    waitingQuote: response.pricingPipeline !== undefined,
    waitingDeposit:
      response.summary !== undefined || response.pricingPipeline !== undefined,
    activeMissions:
      response.summary !== undefined ||
      response.kpis?.missionsInFlight !== undefined ||
      response.missionOverview !== undefined,
    completed: response.missionTrend !== undefined,
  }
  return (
    <div className="mgr-dash">
      <DashboardHeader
        subtitle={`${t.generatedAt}: ${formatDashboardDate(data.generatedAt)}`}
        range={range}
        pendingCount={data.summary.pendingOrderCount}
        pendingCountAvailable={availability.pendingReview}
        onRangeChange={setRange}
        onRefresh={query.reload}
      />

      <KpiRow data={data} availability={availability} />
      <Tabs
        className="mgr-dashboard-groups"
        defaultActiveKey="operations"
        items={[
          {
            key: 'operations',
            label: lang === 'vi' ? 'Điều hành nhiệm vụ' : 'Mission operations',
            children: (
              <section className="mgr-dashboard-group">
                <div className="mgr-group-grid">
                  <ReferenceMissionPanel
                    missions={response.activeMissions}
                    overview={response.missionOverview}
                  />
                  <ActionListCard
                    items={data.actionItems.filter(
                      (item) => item.type !== 'QUOTE_READY',
                    )}
                    itemsAvailable={response.actionItems !== undefined}
                    generatedAt={data.generatedAt}
                  />
                </div>
                <div className="mgr-dashboard-overview-charts">
                  <OrderStatusCard
                    data={data}
                    available={response.orderStatusDistribution !== undefined}
                  />
                  <MissionTrendCard
                    data={data}
                    available={availability.completed}
                  />
                </div>
              </section>
            ),
          },
          {
            key: 'finance',
            label:
              lang === 'vi'
                ? 'Tài chính & giao dịch'
                : 'Finance & transactions',
            children: (
              <section className="mgr-dashboard-group">
                <DashboardFinancePanel
                  finance={response.finance}
                  days={Number(range.replace('D', ''))}
                  onDaysChange={(days) =>
                    setRange(`${days}D` as DashboardRange)
                  }
                  generatedAt={data.generatedAt}
                />
              </section>
            ),
          },
          {
            key: 'orders',
            label: lang === 'vi' ? 'Đơn hàng & báo giá' : 'Orders & quotes',
            children: (
              <section className="mgr-dashboard-group">
                <div className="mgr-group-grid mgr-group-orders">
                  <RecentOrdersCard
                    className="mgr-recent-orders-card"
                    orders={data.recentOrders}
                    ordersAvailable={response.recentOrders !== undefined}
                  />
                  <PipelineCard
                    pipeline={data.pricingPipeline}
                    available={response.pricingPipeline !== undefined}
                  />
                </div>
                <AnalyticsCharts
                  data={data}
                  scope="orders"
                  available={
                    response.orderStatusDistribution !== undefined ||
                    response.serviceDistribution !== undefined ||
                    response.priceAdjustmentSummary !== undefined
                  }
                />
              </section>
            ),
          },
          {
            key: 'activity',
            label: lang === 'vi' ? 'Hoạt động gần đây' : 'Recent activity',
            children: (
              <RecentActivityCard
                className="mgr-activity-card"
                activities={data.recentActivities}
                activitiesAvailable={response.recentActivities !== undefined}
              />
            ),
          },
          {
            key: 'droneLifecycle',
            label:
              lang === 'vi' ? 'Quản lý nguồn lực' : 'Resource management',
            children: (
              <section className="mgr-dashboard-group">
                <Suspense fallback={<Skeleton active paragraph={{ rows: 5 }} />}>
                  <ResourceLifecyclePage embedded />
                </Suspense>
              </section>
            ),
          },
        ]}
      />
    </div>
  )
}
