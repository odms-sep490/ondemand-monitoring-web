import { LineChart } from './LineChart'
import { DonutChart } from './DonutChart'
import type { ReportSummary } from '../../../types/reports'

export function ReportsTrends({
  t,
  summary,
}: {
  t: {
    pageTitle: string
    pageSubtitle: string
    loadError: string
    emptyTitle: string
    emptyDescription: string
    filters: {
      period: string
      periodOptions: string[]
      service: string
      allServices: string
      drone: string
      allDrones: string
      pilot: string
      allPilots: string
      reset: string
      exportCsv: string
    }
    csvHeaders: string[]
    csvFilenamePrefix: string
    kpis: {
      successRate: string
      successRateSub: (delta: number) => string
      missionsFlown: string
      missionsFlownSub: (completed: number, failed: number) => string
      avgApprovalTime: string
      avgApprovalTimeValue: (hours: number) => string
      avgApprovalTimeSub: (deltaHours: number, weekLabel: string) => string
      avgFleetUtilization: string
    }
    charts: {
      successRateByWeek: string
      successRateFootnote: string
      serviceDistribution: string
      droneUtilization: string
      droneUtilizationFootnote: string
      avgApprovalTime: string
      avgApprovalTimeFootnote: string
      topFailureReasons: string
      topFailureReasonsFootnote: (failedMissions: number) => string
      donutUnit: string
    }
  }
  summary: ReportSummary
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)',
        gap: 14,
        marginBottom: 14,
      }}
    >
      <div className="odm-card">
        <div className="odm-card-header">{t.charts.successRateByWeek}</div>
        <div className="odm-card-body">
          <LineChart
            width={680}
            height={230}
            data={summary.weeklySuccessRate.map((w) => ({
              label: w.week,
              value: w.rate,
            }))}
            minVal={70}
            maxVal={100}
            color="var(--green-dot)"
            yLabels={['100%', '93%', '85%', '78%', '70%']}
            yValues={[100, 93, 85, 78, 70]}
            bottomPadding={22}
            ariaLabel={t.charts.successRateByWeek}
          />
          <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 4 }}>
            {t.charts.successRateFootnote}
          </div>
        </div>
      </div>
      <div className="odm-card">
        <div className="odm-card-header">{t.charts.serviceDistribution}</div>
        <div className="odm-card-body">
          <DonutChart
            items={summary.serviceDistribution.map((s) => ({
              label: s.service,
              count: s.count,
            }))}
            total={summary.totalOrders}
            ariaLabel={t.charts.serviceDistribution}
            unit={t.charts.donutUnit}
          />
        </div>
      </div>
    </div>
  )
}
