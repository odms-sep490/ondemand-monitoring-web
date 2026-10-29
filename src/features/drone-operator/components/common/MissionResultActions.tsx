import { ApiError } from '../../../../shared/api/httpClient'
import { Alert, Button } from 'antd'

import { CardComponent, StatusTag } from '../../../../shared/components/antd'
import { getLanguage, useI18n } from '../../../../shared/i18n'
import type { useMissionMonitoring } from '../../../mission/hooks/useMissionMonitoring'
import { missionResultActionsMessages } from './MissionResultActions.messages'

type Monitoring = ReturnType<typeof useMissionMonitoring>

function copy() {
  return missionResultActionsMessages[getLanguage()]
}

/** Backend capabilities identify the actor; readiness and lifecycle identify the operation. */
export function missionResultActions(
  missionId: string,
  status: string | undefined,
  query: Monitoring,
) {
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
    status === 'PENDING_REVIEW' &&
    data.permissions.canCompleteMission === true
  const canSubmit =
    known && data.permissions.canSubmitMissionResult === true && !submitted
  const completeReady =
    canComplete && data.checklist.readyForMissionCompletion === true
  const submitReady =
    canSubmit &&
    data.checklist.readyForSubmission === true &&
    (status === 'COMPLETED' || (status === 'PENDING_REVIEW' && completeReady))
  const remaining =
    data?.checklist.executions.filter(
      (row) => !['COMPLETED', 'UNABLE_TO_VERIFY'].includes(row.executionStatus),
    ).length ?? 0
  const c = copy()
  const readinessReason = !known
    ? c.confirming
    : remaining > 0
      ? c.remaining(remaining)
      : data.checklist.executions.some(
            (row) =>
              row.executionStatus === 'UNABLE_TO_VERIFY' &&
              !row.unableToVerifyReason?.trim(),
          )
        ? c.needReason
        : data.checklist.blockingReasons?.includes(
              'CHECKLIST_INTEGRITY_INVALID',
            )
          ? c.integrity
          : data.checklist.blockingReasons?.includes('MEDIA_REJECTED')
            ? c.mediaRejected
            : data.checklist.blockingReasons?.includes('MEDIA_NOT_VALIDATED')
              ? c.mediaNotValidated
              : c.notReady
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
  const c = copy()
  if (error instanceof ApiError) {
    if (error.status === 401) return c.err401
    if (error.status === 403) return c.err403
    if (error.code === 'MISSION_STATUS_INVALID') return c.errStatus
    if (error.code === 'CHECKLIST_EXECUTION_LOCKED') return c.errLocked
    if (error.code === 'CHECKLIST_NOT_READY')
      return error.message.includes('EVIDENCE_TYPE_NOT_ELIGIBLE')
        ? c.errEvidenceType
        : error.message.includes('INSUFFICIENT_EVIDENCE')
          ? c.errEvidenceCount
          : c.errChecklist
  }
  return c.errGeneric
}

export function MissionResultActions({
  missionId,
  status,
  monitoring,
  busy,
  onComplete,
  onSubmit,
  showComplete = true,
}: {
  missionId: string
  status?: string
  monitoring: Monitoring
  busy: boolean
  onComplete: () => void
  onSubmit: () => void
  showComplete?: boolean
}) {
  const { t } = useI18n(missionResultActionsMessages)
  const state = missionResultActions(missionId, status, monitoring)
  if (!['PENDING_REVIEW', 'COMPLETED'].includes(status ?? '')) return null
  const reasonId = `result-readiness-${missionId}`
  const submitReason =
    status !== 'COMPLETED' && !state.completeReady
      ? t.needComplete
      : state.readinessReason
  const approved = monitoring.data?.result?.approvalStatus === 'APPROVED'
  const showReason =
    (state.canSubmit && !state.submitReady) ||
    (showComplete && state.canComplete && !state.completeReady)
  return (
    <CardComponent aria-label={t.sectionLabel} className="stf-result-actions">
      <div className="stf-stack-sm">
        <div className="stf-row" role="status" style={{ fontWeight: 600 }}>
          {status === 'COMPLETED' ? t.accepted : t.pendingAcceptance}
          {state.submitted && (
            <>
              <span className="stf-muted" style={{ fontWeight: 400 }}>
                {approved ? t.approvedNote : t.sentNote}
              </span>
              <StatusTag tone="success">
                {approved ? t.approvedTag : t.waitingTag}
              </StatusTag>
            </>
          )}
          <span className="stf-spacer" />
          {((showComplete && state.canComplete) || state.canSubmit) && (
            <span className="stf-row">
              {showComplete && state.canComplete && (
                <Button
                  type="primary"
                  disabled={busy || !state.completeReady}
                  aria-describedby={!state.completeReady ? reasonId : undefined}
                  onClick={onComplete}
                >
                  {t.complete}
                </Button>
              )}
              {state.canSubmit && (
                <Button
                  type={status === 'COMPLETED' ? 'primary' : 'default'}
                  disabled={busy || !state.submitReady}
                  aria-describedby={!state.submitReady ? reasonId : undefined}
                  onClick={onSubmit}
                >
                  {t.submit}
                </Button>
              )}
            </span>
          )}
        </div>
        {showReason && (
          <Alert
            id={reasonId}
            role="status"
            type="warning"
            showIcon
            message={
              showComplete && state.canComplete && !state.completeReady
                ? state.readinessReason
                : submitReason
            }
          />
        )}
        {busy && (
          <p role="status" className="stf-muted" style={{ margin: 0 }}>
            {t.busy}
          </p>
        )}
        {!state.known && (
          <p role="status" className="stf-muted" style={{ margin: 0 }}>
            {t.confirming}
          </p>
        )}
      </div>
    </CardComponent>
  )
}
