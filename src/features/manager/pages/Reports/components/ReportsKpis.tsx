import { StatCard } from './StatCard'
import type { ReportSummary } from '../../../types/reports'

export function ReportsKpis({
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
        gridTemplateColumns: 'repeat(4,1fr)',
        gap: 12,
        marginBottom: 14,
      }}
    >
      <StatCard
        label={t.kpis.successRate}
        value={`${summary.successRate}%`}
        sub={t.kpis.successRateSub(summary.successRateDelta)}
      />
      <StatCard
        label={t.kpis.missionsFlown}
        value={String(summary.totalMissionsFlown)}
        sub={t.kpis.missionsFlownSub(
          summary.completedMissions,
          summary.failedMissions,
        )}
      />
      <StatCard
        label={t.kpis.avgApprovalTime}
        value={t.kpis.avgApprovalTimeValue(summary.avgApprovalTimeHours)}
        sub={t.kpis.avgApprovalTimeSub(
          summary.avgApprovalTimeDeltaHours,
          summary.avgApprovalTimeDeltaWeekLabel,
        )}
      />
      <StatCard
        label={t.kpis.avgFleetUtilization}
        value={`${summary.avgFleetUtilizationPct}%`}
      />
    </div>
  )
}
