import type { MissionResultApprovalStatus } from '../../../mission/types/mission'
import { useI18n } from '../../../../shared/i18n'
import { missionResultReviewMessages } from './MissionResultReview.messages'

/** Manager monitoring is read-only; only the assigned Inspector confirms and publishes. */
export function MissionResultReviewActions({
  status,
}: {
  resultId: string
  status: MissionResultApprovalStatus
  ready: boolean
  refreshing?: boolean
  disabledReasonId?: string
  onReviewed: () => void
}) {
  const { t } = useI18n(missionResultReviewMessages)
  return (
    <div className="mgr-result-review-recorded-note" role="status">
      <strong>{t.inspectorOwnership}</strong>
      <p>{status === 'REJECTED' ? t.rejectedNotice : t.inspectorPublication}</p>
    </div>
  )
}
