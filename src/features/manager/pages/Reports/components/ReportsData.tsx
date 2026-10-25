import type { ReportSummary } from '../../../types/reports'
import type { PageMessages } from '../reportsTypes'
import { exportCsv } from '../../../lib/exportCsv'
import { ReportsFilters } from './ReportsFilters'
import { ReportsKpis } from './ReportsKpis'
import { ReportsTrends } from './ReportsTrends'
import { ReportsBreakdown } from './ReportsBreakdown'

// ── main data view ──────────────────────────────────────────────────────────

export function ReportsData({
  summary,
  t,
}: {
  summary: ReportSummary
  t: PageMessages
}) {
  function handleExportCsv() {
    const headers = t.csvHeaders
    const rows = summary.weeklySuccessRate.map((w, i) => [
      w.week,
      String(w.rate),
      String(summary.weeklyApprovalTimeHours[i]?.avgHours ?? ''),
    ])
    exportCsv(
      headers,
      rows,
      `${t.csvFilenamePrefix}-W${summary.weeklySuccessRate[0]?.week?.replace('W', '')}-W${summary.weeklySuccessRate[summary.weeklySuccessRate.length - 1]?.week?.replace('W', '')}`,
    )
  }

  const maxDroneUtil = Math.max(
    ...summary.droneUtilization.map((d) => d.utilizationPct),
  )
  const maxFailReason = Math.max(
    ...summary.topFailureReasons.map((r) => r.count),
  )

  return (
    <>
      {/* Filters row */}
      <ReportsFilters t={t} handleExportCsv={handleExportCsv} />

      {/* KPI row */}
      <ReportsKpis t={t} summary={summary} />

      {/* Charts row 1 */}
      <ReportsTrends t={t} summary={summary} />

      {/* Charts row 2 */}
      <ReportsBreakdown
        t={t}
        summary={summary}
        maxDroneUtil={maxDroneUtil}
        maxFailReason={maxFailReason}
      />
    </>
  )
}
