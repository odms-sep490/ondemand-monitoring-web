import { useState } from 'react'
import { StateView } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { managerApi } from '../../api/dashboardApi'
import '../../manager.css'
import { dashboardPageMessages } from './DashboardPage.messages'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import { KpiRow } from './components/KpiRow'
import { ActionListCard } from './components/ActionListCard'
import { OperationalSections } from './components/OperationalSections'
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
  const { t, lang } = useI18n(dashboardPageMessages)
  const [range, setRange] = useState<'7D' | '30D' | '90D'>('30D')
  const query = useApiQuery((signal) => managerApi.getDashboard(range, signal), [range])

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

  const data = normalizeDashboard(query.data)
  return (
    <div className="odm-mgr-dash">
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">{t.title}</h1>
          <span className="odm-visually-hidden">
            {lang === 'vi' ? 'Dashboard điều hành' : 'Operations dashboard'}
          </span>
          <p className="odm-mgr-dash-subtitle">{t.subtitle}</p>
          <div className="odm-mgr-dash-date">
            {t.lastUpdated}: {formatDashboardDate(data.generatedAt)}
          </div>
        </div>
        <div className="odm-mgr-dashboard-controls">
          <div className="odm-mgr-range" role="group" aria-label="Khoảng thời gian phân tích">
            {(['7D', '30D', '90D'] as const).map((value) => (
              <button key={value} type="button" className={range === value ? 'is-active' : ''}
                aria-pressed={range === value} onClick={() => setRange(value)}>
                {value === '7D' ? '7 ngày' : value === '30D' ? '30 ngày' : '90 ngày'}
              </button>
            ))}
          </div>
          <button type="button" className="odm-btn" onClick={query.reload}>{t.refresh}</button>
        </div>
      </div>

      <KpiRow data={data} />
      <AnalyticsCharts data={data} />
      <ActionListCard items={data.actionItems} />
      <OperationalSections data={data} />
    </div>
  )
}
