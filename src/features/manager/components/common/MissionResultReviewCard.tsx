import { useId } from 'react'
import type { MissionChecklistResponse } from '../../../mission/types/checklistExecution'
import type {
  MissionResponse,
  MissionResultResponse,
} from '../../types/missions'
import { OrderIcon } from './OrderIcon'
import { formatDateTime, formatDuration } from './missionDetailHelpers'
import { MissionResultReviewActions } from './MissionResultReviewActions'
import { missionResultReviewReadiness } from './missionResultReviewReadiness'
import './MissionResultReviewCard.css'

const statusLabels: Record<MissionResultResponse['status'], string> = {
  COMPLETED: 'Hoàn thành',
  DRAFT: 'Nháp',
  IN_PROGRESS: 'Đang thực hiện',
  FAILED: 'Không hoàn thành',
  CANCELLED: 'Đã hủy',
}
const approvalLabels: Record<MissionResultResponse['approvalStatus'], string> =
  {
    DRAFT: 'Nháp',
    PENDING_MANAGER_APPROVAL: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Đã từ chối',
  }

export function MissionResultReviewCard({
  mission,
  result,
  checklist,
  checklistLoading = false,
  checklistFailed = false,
  refreshing = false,
  mediaCount: fallbackMediaCount = 0,
  locale = 'vi-VN',
  onReviewed,
  onViewMedia,
}: {
  mission: Pick<MissionResponse, 'id' | 'status'>
  result: MissionResultResponse | null
  checklist?: MissionChecklistResponse
  checklistLoading?: boolean
  checklistFailed?: boolean
  refreshing?: boolean
  mediaCount?: number
  locale?: 'vi-VN' | 'en-US'
  onReviewed: () => void
  onViewMedia?: () => void
}) {
  const headingId = useId()
  const reasonId = useId()
  const matchingResult = result?.missionId === mission.id ? result : null
  const readiness = missionResultReviewReadiness({
    missionId: mission.id,
    missionStatus: mission.status,
    checklist,
    loading: refreshing || checklistLoading,
    failed: checklistFailed,
  })
  const mediaCount =
    matchingResult?.mediaCount ??
    matchingResult?.mediaFiles?.length ??
    fallbackMediaCount
  const pending = matchingResult?.approvalStatus === 'PENDING_MANAGER_APPROVAL'
  const conditions = [
    {
      label: readiness.missionComplete
        ? 'Mission đã hoàn thành'
        : 'Mission chưa hoàn thành',
      tone: readiness.missionComplete ? 'success' : 'warning',
    },
    {
      label: readiness.checklistReady
        ? 'Checklist đã sẵn sàng'
        : readiness.known
          ? 'Checklist chưa sẵn sàng'
          : 'Chưa xác nhận checklist',
      tone: readiness.checklistReady
        ? 'success'
        : readiness.known
          ? 'warning'
          : 'neutral',
    },
    {
      label: mediaCount > 0 ? 'Có media' : 'Chưa có media',
      tone: mediaCount > 0 ? 'success' : 'neutral',
    },
    ...(readiness.mediaPending
      ? [{ label: 'Còn media chưa được duyệt', tone: 'warning' }]
      : []),
  ]
  return (
    <section
      className="odm-or-card odm-result-review"
      aria-labelledby={headingId}
    >
      <div className="odm-result-review-summary">
        <header className="odm-result-review-heading">
          <h2 id={headingId}>Kết quả nhiệm vụ</h2>
          {matchingResult && (
            <div className="odm-or-result-line">
              <span
                className={`odm-or-pill odm-or-pill-${matchingResult.status === 'COMPLETED' ? 'green' : 'amber'}`}
              >
                {statusLabels[matchingResult.status] ?? 'Chưa xác định'}
              </span>
              <span
                className={`odm-or-pill odm-or-pill-${matchingResult.approvalStatus === 'APPROVED' ? 'green' : matchingResult.approvalStatus === 'REJECTED' ? 'red' : 'amber'}`}
              >
                {approvalLabels[matchingResult.approvalStatus] ??
                  'Chưa xác định'}
              </span>
            </div>
          )}
        </header>
        {matchingResult ? (
          <>
            <dl className="odm-result-review-metrics">
              <div>
                <dt>Gửi lúc</dt>
                <dd>
                  {matchingResult.approvalStatus === 'DRAFT'
                    ? 'Chưa gửi'
                    : formatDateTime(matchingResult.submittedAt, locale)}
                </dd>
              </div>
              <div>
                <dt>Thời lượng</dt>
                <dd>
                  {matchingResult.durationSeconds == null
                    ? 'Chưa ghi nhận'
                    : formatDuration(matchingResult.durationSeconds)}
                </dd>
              </div>
              <div>
                <dt>Media</dt>
                <dd>{mediaCount} ảnh/video</dd>
              </div>
            </dl>
            {(matchingResult.summary || matchingResult.notes) && (
              <p className="odm-result-review-description">
                {matchingResult.summary || matchingResult.notes}
              </p>
            )}
          </>
        ) : (
          <p className="odm-result-review-empty">
            Chưa có kết quả nhiệm vụ được gửi.
          </p>
        )}
      </div>
      {pending && (
        <section
          className="odm-result-review-readiness"
          aria-label="Điều kiện duyệt kết quả"
        >
          <h3>Điều kiện duyệt</h3>
          <ul>
            {conditions.map((condition) => (
              <li key={condition.label} className={`is-${condition.tone}`}>
                <span
                  className="odm-result-review-condition-icon"
                  aria-hidden="true"
                >
                  <OrderIcon
                    name={
                      condition.tone === 'success'
                        ? 'check'
                        : condition.tone === 'warning'
                          ? 'alert'
                          : 'info'
                    }
                    size={15}
                  />
                </span>
                {condition.label}
              </li>
            ))}
          </ul>
          {readiness.reason && (
            <p
              id={reasonId}
              className="odm-result-review-warning"
              role="status"
            >
              {readiness.reason}
            </p>
          )}
          <div className="odm-result-review-media-helper">
            <span>Duyệt media riêng trước khi duyệt kết quả.</span>
            {onViewMedia && (
              <button type="button" onClick={onViewMedia}>
                <OrderIcon name="media" size={15} />
                Xem thư viện media
                <OrderIcon name="arrow-right" size={14} />
              </button>
            )}
          </div>
        </section>
      )}
      {matchingResult && (
        <div className="odm-result-review-action-section">
          {matchingResult.approvalStatus === 'REJECTED' &&
            matchingResult.reviewNote && (
              <div className="odm-result-review-recorded-note">
                <strong>Lý do từ chối</strong>
                <p>{matchingResult.reviewNote}</p>
              </div>
            )}
          <MissionResultReviewActions
            key={matchingResult.id}
            resultId={matchingResult.id}
            status={matchingResult.approvalStatus}
            ready={readiness.ready}
            refreshing={refreshing}
            disabledReasonId={readiness.reason ? reasonId : undefined}
            onReviewed={onReviewed}
          />
        </div>
      )}
    </section>
  )
}
