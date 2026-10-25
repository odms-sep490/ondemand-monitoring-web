import { BarRow } from './BarRow'
import { LineChart } from './LineChart'
import type { ReportSummary } from '../../../types/reports'

export function ReportsBreakdown({
  t,
  summary,
  maxDroneUtil,
  maxFailReason,
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
  maxDroneUtil: number
  maxFailReason: number
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
        gap: 14,
      }}
    >
      {/* Drone utilization */}
      <div className="odm-card">
        <div className="odm-card-header">{t.charts.droneUtilization}</div>
        <div className="odm-card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {summary.droneUtilization.map((d) => (
              <BarRow
                key={d.droneCode}
                label={`${d.droneCode} ${d.droneName}`}
                value={d.utilizationPct}
                maxValue={maxDroneUtil}
                color={
                  d.utilizationPct > 20 ? 'var(--blue-dot)' : 'var(--gray-dot)'
                }
              />
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 4 }}>
            {t.charts.droneUtilizationFootnote}
          </div>
        </div>
      </div>

      {/* Avg approval time */}
      <div className="odm-card">
        <div className="odm-card-header">{t.charts.avgApprovalTime}</div>
        <div className="odm-card-body">
          <LineChart
            width={330}
            height={200}
            data={summary.weeklyApprovalTimeHours.map((w) => ({
              label: w.week,
              value: w.avgHours,
            }))}
            minVal={0}
            maxVal={16}
            color="var(--blue-dot)"
            yLabels={['16h', '12h', '8h', '4h', '0h']}
            yValues={[16, 12, 8, 4, 0]}
            bottomPadding={16}
            ariaLabel={t.charts.avgApprovalTime}
          />
          <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 4 }}>
            {t.charts.avgApprovalTimeFootnote}
          </div>
        </div>
      </div>

      {/* Top failure reasons */}
      <div className="odm-card">
        <div className="odm-card-header">{t.charts.topFailureReasons}</div>
        <div className="odm-card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {summary.topFailureReasons.map((r) => (
              <div
                key={r.reason}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '55% 1fr 46px',
                  gap: 10,
                  alignItems: 'center',
                  fontSize: 12.5,
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.reason}
                </span>
                <div
                  style={{
                    height: 10,
                    borderRadius: 5,
                    background: 'var(--sf3)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${maxFailReason > 0 ? (r.count / maxFailReason) * 100 : 0}%`,
                      background: 'var(--red-dot)',
                      borderRadius: 5,
                    }}
                  />
                </div>
                <span
                  className="odm-tn"
                  style={{ textAlign: 'right', fontWeight: 600 }}
                >
                  {r.count}
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 4 }}>
            {t.charts.topFailureReasonsFootnote(summary.failedMissions)}
          </div>
        </div>
      </div>
    </div>
  )
}
