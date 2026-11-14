import { monitoringChecklistMessages } from './MonitoringChecklistSection.messages'
import type { EvidenceCandidateLoader } from '../types/checklistExecution'
import { checklistReadyForInspection } from '../lib/customerEvidenceSelection'
import { useState } from 'react'
import { getLanguage, useI18n } from '../../../shared/i18n'
import {
  evidenceCountLabel,
  evidenceShortfall,
  isPerTypeEvidence,
} from '../lib/evidenceProgress'
import { ApiError } from '../../../shared/api/httpClient'
import { checklistExecutionApi } from '../api/checklistExecutionApi'
import type {
  ChecklistExecutionStatus,
  ChecklistAssessmentStatus,
  MissionChecklistExecution,
  MissionChecklistResponse,
  EvidenceCandidate,
} from '../types/checklistExecution'
import type { MissionResultApprovalStatus } from '../types/mission'
import './MonitoringChecklistSection.css'
import { ChecklistGuidance } from '../../../shared/components/ChecklistGuidance'
import {
  ChecklistEvidencePanel,
  getEvidenceReason,
} from './ChecklistEvidencePanel'

const statuses: Record<
  'vi' | 'en',
  Record<ChecklistExecutionStatus, string>
> = {
  vi: {
    PENDING: 'Chưa thực hiện',
    IN_PROGRESS: 'Đang thực hiện',
    COMPLETED: 'Đã thực hiện',
    UNABLE_TO_VERIFY: 'Không thể xác minh',
  },
  en: {
    PENDING: 'Not started',
    IN_PROGRESS: 'In progress',
    COMPLETED: 'Completed',
    UNABLE_TO_VERIFY: 'Unable to verify',
  },
}
const executionBadges: Record<
  'vi' | 'en',
  Record<ChecklistExecutionStatus, { label: string; className: string }>
> = {
  vi: {
    PENDING: { label: 'Cần làm', className: 'is-todo' },
    IN_PROGRESS: { label: 'Đang làm', className: 'is-active' },
    COMPLETED: { label: 'Hoàn thành', className: 'is-done' },
    UNABLE_TO_VERIFY: { label: 'Không xác minh', className: 'is-danger' },
  },
  en: {
    PENDING: { label: 'To do', className: 'is-todo' },
    IN_PROGRESS: { label: 'In progress', className: 'is-active' },
    COMPLETED: { label: 'Completed', className: 'is-done' },
    UNABLE_TO_VERIFY: { label: 'Unable to verify', className: 'is-danger' },
  },
}
const assessmentLabels: Record<
  'vi' | 'en',
  Record<ChecklistAssessmentStatus, string>
> = {
  vi: {
    NOT_ASSESSED: 'Chưa đánh giá',
    COMPLIANT: 'Đạt yêu cầu',
    NON_COMPLIANT: 'Không đạt yêu cầu',
  },
  en: {
    NOT_ASSESSED: 'Not assessed',
    COMPLIANT: 'Work accepted',
    NON_COMPLIANT: 'Needs fixes',
  },
}
/** Time only for today, otherwise day/month + time. */
function formatUpdated(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const locale = getLanguage() === 'vi' ? 'vi-VN' : 'en-US'
  const time = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return date.toDateString() === new Date().toDateString()
    ? time
    : `${date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })} ${time}`
}
const statusLabel = (status: ChecklistExecutionStatus) =>
  statuses[getLanguage()][status]
const executionBadge = (status: ChecklistExecutionStatus) =>
  executionBadges[getLanguage()][status]
const terminal = (status: ChecklistExecutionStatus) =>
  status === 'COMPLETED' || status === 'UNABLE_TO_VERIFY'

function checklistEvidenceSummary(item: MissionChecklistExecution): string {
  if (item.executionStatus === 'UNABLE_TO_VERIFY')
    return monitoringChecklistMessages[getLanguage()].evidenceCount(
      item.eligibleEvidenceCount ?? 0,
    )

  const count = evidenceCountLabel(item, getLanguage())
  return !count || isPerTypeEvidence(item)
    ? count
    : monitoringChecklistMessages[getLanguage()].evidenceCount(count)
}

export function allowedExecutionStatuses(
  status: ChecklistExecutionStatus,
  rejected: boolean,
): ChecklistExecutionStatus[] {
  const all: ChecklistExecutionStatus[] = [
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'UNABLE_TO_VERIFY',
  ]
  if (terminal(status)) return rejected ? all : [status]
  return all.filter(
    (next) =>
      next === status ||
      next === 'COMPLETED' ||
      next === 'UNABLE_TO_VERIFY' ||
      (status === 'PENDING' && next === 'IN_PROGRESS'),
  )
}

export function monitoringErrorMessage(error: unknown) {
  const t = monitoringChecklistMessages[getLanguage()]
  if (error instanceof ApiError) {
    if (error.code === 'MISSION_PERMISSIONS_UNAVAILABLE')
      return t.permissionsUnavailable
    if (error.code === 'CHECKLIST_EXECUTION_PARENT_MISMATCH')
      return t.parentMismatch
    if (error.code === 'CONCURRENT_UPDATE') return t.concurrentUpdate
    if (error.status === 401) return t.sessionExpired
    if (error.status === 403) return t.denied
    if (error.status === 404) return t.notFound
    if (error.code === 'CHECKLIST_EXECUTION_LOCKED') return t.locked
    if (error.code === 'CHECKLIST_EXECUTION_TRANSITION_INVALID')
      return t.transitionInvalid
    if (error.code === 'MISSION_STATUS_INVALID') return t.missionChanged
    if (error.code === 'CHECKLIST_NOT_READY')
      return error.message.includes('EVIDENCE_TYPE_NOT_ELIGIBLE')
        ? t.typeMismatch
        : error.message.includes('INSUFFICIENT_EVIDENCE')
          ? t.insufficientEvidence
          : t.notReady
    if (error.status === 409) return t.conflict
  }
  return t.failed
}

export function MonitoringChecklistSection({
  missionId,
  data,
  loading,
  error,
  canExecute = false,
  canAssess = false,
  canSelectForCustomer = false,
  resultStatus,
  resultNote,
  resultKnown = true,
  refresh,
  canAttach = false,
  canDetach = false,
  loadEvidenceCandidates,
  attachEvidenceCandidate,
  attachEvidenceCandidates,
  evidenceDetached,
  compact = false,
  compactTitle,
  staffNamesById,
  hideImplementationHints = false,
  hideAssessment = false,
  completionOnly = false,
  assessmentOnly = false,
  preview = false,
}: {
  missionId: string
  hideImplementationHints?: boolean
  data?: MissionChecklistResponse
  loading: boolean
  error?: unknown
  canExecute?: boolean
  canAssess?: boolean
  canSelectForCustomer?: boolean
  resultStatus?: MissionResultApprovalStatus | null
  resultNote?: string | null
  resultKnown?: boolean
  refresh: () => void
  canAttach?: boolean
  canDetach?: boolean
  loadEvidenceCandidates?: EvidenceCandidateLoader
  attachEvidenceCandidate?: (
    media: EvidenceCandidate,
    item: MissionChecklistExecution,
  ) => Promise<unknown>
  attachEvidenceCandidates?: (
    media: EvidenceCandidate[],
    item: MissionChecklistExecution,
  ) => Promise<unknown>
  evidenceDetached?: (executionId: string, mediaId: string) => Promise<void>
  /** Dense acceptance panel: one line per item, only the active item expands. */
  compact?: boolean
  /** Optional heading for a compact checklist embedded in another workflow. */
  compactTitle?: string
  /** Names used to attribute checklist updates to assigned Mission staff. */
  staffNamesById?: Record<string, string>
  /** Hide assessment details and assessment blockers in execution-only views. */
  hideAssessment?: boolean
  /** Restrict execution edits to the current status or marking the item complete. */
  completionOnly?: boolean
  /** Acceptance view that reviews evidence and edits only the assessment. */
  assessmentOnly?: boolean
  /** Read-only preview shown before the pilot accepts the mission. */
  preview?: boolean
}) {
  const { lang, t } = useI18n(monitoringChecklistMessages)
  const assessments = assessmentLabels[lang]
  const finalReady = data ? checklistReadyForInspection(data) : false
  const [openId, setOpenId] = useState<string | null>(null)
  const locked =
    resultStatus === 'PENDING_MANAGER_APPROVAL' || resultStatus === 'APPROVED'
  const canEditExecution =
    canExecute &&
    !assessmentOnly &&
    resultKnown &&
    !locked &&
    !loading &&
    !error
  const canEditAssessment =
    canAssess && !hideAssessment && resultKnown && !locked && !loading && !error
  const canEditCustomerSelection = (item: MissionChecklistExecution) =>
    resultKnown &&
    !loading &&
    !error &&
    (item.customerSelectionEditable ??
      (canAssess && canSelectForCustomer && !locked))
  const editable = canEditExecution || canEditAssessment
  const rows = [...(data?.executions ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
  )
  const firstTodo = rows.find((row) =>
    assessmentOnly
      ? row.assessmentStatus === 'NOT_ASSESSED'
      : !terminal(row.executionStatus),
  )
  const assessed = rows.filter(
    (row) => row.assessmentStatus !== 'NOT_ASSESSED',
  ).length
  const done = assessmentOnly
    ? assessed
    : rows.filter((row) => terminal(row.executionStatus)).length
  const attachedEvidence = new Set(
    rows.flatMap((row) => (row.evidence ?? []).map((item) => item.evidenceId)),
  ).size
  const checklistEvidenceReady =
    data?.checklistEvidenceReady ?? data?.readyForSubmission ?? false
  const readinessNotMet = data
    ? hideAssessment
      ? data.checklistEvidenceReady === false
      : !data.readyForSubmission
    : false
  if (compact) {
    const progressCount = assessmentOnly ? assessed : done
    const activeId =
      openId && rows.some((row) => row.id === openId) ? openId : null
    const canChange =
      canAssess || canSelectForCustomer || assessmentOnly
        ? finalReady
        : hideAssessment
          ? checklistEvidenceReady
          : data?.readyForSubmission === true
    return (
      <section
        className="monitoring-checklist odm-card is-compact"
        aria-label={compactTitle ?? t.inspectionChecklist}
      >
        <header>
          <h2>{compactTitle ?? t.inspectionChecklist}</h2>
          <span
            className="mc-count"
            title={assessmentOnly ? t.assessmentProgress : t.executionProgress}
          >
            {progressCount} / {rows.length}{' '}
            {assessmentOnly ? t.assessedItems : t.completedItems}
            <small>
              {attachedEvidence}{' '}
              {t.attachedEvidence}
            </small>
          </span>
        </header>
        <div className="mc-progress" aria-hidden="true">
          <span
            style={{
              width: rows.length
                ? `${(progressCount / rows.length) * 100}%`
                : '0%',
            }}
          />
        </div>
        {loading && (
          <p role="status" className="mc-note">
            {t.loading}{' '}
          </p>
        )}
        {error ? (
          <div role="alert" className="mc-note is-danger">
            <p>{monitoringErrorMessage(error)}</p>
            <button type="button" className="odm-btn" onClick={refresh}>
              {t.retry}{' '}
            </button>
          </div>
        ) : null}
        {!loading && !error && data ? (
          <>
            {resultStatus === 'REJECTED' && (
              <p className="mc-note is-warn">
                {t.resultRejected} {resultNote ? `: ${resultNote}` : ''}
              </p>
            )}
            {data.legacySnapshot && <p className="mc-note">{t.legacy} </p>}
            {!rows.length && <p className="mc-note">{t.empty}</p>}
            {!hideImplementationHints && !editable && rows.length > 0 && (
              <p className="mc-note">
                {locked ? t.readOnlyLocked : t.readOnlyDenied}
              </p>
            )}
            {!canChange &&
              done === rows.length &&
              rows.length > 0 &&
              !data.readyForSubmission && (
                <p className="mc-note is-warn" role="alert">
                  {t.serverNotReady}{' '}
                </p>
              )}
          </>
        ) : null}
        {data && (
          <ol className="mc-list">
            {rows.map((item, index) => {
              const open = item.id === activeId
              const updatedBy = item.lastModifiedBy
                ? staffNamesById?.[item.lastModifiedBy]
                : undefined
              const finished = terminal(item.executionStatus)
              const tone = assessmentOnly
                ? item.assessmentStatus === 'COMPLIANT'
                  ? 'is-done'
                  : item.assessmentStatus === 'NON_COMPLIANT'
                    ? 'is-unable'
                    : item.id === firstTodo?.id
                      ? 'is-current'
                      : ''
                : item.executionStatus === 'UNABLE_TO_VERIFY'
                  ? 'is-unable'
                  : finished
                    ? 'is-done'
                    : item.id === firstTodo?.id
                      ? 'is-current'
                      : ''
              const badge = assessmentOnly
                ? tone === 'is-current'
                  ? { label: t.needsAssessment, className: 'is-todo' }
                  : tone === 'is-unable'
                    ? { label: t.nonCompliant, className: 'is-danger' }
                    : null
                : executionBadge(item.executionStatus)
              const evidenceSummary = checklistEvidenceSummary(item)
              return (
                <li
                  key={`evidence:${missionId}:${item.id}`}
                  className={`mc-item ${tone}${open ? ' is-open' : ''}`}
                >
                  <button
                    type="button"
                    className="mc-row"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? '' : item.id)}
                  >
                    <span className="mc-mark" aria-hidden="true">
                      {tone === 'is-done'
                        ? '✓'
                        : tone === 'is-unable'
                          ? '!'
                          : index + 1}
                    </span>
                    <span className="mc-text">
                      <span className="mc-title">{item.content}</span>
                      <span className="mc-sub">
                        {assessmentOnly
                          ? assessments[item.assessmentStatus]
                          : statusLabel(item.executionStatus)}
                        {evidenceSummary ? ` · ${evidenceSummary}` : null}
                        {item.executionStatus !== 'UNABLE_TO_VERIFY' &&
                          evidenceShortfall(item) > 0 && (
                            <>
                              {t.missingPrefix} {evidenceShortfall(item)}
                            </>
                          )}
                        {item.blockingReasons?.includes(
                          'EVIDENCE_TYPE_NOT_ELIGIBLE',
                        ) && t.wrongMediaType}
                        {updatedBy
                          ? ` · ${lang === 'vi' ? t.updatedBy : 'Updated by'} ${updatedBy}`
                          : null}
                        {item.updatedAt
                          ? ` · ${formatUpdated(item.updatedAt)}`
                          : null}
                      </span>
                    </span>
                    {badge && (
                      <span className={`mc-chip ${badge.className}`}>
                        {badge.label}
                      </span>
                    )}
                    <span className="mc-caret" aria-hidden="true" />
                  </button>
                  {open && (
                    <div className={`mc-detail${assessmentOnly ? ' is-inspection-review' : ''}`}>
                      <ChecklistGuidance
                        guidance={item}
                        defaultOpen={!assessmentOnly}
                        showEmpty={item.sourceType === 'CUSTOMER_CUSTOM'}
                      />
                      <ChecklistExecutionItem
                        key={`${missionId}:${item.id}`}
                        item={item}
                        missionId={missionId}
                        canExecute={canEditExecution}
                        canAssess={canEditAssessment}
                        hideAssessment={hideAssessment}
                        completionOnly={completionOnly}
                        assessmentOnly={assessmentOnly}
                        completeOnAssessment={
                          assessmentOnly && canEditAssessment
                        }
                        rejected={resultStatus === 'REJECTED'}
                        refresh={refresh}
                        compact
                      />
                      <ChecklistEvidencePanel
                        canSelectForCustomer={canEditCustomerSelection(item)}
                        missionId={missionId}
                        item={item}
                        canAttach={
                          canAttach &&
                          resultKnown &&
                          !locked &&
                          !loading &&
                          !error
                        }
                        canDetach={
                          canDetach &&
                          resultKnown &&
                          !locked &&
                          !loading &&
                          !error
                        }
                        hideAssessmentRequirement={hideAssessment}
                        refresh={refresh}
                        loadCandidates={loadEvidenceCandidates}
                        attachCandidate={attachEvidenceCandidate}
                        attachCandidates={attachEvidenceCandidates}
                        evidenceDetached={evidenceDetached}
                        compact
                      />
                      {item.updatedAt && (
                        <small className="mc-updated">
                          {lang === 'vi' ? t.updated : 'Updated'}{' '}
                          {formatUpdated(item.updatedAt)}
                        </small>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </section>
    )
  }
  if (preview) {
    return (
      <div className="monitoring-checklist mc-preview" aria-label={t.results}>
        <div className="mc-preview-notice" role="note">
          <strong>{t.previewLocked}</strong>
          <span>{t.previewHint} </span>
        </div>
        {loading && <p role="status">{t.loading}</p>}
        {error ? (
          <div role="alert">
            <p>{monitoringErrorMessage(error)}</p>
            <button type="button" className="odm-btn" onClick={refresh}>
              {t.retry}{' '}
            </button>
          </div>
        ) : null}
        {data && !rows.length && !loading && <p>{t.empty}</p>}
        {data && (
          <ol className="mc-preview-list">
            {rows.map((item) => (
              <li key={`preview:${missionId}:${item.id}`}>
                <span className="mc-preview-mark" aria-hidden="true">
                  ○
                </span>
                <span className="mc-preview-text">
                  <strong>{item.content}</strong>
                  {item.description?.trim() && (
                    <span className="mc-preview-description">
                      {item.description}
                    </span>
                  )}
                  <small>
                    {statusLabel(item.executionStatus)} ·{' '}
                    {lang === 'vi' ? t.minimumEvidence : 'Minimum evidence:'}{' '}
                    {item.minimumEvidenceCount ?? 0}
                  </small>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    )
  }
  return (
    <section className="monitoring-checklist odm-card" aria-label={t.results}>
      <header>
        <div>
          <h2>{t.results}</h2>
          {!hideImplementationHints && <p>{t.description}</p>}
        </div>
        <button
          type="button"
          className="odm-btn"
          onClick={refresh}
          disabled={loading}
          title={t.reloadHint}
        >
          <span aria-hidden="true">↻</span>
          {t.reload}{' '}
        </button>
      </header>
      {loading && <p role="status">{t.loadingResult}</p>}
      {error ? (
        <div role="alert">
          <p>{monitoringErrorMessage(error)}</p>
          <button type="button" className="odm-btn" onClick={refresh}>
            {t.retry}{' '}
          </button>
        </div>
      ) : null}
      {!loading && !error && data ? (
        <>
          <div
            className={`monitoring-summary${finalReady ? ' is-ready' : ''}`}
            role="status"
          >
            <strong>
              {lang === 'vi'
                ? finalReady
                  ? t.ready
                  : t.notReadyForInspection
                : finalReady
                  ? 'Ready for inspection'
                  : 'Not ready for inspection'}
            </strong>
            <span>
              {done} / {rows.length}
              {t.terminalItems} {rows.length - done}
              {t.remainingItems}{' '}
            </span>
            <span
              className="monitoring-progress"
              aria-hidden="true"
              style={{
                ['--p' as string]: rows.length
                  ? `${(done / rows.length) * 100}%`
                  : '0%',
              }}
            />
          </div>
          <div className="monitoring-notes">
            {!rows.length &&
              data.blockingReasons?.map((reason) => (
                <p key={reason} role="status" className="is-warn">
                  {getEvidenceReason(reason, lang)}
                </p>
              ))}
            {resultStatus && (
              <p>
                {t.resultStatus}{' '}
                {
                  {
                    DRAFT: t.draft,
                    PENDING_MANAGER_APPROVAL: t.awaitingInspection,
                    APPROVED: t.approved,
                    REJECTED: t.rejectedEditable,
                  }[resultStatus]
                }
              </p>
            )}
            {resultStatus === 'REJECTED' && resultNote && (
              <p>
                {t.managerNote} {resultNote}
              </p>
            )}
            {readinessNotMet && done === rows.length && (
              <p role="alert" className="is-warn">
                {t.serverNotReady}{' '}
              </p>
            )}
            {data.legacySnapshot && <p>{t.legacyFull} </p>}
            {!rows.length && <p>{t.empty}</p>}
            {!hideImplementationHints && (
              <p className="monitoring-hint">
                {locked
                  ? t.readOnlyLocked
                  : editable
                    ? t.editable
                    : t.notStartedHint}
              </p>
            )}
          </div>
        </>
      ) : null}
      {data && (
        <ol className="mc-list mc-list--expanded">
          {rows.map((item, index) => {
            const open = item.id === openId
            const finished = terminal(item.executionStatus)
            const tone = assessmentOnly
              ? item.assessmentStatus === 'COMPLIANT'
                ? 'is-done'
                : item.assessmentStatus === 'NON_COMPLIANT'
                  ? 'is-unable'
                  : item.id === firstTodo?.id
                    ? 'is-current'
                    : ''
              : item.executionStatus === 'UNABLE_TO_VERIFY'
                ? 'is-unable'
                : finished
                  ? 'is-done'
                  : item.id === firstTodo?.id
                    ? 'is-current'
                    : ''
            const badge = assessmentOnly
              ? tone === 'is-current'
                ? { label: t.needsAssessment, className: 'is-todo' }
                : tone === 'is-unable'
                  ? { label: t.nonCompliant, className: 'is-danger' }
                  : null
              : executionBadge(item.executionStatus)
            const evidenceSummary = checklistEvidenceSummary(item)
            return (
              <li
                key={`evidence:${missionId}:${item.id}`}
                className={`mc-item ${tone}${open ? ' is-open' : ''}`}
              >
                <button
                  type="button"
                  className="mc-row"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : item.id)}
                >
                  <span className="mc-mark" aria-hidden="true">
                    {tone === 'is-done'
                      ? '✓'
                      : tone === 'is-unable'
                        ? '!'
                        : index + 1}
                  </span>
                  <span className="mc-text">
                    <span className="mc-title">{item.content}</span>
                    <span className="mc-sub">
                      {assessmentOnly
                        ? assessments[item.assessmentStatus]
                        : statusLabel(item.executionStatus)}
                      {evidenceSummary ? ` · ${evidenceSummary}` : null}
                      {item.executionStatus !== 'UNABLE_TO_VERIFY' &&
                        evidenceShortfall(item) > 0 &&
                        t.missing(evidenceShortfall(item))}
                    </span>
                  </span>
                  {badge && (
                    <span className={`mc-chip ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                  <span className="mc-caret" aria-hidden="true" />
                </button>
                {open && (
                  <div className={`mc-detail${assessmentOnly ? ' is-inspection-review' : ''}`}>
                    <ChecklistExecutionItem
                      key={`${missionId}:${item.id}`}
                      item={item}
                      missionId={missionId}
                      canExecute={canEditExecution}
                      canAssess={canEditAssessment}
                      hideAssessment={hideAssessment}
                      completionOnly={completionOnly}
                      assessmentOnly={assessmentOnly}
                      completeOnAssessment={assessmentOnly && canEditAssessment}
                      rejected={resultStatus === 'REJECTED'}
                      refresh={refresh}
                    />
                    <ChecklistEvidencePanel
                      canSelectForCustomer={canEditCustomerSelection(item)}
                      missionId={missionId}
                      item={item}
                      canAttach={
                        canAttach &&
                        resultKnown &&
                        !locked &&
                        !loading &&
                        !error
                      }
                      canDetach={
                        canDetach &&
                        resultKnown &&
                        !locked &&
                        !loading &&
                        !error
                      }
                      hideAssessmentRequirement={hideAssessment}
                      refresh={refresh}
                      loadCandidates={loadEvidenceCandidates}
                      attachCandidate={attachEvidenceCandidate}
                      attachCandidates={attachEvidenceCandidates}
                      evidenceDetached={evidenceDetached}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function ChecklistExecutionItem({
  item,
  missionId,
  canExecute,
  canAssess,
  rejected,
  refresh,
  compact = false,
  hideAssessment = false,
  completionOnly = false,
  assessmentOnly = false,
  completeOnAssessment = false,
}: {
  item: MissionChecklistExecution
  missionId: string
  canExecute: boolean
  canAssess: boolean
  rejected: boolean
  refresh: () => void
  compact?: boolean
  hideAssessment?: boolean
  completionOnly?: boolean
  assessmentOnly?: boolean
  completeOnAssessment?: boolean
}) {
  const editable = canExecute || canAssess
  const [editing, setEditing] = useState(false)
  const [base, setBase] = useState(item)
  const [status, setStatus] = useState(item.executionStatus)
  const { lang, t } = useI18n(monitoringChecklistMessages)
  const assessments = assessmentLabels[lang]
  const [assessmentNote, setAssessmentNote] = useState(
    item.assessmentNote ?? '',
  )
  const [assessment, setAssessment] = useState(item.assessmentStatus)
  const [observation, setObservation] = useState(item.observation ?? '')
  const [reason, setReason] = useState(item.unableToVerifyReason ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<
    'reasonRequired' | 'maxLength' | { cause: unknown } | null
  >(null)
  const [conflict, setConflict] = useState(false)
  const statusOptions = allowedExecutionStatuses(base.executionStatus, rejected)
  const visibleStatusOptions = completionOnly
    ? statusOptions.filter(
        (value) => value === base.executionStatus || value === 'COMPLETED',
      )
    : statusOptions
  const assessmentHelp =
    lang === 'vi'
      ? t.assessmentHelp
      : 'Accept the work performed, rather than assess the facility condition. Non-compliant work needs fixes before inspection can be confirmed.'
  const noteEditor = canAssess && (
    <label>
      {lang === 'vi' ? t.inspectionNote : 'Inspection note'}
      <textarea
        maxLength={2000}
        value={assessmentNote}
        onChange={(event) => setAssessmentNote(event.target.value)}
      />
    </label>
  )
  const savedNote = item.assessmentNote && (
    <p>
      <strong>
        {lang === 'vi' ? t.inspectionNoteLabel : 'Inspection note:'}
      </strong>{' '}
      {item.assessmentNote}
    </p>
  )
  function reset() {
    setBase(item)
    setStatus(item.executionStatus)
    setAssessment(item.assessmentStatus)
    setAssessmentNote(item.assessmentNote ?? '')
    setObservation(item.observation ?? '')
    setReason(item.unableToVerifyReason ?? '')
    setConflict(false)
    setError(null)
  }
  async function save() {
    if (!editable || busy || conflict) return
    if (canExecute && status === 'UNABLE_TO_VERIFY' && !reason.trim()) {
      setError('reasonRequired')
      return
    }
    if (
      observation.length > 2000 ||
      reason.length > 1000 ||
      assessmentNote.length > 2000
    ) {
      setError('maxLength')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const assessedExecutionStatus =
        completeOnAssessment &&
        assessment !== 'NOT_ASSESSED' &&
        base.executionStatus !== 'UNABLE_TO_VERIFY' &&
        !terminal(base.executionStatus)
          ? 'COMPLETED'
          : base.executionStatus
      const updated =
        await checklistExecutionApi.updateMissionChecklistExecution(
          missionId,
          item.id,
          {
            expectedVersion: base.version,
            executionStatus: canExecute ? status : assessedExecutionStatus,
            ...(canAssess ? { assessmentNote: assessmentNote.trim() } : {}),
            assessmentStatus: canAssess ? assessment : base.assessmentStatus,
            observation: canExecute ? observation.trim() : base.observation,
            unableToVerifyReason: canExecute
              ? status === 'UNABLE_TO_VERIFY'
                ? reason.trim()
                : null
              : base.unableToVerifyReason,
          },
        )
      setBase(updated)
      setEditing(false)
      refresh()
    } catch (cause) {
      setError({ cause })
      if (
        cause instanceof ApiError &&
        (cause.status === 409 || cause.code === 'CONCURRENT_UPDATE')
      )
        setConflict(true)
      // Never retry a mutation automatically. Refresh authority/versions after any rejected save.
      refresh()
    } finally {
      setBusy(false)
    }
  }
  if (compact) {
    return (
      <div className={`monitoring-item mc-item-body${assessmentOnly ? ' is-assessment-review' : ''}`}>
        {assessmentOnly && !hideAssessment && (
          <header className="mc-assessment-heading">
            <div>
              <h4>{lang === 'vi' ? 'Đánh giá kết quả' : 'Assess the result'}</h4>
              <p>{lang === 'vi' ? 'Đối chiếu kết quả thực hiện với yêu cầu của hạng mục.' : 'Compare the work result against this checklist requirement.'}</p>
            </div>
            <span className={`mc-assessment-state is-${item.assessmentStatus.toLowerCase()}`}>{assessments[item.assessmentStatus]}</span>
          </header>
        )}
        {error && (
          <p role="alert">
            {typeof error === 'string'
              ? t[error]
              : monitoringErrorMessage(error.cause)}
          </p>
        )}
        {!editing ? (
          <>
            {!hideAssessment && savedNote}
            <dl className="mc-fields">
              {!assessmentOnly && (
                <div>
                  <dt>{t.status}</dt>
                  <dd>{statusLabel(item.executionStatus)}</dd>
                </div>
              )}
              {!hideAssessment && !assessmentOnly && (
                <div>
                  <dt>{t.assessment}</dt>
                  <dd>{assessments[item.assessmentStatus]}</dd>
                </div>
              )}
              {!assessmentOnly && !completionOnly && item.observation && (
                <div className="is-wide">
                  <dt>{t.note}</dt>
                  <dd>{item.observation}</dd>
                </div>
              )}
              {!assessmentOnly &&
                !completionOnly &&
                item.unableToVerifyReason && (
                  <div className="is-wide">
                    <dt>{t.unableReason}</dt>
                    <dd>{item.unableToVerifyReason}</dd>
                  </div>
                )}
            </dl>
            {editable && (
              <button
                type="button"
                className="mc-edit"
                onClick={() => {
                  reset()
                  setEditing(true)
                }}
              >
                {lang === 'vi'
                  ? assessmentOnly
                    ? t.assessment
                    : completionOnly
                      ? t.updateStatus
                      : t.edit
                  : assessmentOnly
                    ? 'Assess work'
                    : completionOnly
                      ? 'Update status'
                      : 'Edit'}
              </button>
            )}
          </>
        ) : (
          <form
            className="mc-form"
            onSubmit={(event) => {
              event.preventDefault()
              void save()
            }}
          >
            <fieldset disabled={!editable || busy}>
              {canExecute && (
                <label>
                  {t.executionStatus}{' '}
                  <select
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value as ChecklistExecutionStatus)
                      if (event.target.value !== 'UNABLE_TO_VERIFY')
                        setReason('')
                    }}
                  >
                    {visibleStatusOptions.map((value) => (
                      <option key={value} value={value}>
                        {statusLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {canAssess && (
                <label>
                  {lang === 'vi' ? t.inspectionAssessment : 'Work acceptance'}
                  <select
                    value={assessment}
                    onChange={(event) =>
                      setAssessment(
                        event.target.value as ChecklistAssessmentStatus,
                      )
                    }
                  >
                    {(
                      Object.keys(assessments) as ChecklistAssessmentStatus[]
                    ).map((value) => (
                      <option key={value} value={value}>
                        {assessments[value]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {canAssess && <p className="mc-help">{assessmentHelp}</p>}
              {noteEditor}
              {canExecute && !completionOnly && (
                <label>
                  {t.observation}{' '}
                  <textarea
                    maxLength={2000}
                    placeholder={t.observationPlaceholder}
                    value={observation}
                    onChange={(event) => setObservation(event.target.value)}
                  />
                </label>
              )}
              {canExecute && !completionOnly && (
                <small className="mc-counter">
                  {observation.length} / 2000
                </small>
              )}
              {canExecute &&
                !completionOnly &&
                status === 'UNABLE_TO_VERIFY' && (
                  <label>
                    {t.unableReason}{' '}
                    <textarea
                      aria-label={t.unableReason}
                      maxLength={1000}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                    />
                    <small className="mc-counter">{reason.length} / 1000</small>
                  </label>
                )}
              {conflict && (
                <button type="button" className="odm-btn" onClick={reset}>
                  {t.loadLatest}{' '}
                </button>
              )}
              <div className="mc-form-actions">
                <button
                  type="button"
                  className="mc-cancel"
                  onClick={() => setEditing(false)}
                >
                  {t.cancel}{' '}
                </button>
                <button
                  className="odm-btn odm-btn-p"
                  type="submit"
                  disabled={conflict || busy}
                >
                  {lang === 'vi' ? t.save : 'Save'}
                </button>
              </div>
            </fieldset>
          </form>
        )}
      </div>
    )
  }
  return (
    <div className="monitoring-item">
      <h3>{item.content}</h3>
      <ChecklistGuidance
        guidance={item}
        collapsible={false}
        showEmpty={item.sourceType === 'CUSTOMER_CUSTOM'}
      />
      <div className="monitoring-meta">
        {!assessmentOnly && (
          <span className={`is-exec-${item.executionStatus.toLowerCase()}`}>
            {statusLabel(item.executionStatus)}
          </span>
        )}
        {!hideAssessment && item.assessmentStatus !== 'NOT_ASSESSED' && (
          <span className={`is-assess-${item.assessmentStatus.toLowerCase()}`}>
            {assessments[item.assessmentStatus]}
          </span>
        )}
      </div>
      {!hideAssessment && savedNote}
      {!assessmentOnly && !completionOnly && item.observation && (
        <p>
          <strong>{t.observationLabel}</strong> {item.observation}
        </p>
      )}
      {!assessmentOnly && !completionOnly && item.unableToVerifyReason && (
        <p>
          <strong>{t.unableReasonLabel}</strong> {item.unableToVerifyReason}
        </p>
      )}
      {item.updatedAt && (
        <small>
          {lang === 'vi' ? t.updated : 'Updated'}:{' '}
          {formatUpdated(item.updatedAt)}
        </small>
      )}
      {error && (
        <p role="alert">
          {typeof error === 'string'
            ? t[error]
            : monitoringErrorMessage(error.cause)}
        </p>
      )}
      {editable && !editing && (
        <button
          type="button"
          className="odm-btn"
          onClick={() => {
            reset()
            setEditing(true)
          }}
        >
          {lang === 'vi' ? t.updateItem : 'Edit item'}
        </button>
      )}
      {editing && (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
        >
          <fieldset disabled={!editable || busy}>
            {canExecute && !completionOnly && (
              <label>
                {t.executionStatus}{' '}
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as ChecklistExecutionStatus)
                    if (event.target.value !== 'UNABLE_TO_VERIFY') setReason('')
                  }}
                >
                  {visibleStatusOptions.map((value) => (
                    <option key={value} value={value}>
                      {statusLabel(value)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {canAssess && (
              <label>
                {lang === 'vi' ? t.inspectionAssessment : 'Work acceptance'}
                <select
                  value={assessment}
                  onChange={(event) =>
                    setAssessment(
                      event.target.value as ChecklistAssessmentStatus,
                    )
                  }
                >
                  {(
                    Object.keys(assessments) as ChecklistAssessmentStatus[]
                  ).map((value) => (
                    <option key={value} value={value}>
                      {assessments[value]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {canAssess && <small>{assessmentHelp}</small>}
            {noteEditor}
            {canExecute && (
              <label>
                {t.observation}{' '}
                <textarea
                  maxLength={2000}
                  value={observation}
                  onChange={(event) => setObservation(event.target.value)}
                />
              </label>
            )}
            {canExecute && !completionOnly && (
              <small>{observation.length} / 2000</small>
            )}
            {canExecute && !completionOnly && status === 'UNABLE_TO_VERIFY' && (
              <label>
                {t.unableReason}{' '}
                <textarea
                  aria-label={t.unableReason}
                  maxLength={1000}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <small>{reason.length} / 1000</small>
              </label>
            )}
            {conflict && (
              <button type="button" className="odm-btn" onClick={reset}>
                {t.loadLatest}{' '}
              </button>
            )}
            <div className="monitoring-actions">
              <button
                className="odm-btn odm-btn-p"
                type="submit"
                disabled={conflict || busy}
              >
                {lang === 'vi' ? t.saveItem : 'Save item'}
              </button>
              <button
                className="odm-btn"
                type="button"
                onClick={() => setEditing(false)}
              >
                {t.cancelEditing}{' '}
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  )
}
