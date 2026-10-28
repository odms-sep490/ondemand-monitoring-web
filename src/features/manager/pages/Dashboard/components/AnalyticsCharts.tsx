import { AreaChartOutlined, PieChartOutlined, BarChartOutlined, PercentageOutlined } from '@ant-design/icons'
import { Button, Col, Empty, Row } from 'antd'
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
  return (
    <section aria-label={c.title} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="mgr-section-title">{c.title}</h2>
        <Button size="small" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? c.collapse : c.expand}
        </Button>
      </div>
      {open ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <CardComponent title={c.trendTitle} icon={<AreaChartOutlined />}>
              <TrendLineChart
                points={data.missionTrend.map((p) => ({ x: p.periodStart, completed: p.completed, failed: p.failed }))}
                completedLabel={c.trendCompleted}
                failedLabel={c.trendFailed}
                empty={c.trendEmpty}
                locale={locale}
                ariaLabel={c.overTime(c.trendCompleted)}
              />
            </CardComponent>
          </Col>
          <Col xs={24} xl={8}>
            <CardComponent title={c.orderStatusTitle} icon={<PieChartOutlined />} tone="violet">
              <DonutChart
                points={data.orderStatusDistribution.map((p) => ({ label: c.statusLabels[p.key] ?? statusLabel(p.key), value: p.count }))}
                empty={c.orderStatusEmpty}
                ariaLabel={c.totalAria}
              />
            </CardComponent>
          </Col>
          <Col xs={24} xl={12}>
            <CardComponent title={c.servicesTitle} icon={<BarChartOutlined />} tone="green">
              <BarChartCard
                points={data.serviceDistribution.map((p) => ({ label: p.serviceName, value: p.count }))}
                empty={c.servicesEmpty}
                ariaLabel={c.barAria}
              />
            </CardComponent>
          </Col>
          <Col xs={24} xl={12}>
            <CardComponent title={c.adjustmentTitle} icon={<PercentageOutlined />} tone="amber">
              {adjTotal === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={c.adjustmentEmpty} />
              ) : (
                <>
                  <BarChartCard
                    points={[
                      { label: c.adjustmentSystem, value: adj.approvedAtSystemPrice },
                      { label: c.adjustmentManager, value: adj.adjustedByManager },
                    ]}
                    empty={c.adjustmentEmpty}
                    ariaLabel={c.barAria}
                  />
                  <div className="mgr-adjust-note">
                    <strong>{Math.round((adj.adjustedByManager * 100) / adjTotal)}%</strong>{' '}
                    {c.adjustmentManager}
                  </div>
                </>
              )}
            </CardComponent>
          </Col>
          <Col xs={24} xl={12}>
            <CardComponent title={c.additionalServicesTitle} icon={<PieChartOutlined />} tone="violet">
              <DonutChart
                points={data.additionalServiceDistribution.map((p) => ({
                  label: c.statusLabels[p.key] ?? statusLabel(p.key),
                  value: p.count,
                }))}
                empty={c.additionalServicesEmpty}
                ariaLabel={c.totalAria}
              />
            </CardComponent>
          </Col>
          <Col xs={24} xl={12}>
            <CardComponent title={c.pricingPipelineTitle} icon={<BarChartOutlined />}>
              <BarChartCard
                points={[
                  { label: c.pricingReview, value: data.pricingPipeline.pricingReviewCount },
                  { label: c.quoteReady, value: data.pricingPipeline.quoteReadyCount },
                  { label: c.waitingCustomer, value: data.pricingPipeline.waitingCustomerCount },
                  { label: c.waitingDeposit, value: data.pricingPipeline.waitingDepositCount },
                  { label: c.depositPaid, value: data.pricingPipeline.depositPaidCount },
                ]}
                empty={c.pricingPipelineEmpty}
                ariaLabel={c.barAria}
              />
            </CardComponent>
          </Col>
          <Col xs={24}>
            <CardComponent title={c.missionStatusTitle} icon={<PieChartOutlined />} tone="green">
              <DonutChart
                points={data.missionStatusDistribution.map((p) => ({
                  label: c.statusLabels[p.key] ?? statusLabel(p.key),
                  value: p.count,
                }))}
                empty={c.missionStatusEmpty}
                ariaLabel={c.totalAria}
              />
            </CardComponent>
          </Col>
        </Row>
      ) : null}
    </section>
  )
}
