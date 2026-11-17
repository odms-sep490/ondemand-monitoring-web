import type { ReactNode } from 'react'
import { Button, DatePicker } from 'antd'
import { useState } from 'react'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { ManagerDashboardData } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { statusLabel } from '../dashboardHelpers'
import { BarChartCard } from './charts/BarChartCard'
import { DonutChart } from './charts/DonutChart'
import { RadarStatusChart } from './charts/RadarStatusChart'
import { StackedBarChart } from './charts/StackedBarChart'

function getOrderStatusPoints(
  data: ManagerDashboardData,
  labels: (typeof dashboardPageMessages)['vi']['analytics'],
) {
  return data.orderStatusDistribution.map((point) => ({
    label: labels.statusLabels[point.key] ?? statusLabel(point.key),
    value: point.count,
  }))
}

export function OrderStatusCard({
  data,
  available,
}: {
  data: ManagerDashboardData
  available: boolean
}) {
  const { t } = useI18n(dashboardPageMessages)
  const analytics = t.analytics
  const points = getOrderStatusPoints(data, analytics)

  return (
    <CardComponent
      className="mgr-order-status-card"
      title={analytics.orderStatusTitle}
    >
      {!available ? (
        <p className="mgr-chart-empty" role="status">
          {analytics.unavailable}
        </p>
      ) : (
        <DonutChart
          points={points}
          empty={analytics.orderStatusEmpty}
          ariaLabel={analytics.totalAria}
        />
      )}
    </CardComponent>
  )
}

export function MissionTrendCard({
  data,
  available,
}: {
  data: ManagerDashboardData
  available: boolean
}) {
  const { t, locale } = useI18n(dashboardPageMessages)
  const analytics = t.analytics
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)
  const vi = locale.startsWith('vi')
  const points = data.missionTrend
    .filter((point) => {
      if (!dateRange) return true
      const day = point.periodStart.slice(0, 10)
      return day >= dateRange[0] && day <= dateRange[1]
    })
    .map((point) => ({
      label: new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
      }).format(new Date(point.periodStart)),
      completed: point.completed,
      failed: point.failed,
    }))

  return (
    <CardComponent
      className="mgr-mission-trend-card"
      title={vi ? 'Nhiệm vụ theo ngày' : 'Missions by day'}
      extra={
        <DatePicker.RangePicker
          size="small"
          allowClear
          format="DD/MM/YYYY"
          placeholder={vi ? ['Từ ngày', 'Đến ngày'] : ['From', 'To']}
          onChange={(dates) =>
            setDateRange(
              dates?.[0] && dates[1]
                ? [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]
                : null,
            )
          }
        />
      }
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
        <StackedBarChart
          data={points}
          dataKeys={[
            {
              key: 'completed',
              label: analytics.trendCompleted,
              color: '#1565e8',
            },
            {
              key: 'failed',
              label: analytics.trendFailed,
              color: '#94a3b8',
            },
          ]}
          empty={analytics.trendEmpty}
          ariaLabel={analytics.overTime(analytics.trendCompleted)}
        />
      )}
    </CardComponent>
  )
}

export function AnalyticsCharts({
  data,
  available,
  scope,
}: {
  data: ManagerDashboardData
  available: boolean
  scope?: 'orders'
}) {
  const { t } = useI18n(dashboardPageMessages)
  const c = t.analytics
  const [open, setOpen] = useState(true)
  const adj = data.priceAdjustmentSummary
  const adjTotal = adj.approvedAtSystemPrice + adj.adjustedByManager
  const orderStatusPoints = getOrderStatusPoints(data, c)
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
      <OrderStatusCard key="order-status" data={data} available={available} />,
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

  if (
    scope !== 'orders' &&
    missionStatusPoints.some((point) => point.value > 0)
  ) {
    charts.push(
      <CardComponent key="mission-status" title={c.missionStatusTitle}>
        {missionStatusPoints.filter((point) => point.value > 0).length >= 3 ? (
          <RadarStatusChart
            points={missionStatusPoints}
            empty={c.missionStatusEmpty}
            ariaLabel={c.missionStatusTitle}
          />
        ) : (
          <DonutChart
            points={missionStatusPoints}
            empty={c.missionStatusEmpty}
            ariaLabel={c.totalAria}
          />
        )}
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
