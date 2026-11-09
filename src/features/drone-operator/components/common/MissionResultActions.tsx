import { missionResultActionsMessages } from './MissionResultActions.messages'
import { getLanguage, useI18n } from '../../../../shared/i18n'
import { checklistReadyForInspection } from '../../../mission/lib/customerEvidenceSelection'
import { ApiError } from '../../../../shared/api/httpClient'
import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'
import type { useMissionMonitoring } from '../../../mission/hooks/useMissionMonitoring'
import './MissionResultActions.css'

type Monitoring = ReturnType<typeof useMissionMonitoring>

/** Backend capabilities identify the actor; readiness and lifecycle identify the operation. */
export function missionResultActions(
  missionId: string,
  status: string | undefined,
  query: Monitoring,
) {
  const t = missionResultActionsMessages[getLanguage()]
  const data = query.data
  const known =
    !query.loading &&
    !query.error &&
    data?.checklist.missionId === missionId &&
    (!data.result || data.result.missionId === missionId)
  const submitted =
    known &&
    (data.result?.approvalStatus === 'PENDING_MANAGER_APPROVAL' ||
      data.result?.approvalStatus === 'APPROVED')
  const canComplete =
    known &&
    status === 'IN_PROGRESS' &&
    data.permissions.canCompleteMission === true
  const canSubmit =
    known &&
    (status === 'IN_PROGRESS' || status === 'COMPLETED') &&
    data.permissions.canSubmitMissionResult === true &&
    data.permissions.canAssessMonitoringChecklist === true &&
    !submitted
  const completeReady =
    canComplete && data.checklist.readyForMissionCompletion === true
  const submitReady =
    canSubmit &&
    checklistReadyForInspection(data.checklist) &&
    (status === 'IN_PROGRESS' || status === 'COMPLETED')
  const remaining =
    data?.checklist.executions.filter(
      (row) => !['COMPLETED', 'UNABLE_TO_VERIFY'].includes(row.executionStatus),
    ).length ?? 0
  const readinessReason = !known
    ? t.verifying
    : remaining > 0
      ? t.remaining(remaining)
      : data.checklist.executions.some(
            (row) =>
              row.executionStatus === 'UNABLE_TO_VERIFY' &&
              !row.unableToVerifyReason?.trim(),
          )
        ? t.unableReason
        : data.checklist.blockingReasons?.includes(
              'CHECKLIST_INTEGRITY_INVALID',
            )
          ? t.integrity
          : data.checklist.blockingReasons?.includes('MEDIA_REJECTED')
            ? t.rejectedMedia
            : data.checklist.blockingReasons?.includes('MEDIA_NOT_VALIDATED')
              ? t.unvalidated
              : t.notReady
  return {
    known,
    submitted,
    canComplete,
    canSubmit,
    completeReady,
    submitReady,
    readinessReason,
  }
}

/** Keep the original error object in state for diagnostics; never present server internals. */
export function staffResultError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401)
      return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
    if (error.status === 403)
      return 'Bạn không có quyền thực hiện thao tác này.'
    if (error.code === 'MISSION_STATUS_INVALID')
      return 'Trạng thái Mission đã thay đổi. Dữ liệu mới đang được cập nhật.'
    if (error.code === 'CHECKLIST_EXECUTION_LOCKED')
      return 'Kết quả đã được gửi hoặc duyệt. Dữ liệu mới đang được cập nhật.'
    if (error.code === 'CHECKLIST_NOT_READY')
      return error.message.includes('EVIDENCE_TYPE_NOT_ELIGIBLE')
        ? 'Một hoặc nhiều mục có media sai loại. Thay bằng đúng loại ảnh/video theo yêu cầu của từng mục.'
        : error.message.includes('INSUFFICIENT_EVIDENCE')
          ? 'Chưa đủ bằng chứng hợp lệ theo số lượng yêu cầu. Kiểm tra tiến độ từng mục và bổ sung phần còn thiếu.'
          : 'Checklist chưa hoàn tất hoặc chưa đủ bằng chứng hợp lệ.'
  }
  return 'Không thể thực hiện thao tác. Dữ liệu mới đang được cập nhật; vui lòng kiểm tra và thử lại.'
}

export function MissionResultActions({
  missionId,
  status,
  monitoring,
  busy,
  onComplete,
  onSubmit,
  showComplete = true,
  showSubmit = true,
}: {
  missionId: string
  status?: string
  monitoring: Monitoring
  busy: boolean
  onComplete: () => void
  onSubmit: () => void
  showComplete?: boolean
  showSubmit?: boolean
}) {
  const { t } = useI18n(missionResultActionsMessages)
  const state = missionResultActions(missionId, status, monitoring)
  if (
    !['AWAITING_REVIEW', 'PENDING_REVIEW', 'COMPLETED'].includes(
      status ?? '',
    ) &&
    !state.canComplete &&
    !state.canSubmit
  )
    return null
  const reasonId = `result-readiness-${missionId}`
  const submitReason =
    status !== 'IN_PROGRESS' && status !== 'COMPLETED'
      ? t.completeFirst
      : state.readinessReason
  return (
    <section className="staff-result-actions" aria-label={t.section}>
      <div className="staff-result-phase" role="status">
        {status === 'AWAITING_REVIEW' || status === 'PENDING_REVIEW'
          ? t.awaiting
          : status === 'COMPLETED'
            ? t.completed
            : showComplete && !showSubmit && state.canComplete
              ? t.afterFlight
              : state.canSubmit
                ? t.review
                : t.waiting}
        {state.submitted && (
          <>
            <span>
              {monitoring.data?.result?.approvalStatus === 'APPROVED'
                ? t.confirmed
                : t.awaiting}
            </span>
            <StatusBadge tone="blue">
              {monitoring.data?.result?.approvalStatus === 'APPROVED'
                ? t.approved
                : t.pending}
            </StatusBadge>
          </>
        )}
      </div>
      {((showComplete && state.canComplete) ||
        (showSubmit && state.canSubmit)) && (
        <div className="staff-result-buttons">
          {showComplete && state.canComplete && (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              disabled={busy || !state.completeReady}
              aria-describedby={!state.completeReady ? reasonId : undefined}
              onClick={onComplete}
            >
              {t.complete}
            </button>
          )}
          {showSubmit && state.canSubmit && (
            <button
              type="button"
              className={`odm-btn${state.submitReady ? ' odm-btn-p' : ''}`}
              disabled={busy || !state.submitReady}
              aria-describedby={!state.submitReady ? reasonId : undefined}
              onClick={onSubmit}
            >
              {t.confirm}
            </button>
          )}
        </div>
      )}
      {((showSubmit && state.canSubmit && !state.submitReady) ||
        (showComplete && state.canComplete && !state.completeReady)) && (
        <p id={reasonId} className="staff-result-reason">
          {showComplete && state.canComplete && !state.completeReady
            ? state.readinessReason
            : submitReason}
        </p>
      )}
      {showSubmit && (
        <p className="staff-result-reason">{t.automaticPublication}</p>
      )}
      {busy && <p role="status">{t.busy}</p>}
      {!state.known && <p role="status">{t.verifying}</p>}
    </section>
  )
}
