import {
  AreaChartOutlined,
  PieChartOutlined,
  BarChartOutlined,
  PercentageOutlined,
} from '@ant-design/icons'
import { Button, Empty } from 'antd'
import { useState } from 'react'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { ManagerDashboardData } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { statusLabel } from '../dashboardHelpers'
import { BarChartCard } from './charts/BarChartCard'
import { DonutChart } from './charts/DonutChart'
import { TrendLineChart } from './charts/TrendLineChart'

export function AnalyticsCharts({ data }: { data: ManagerDashboardData }) {
  const { t, locale } = useI18n(dashboardPageMessages)
  const c = t.analytics
  const [open, setOpen] = useState(true)
  const adj = data.priceAdjustmentSummary
  const adjTotal = adj.approvedAtSystemPrice + adj.adjustedByManager
  const pricingTotal = Object.values(data.pricingPipeline).reduce<number>(
    (a, v) => a + (typeof v === 'number' ? v : 0),
    0,
  )
  const cells = [
    {
      key: 'trend',
      hasData: data.missionTrend.length > 0,
      span: 8,
      node: (
        <CardComponent title={c.trendTitle} icon={<AreaChartOutlined />}>
          <TrendLineChart
            points={data.missionTrend.map((p) => ({
              x: p.periodStart,
              completed: p.completed,
              failed: p.failed,
            }))}
            completedLabel={c.trendCompleted}
            failedLabel={c.trendFailed}
            empty={c.trendEmpty}
            locale={locale}
            ariaLabel={c.overTime(c.trendCompleted)}
          />
        </CardComponent>
      ),
    },
    {
      key: 'orderStatus',
      hasData: data.orderStatusDistribution.length > 0,
      span: 4,
      node: (
        <CardComponent
          title={c.orderStatusTitle}
          icon={<PieChartOutlined />}
          tone="violet"
        >
          <DonutChart
            points={data.orderStatusDistribution.map((p) => ({
              label: c.statusLabels[p.key] ?? statusLabel(p.key),
              value: p.count,
            }))}
            empty={c.orderStatusEmpty}
            ariaLabel={c.totalAria}
          />
        </CardComponent>
      ),
    },
    {
      key: 'services',
      hasData: data.serviceDistribution.length > 0,
      span: 6,
      node: (
        <CardComponent
          title={c.servicesTitle}
          icon={<BarChartOutlined />}
          tone="green"
        >
          <BarChartCard
            points={data.serviceDistribution.map((p) => ({
              label: p.serviceName,
              value: p.count,
            }))}
            empty={c.servicesEmpty}
            ariaLabel={c.barAria}
          />
        </CardComponent>
      ),
    },
    {
      key: 'adjustment',
      hasData: adjTotal > 0,
      span: 6,
      node: (
        <CardComponent
          title={c.adjustmentTitle}
          icon={<PercentageOutlined />}
          tone="amber"
        >
          {adjTotal === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={c.adjustmentEmpty}
            />
          ) : (
            <>
              <BarChartCard
                points={[
                  {
                    label: c.adjustmentSystem,
                    value: adj.approvedAtSystemPrice,
                  },
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
            </>
          )}
        </CardComponent>
      ),
    },
    {
      key: 'additional',
      hasData: data.additionalServiceDistribution.length > 0,
      span: 6,
      node: (
        <CardComponent
          title={c.additionalServicesTitle}
          icon={<PieChartOutlined />}
          tone="violet"
        >
          <DonutChart
            points={data.additionalServiceDistribution.map((p) => ({
              label: c.statusLabels[p.key] ?? statusLabel(p.key),
              value: p.count,
            }))}
            empty={c.additionalServicesEmpty}
            ariaLabel={c.totalAria}
          />
        </CardComponent>
      ),
    },
    {
      key: 'pricing',
      hasData: pricingTotal > 0,
      span: 6,
      node: (
        <CardComponent
          title={c.pricingPipelineTitle}
          icon={<BarChartOutlined />}
        >
          <BarChartCard
            points={[
              {
                label: c.pricingReview,
                value: data.pricingPipeline.pricingReviewCount,
              },
              {
                label: c.quoteReady,
                value: data.pricingPipeline.quoteReadyCount,
              },
              {
                label: c.waitingCustomer,
                value: data.pricingPipeline.waitingCustomerCount,
              },
              {
                label: c.waitingDeposit,
                value: data.pricingPipeline.waitingDepositCount,
              },
              {
                label: c.depositPaid,
                value: data.pricingPipeline.depositPaidCount,
              },
            ]}
            empty={c.pricingPipelineEmpty}
            ariaLabel={c.barAria}
          />
        </CardComponent>
      ),
    },
    {
      key: 'missionStatus',
      hasData: data.missionStatusDistribution.length > 0,
      span: 6,
      node: (
        <CardComponent
          title={c.missionStatusTitle}
          icon={<PieChartOutlined />}
          tone="green"
        >
          <DonutChart
            points={data.missionStatusDistribution.map((p) => ({
              label: c.statusLabels[p.key] ?? statusLabel(p.key),
              value: p.count,
            }))}
            empty={c.missionStatusEmpty}
            ariaLabel={c.totalAria}
          />
        </CardComponent>
      ),
    },
  ]
  const ordered = [
    ...cells.filter((x) => x.hasData),
    ...cells.filter((x) => !x.hasData),
  ]
  const dataSixes = ordered.filter((x) => x.hasData && x.span === 6)
  const lastSix =
    dataSixes.length % 2 === 1 ? dataSixes[dataSixes.length - 1] : undefined
  return (
    <section aria-label={c.title} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="mgr-section-title">{c.title}</h2>
        <Button
          size="small"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? c.collapse : c.expand}
        </Button>
      </div>
      {open ? (
        <div className="mgr-an-grid">
          {ordered.map((x) => (
            <div
              key={x.key}
              className={`mgr-an-cell mgr-an-span-${x.hasData ? (x === lastSix ? 12 : x.span) : 4}`}
            >
              {x.node}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
