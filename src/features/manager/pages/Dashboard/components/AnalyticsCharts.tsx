import type { ReactNode } from 'react'
import { Button } from 'antd'
import { useState } from 'react'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { ManagerDashboardData } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { statusLabel } from '../dashboardHelpers'
import { BarChartCard } from './charts/BarChartCard'
import { DonutChart } from './charts/DonutChart'
import { TrendLineChart } from './charts/TrendLineChart'

export function MissionTrendCard({
  data,
  available,
}: {
  data: ManagerDashboardData
  available: boolean
}) {
  const { t, locale } = useI18n(dashboardPageMessages)
  const analytics = t.analytics
  const points = data.missionTrend.map((point) => ({
    x: point.periodStart,
    completed: point.completed,
    failed: point.failed,
  }))

  return (
    <CardComponent
      className="mgr-mission-trend-card"
      title={analytics.trendTitle}
    >
      {!available ? (
        <p className="mgr-chart-empty" role="status">
          {analytics.unavailable}
        </p>
      ) : points.length === 0 ? (
        <p className="mgr-chart-empty" role="status">
          {analytics.trendEmpty}
        </p>
      ) : (
        <TrendLineChart
          points={points}
          completedLabel={analytics.trendCompleted}
          failedLabel={analytics.trendFailed}
          empty={analytics.trendEmpty}
          locale={locale}
          ariaLabel={analytics.overTime(analytics.trendCompleted)}
        />
      )}
    </CardComponent>
  )
}

export function AnalyticsCharts({
  data,
  available,
}: {
  data: ManagerDashboardData
  available: boolean
}) {
  const { t } = useI18n(dashboardPageMessages)
  const c = t.analytics
  const [open, setOpen] = useState(true)
  const adj = data.priceAdjustmentSummary
  const adjTotal = adj.approvedAtSystemPrice + adj.adjustedByManager
  const orderStatusPoints = data.orderStatusDistribution.map((p) => ({
    label: c.statusLabels[p.key] ?? statusLabel(p.key),
    value: p.count,
  }))
  const additionalServicePoints = data.additionalServiceDistribution.map(
    (p) => ({
      label: c.statusLabels[p.key] ?? statusLabel(p.key),
      value: p.count,
    }),
  )
  const missionStatusPoints = data.missionStatusDistribution.map((p) => ({
    label: c.statusLabels[p.key] ?? statusLabel(p.key),
    value: p.count,
  }))
  const charts: ReactNode[] = []
  const hasOrderStatusData = orderStatusPoints.some((point) => point.value > 0)
  const servicePoints = data.serviceDistribution.map((point) => ({
    label: point.serviceName,
    value: point.count,
  }))
  const hasServiceData = servicePoints.some((point) => point.value > 0)

  if (hasOrderStatusData) {
    charts.push(
      <CardComponent key="order-status" title={c.orderStatusTitle}>
        <DonutChart
          points={orderStatusPoints}
          empty={c.orderStatusEmpty}
          ariaLabel={c.totalAria}
        />
      </CardComponent>,
    )
  }

  if (hasServiceData) {
    charts.push(
      <CardComponent key="services" title={c.servicesTitle}>
        <BarChartCard
          points={servicePoints}
          empty={c.servicesEmpty}
          ariaLabel={c.barAria}
        />
      </CardComponent>,
    )
  }

  if (adjTotal > 0) {
    charts.push(
      <CardComponent key="price-adjustments" title={c.adjustmentTitle}>
        <BarChartCard
          points={[
            { label: c.adjustmentSystem, value: adj.approvedAtSystemPrice },
            { label: c.adjustmentManager, value: adj.adjustedByManager },
          ]}
          empty={c.adjustmentEmpty}
          ariaLabel={c.barAria}
        />
        <div className="mgr-adjust-note">
          <strong>
            {Math.round((adj.adjustedByManager * 100) / adjTotal)}%
          </strong>{' '}
          {c.adjustmentManager}
        </div>
      </CardComponent>,
    )
  }

  if (additionalServicePoints.some((point) => point.value > 0)) {
    charts.push(
      <CardComponent
        key="additional-services"
        title={c.additionalServicesTitle}
      >
        <DonutChart
          points={additionalServicePoints}
          empty={c.additionalServicesEmpty}
          ariaLabel={c.totalAria}
        />
      </CardComponent>,
    )
  }

  if (missionStatusPoints.some((point) => point.value > 0)) {
    charts.push(
      <CardComponent key="mission-status" title={c.missionStatusTitle}>
        <DonutChart
          points={missionStatusPoints}
          empty={c.missionStatusEmpty}
          ariaLabel={c.totalAria}
        />
      </CardComponent>,
    )
  }

  return (
    <section
      aria-labelledby="mgr-dashboard-analytics-title"
      className="mgr-analytics"
    >
      <div className="mgr-analytics-heading">
        <h2 className="mgr-section-title" id="mgr-dashboard-analytics-title">
          {c.title}
        </h2>
        <Button
          size="small"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? c.collapse : c.expand}
        </Button>
      </div>
      {open ? (
        charts.length > 0 ? (
          <div className="mgr-analytics-list">{charts}</div>
        ) : (
          <p className="mgr-empty-line mgr-analytics-empty" role="status">
            {available ? c.emptySummary : c.unavailable}
          </p>
        )
      ) : null}
    </section>
  )
}
