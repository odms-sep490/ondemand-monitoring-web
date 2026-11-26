import type { InspectionReport } from './reportApi'

export function selectReportForReview(rows: InspectionReport[], reviewOnly: boolean) {
  if (!reviewOnly) return rows[0]
  return rows.find(row => row.status === 'IN_REVIEW' && row.document !== null)
    ?? rows.find(row => row.document !== null)
}
