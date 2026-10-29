import { useState } from 'react'
import { useI18n } from '../../../shared/i18n'
import { monitoringChecklistMessages } from './MonitoringChecklistSection.messages'
import { evidenceCountLabel, evidenceShortfall } from '../lib/evidenceProgress'
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
  evidenceReason,
} from './ChecklistEvidencePanel'

type ChecklistMessages = (typeof monitoringChecklistMessages)['vi']

function evidenceTypeLabel(
  t: ChecklistMessages,
  type?: MissionChecklistExecution['requiredEvidenceType'],
) {
  switch (type ?? 'IMAGE_OR_VIDEO') {
    case 'IMAGE':
      return t.evidenceType.IMAGE
    case 'VIDEO':
      return t.evidenceType.VIDEO
    case 'IMAGE_AND_VIDEO':
      return t.evidenceType.IMAGE_AND_VIDEO
    default:
      return t.evidenceType.LEGACY
  }
}
/** Time only for today, otherwise day/month + time. */
function formatUpdated(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const time = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return date.toDateString() === new Date().toDateString()
    ? time
    : `${date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })} ${time}`
}
const terminal = (status: ChecklistExecutionStatus) =>
  status === 'COMPLETED' || status === 'UNABLE_TO_VERIFY'
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

export function monitoringErrorMessage(
  error: unknown,
  lang: 'vi' | 'en' = 'vi',
) {
  const e = monitoringChecklistMessages[lang].errors
  if (error instanceof ApiError) {
    if (error.code === 'MISSION_PERMISSIONS_UNAVAILABLE')
      return e.permissionsUnavailable
    if (error.code === 'CHECKLIST_EXECUTION_PARENT_MISMATCH')
      return e.parentMismatch
    if (error.code === 'CONCURRENT_UPDATE') return e.concurrent
    if (error.status === 401) return e.unauthorized
    if (error.status === 403) return e.forbidden
    if (error.status === 404) return e.notFound
    if (error.code === 'CHECKLIST_EXECUTION_LOCKED') return e.locked
    if (error.code === 'CHECKLIST_EXECUTION_TRANSITION_INVALID')
      return e.transitionInvalid
    if (error.code === 'MISSION_STATUS_INVALID') return e.missionStatusInvalid
    if (error.code === 'CHECKLIST_NOT_READY')
      return error.message.includes('EVIDENCE_TYPE_NOT_ELIGIBLE')
        ? e.evidenceTypeNotEligible
        : error.message.includes('INSUFFICIENT_EVIDENCE')
          ? e.insufficientEvidence
          : e.notReady
    if (error.status === 409) return e.conflict
  }
  return e.generic
}

export function MonitoringChecklistSection({
  missionId,
  data,
  loading,
  error,
  canExecute = false,
  canAssess = false,
  resultStatus,
  resultNote,
  resultKnown = true,
  refresh,
  canAttach = false,
  canDetach = false,
  loadEvidenceCandidates,
  attachEvidenceCandidate,
  compact = false,
  hideImplementationHints = false,
  preview = false,
}: {
  missionId: string
  hideImplementationHints?: boolean
  data?: MissionChecklistResponse
  loading: boolean
  error?: unknown
  canExecute?: boolean
  canAssess?: boolean
  resultStatus?: MissionResultApprovalStatus | null
  resultNote?: string | null
  resultKnown?: boolean
  refresh: () => void
  canAttach?: boolean
  canDetach?: boolean
  loadEvidenceCandidates?: (page: number) => Promise<EvidenceCandidate[]>
  attachEvidenceCandidate?: (
    media: EvidenceCandidate,
    item: MissionChecklistExecution,
  ) => Promise<unknown>
  /** Dense acceptance panel: one line per item, only the active item expands. */
  compact?: boolean
  /** Read-only preview shown before the pilot accepts the mission. */
  preview?: boolean
}) {
  const { t, lang, locale } = useI18n(monitoringChecklistMessages)
  const [openId, setOpenId] = useState<string | null>(null)
  const locked =
    resultStatus === 'PENDING_MANAGER_APPROVAL' || resultStatus === 'APPROVED'
  const canEditExecution =
    canExecute && resultKnown && !locked && !loading && !error
  const canEditAssessment =
    canAssess && resultKnown && !locked && !loading && !error
  const editable = canEditExecution || canEditAssessment
  const rows = [...(data?.executions ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
  )
  const done = rows.filter((row) => terminal(row.executionStatus)).length
  const attachedEvidence = new Set(
    rows.flatMap((row) => (row.evidence ?? []).map((item) => item.evidenceId)),
  ).size
  if (compact) {
    const firstTodo = rows.find((row) => !terminal(row.executionStatus))
    const activeId =
      openId === ''
        ? null
        : rows.some((row) => row.id === openId)
          ? openId
          : (firstTodo ?? rows[0])?.id
    const canChange =
      (data?.checklistEvidenceReady ?? data?.readyForSubmission) === true
    return (
      <section
        className="monitoring-checklist odm-card is-compact"
        aria-label={t.ariaChecklist}
      >
        <header>
          <h2>{t.compactTitle}</h2>
          <span className="mc-count" title={t.progressTitle}>
            {t.doneCount(done, rows.length)}
            <small>{t.attachedCount(attachedEvidence)}</small>
          </span>
        </header>
        <div className="mc-progress" aria-hidden="true">
          <span
            style={{
              width: rows.length ? `${(done / rows.length) * 100}%` : '0%',
            }}
          />
        </div>
        {loading && (
          <p role="status" className="mc-note">
            {t.loading}
          </p>
        )}
        {error ? (
          <div role="alert" className="mc-note is-danger">
            <p>{monitoringErrorMessage(error, lang)}</p>
            <button type="button" className="odm-btn" onClick={refresh}>
              {t.retry}
            </button>
          </div>
        ) : null}
        {!loading && !error && data ? (
          <>
            {resultStatus === 'REJECTED' && (
              <p className="mc-note is-warn">
                {t.rejected}
                {resultNote ? `: ${resultNote}` : ''}
              </p>
            )}
            {data.legacySnapshot && <p className="mc-note">{t.legacy}</p>}
            {!rows.length && <p className="mc-note">{t.none}</p>}
            {!hideImplementationHints && !editable && rows.length > 0 && (
              <p className="mc-note">
                {locked ? t.readOnlyLocked : t.readOnlyNoPermission}
              </p>
            )}
            {!canChange &&
              done === rows.length &&
              rows.length > 0 &&
              !data.readyForSubmission && (
                <p className="mc-note is-warn" role="alert">
                  {t.notReadyServer}
                </p>
              )}
          </>
        ) : null}
        {data && (
          <ol className="mc-list">
            {rows.map((item, index) => {
              const open = item.id === activeId
              const finished = terminal(item.executionStatus)
              const missing =
                finished &&
                item.executionStatus === 'COMPLETED' &&
                (evidenceShortfall(item) > 0 ||
                  Boolean(
                    item.blockingReasons?.some((reason) =>
                      [
                        'EVIDENCE_TYPE_NOT_ELIGIBLE',
                        'MEDIA_REJECTED',
                        'MEDIA_NOT_VALIDATED',
                        'EVIDENCE_SOURCE_NOT_ELIGIBLE',
                      ].includes(reason),
                    ),
                  ))
              const tone =
                item.executionStatus === 'UNABLE_TO_VERIFY'
                  ? 'is-unable'
                  : finished
                    ? missing
                      ? 'is-missing'
                      : 'is-done'
                    : item.id === firstTodo?.id
                      ? 'is-current'
                      : ''
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
                        {item.executionStatus === 'UNABLE_TO_VERIFY'
                          ? `${item.eligibleEvidenceCount ?? 0}/0`
                          : evidenceCountLabel(item)}{' '}
                        {t.evidenceWord} ·{' '}
                        {evidenceTypeLabel(t, item.requiredEvidenceType)}
                        {item.executionStatus !== 'UNABLE_TO_VERIFY' &&
                          evidenceShortfall(item) > 0 && (
                            <> · {t.missingCount(evidenceShortfall(item))}</>
                          )}
                        {item.blockingReasons?.includes(
                          'EVIDENCE_TYPE_NOT_ELIGIBLE',
                        ) && ` · ${t.needExactType}`}
                      </span>
                    </span>
                    {tone === 'is-current' && (
                      <span className="mc-chip is-todo">{t.chipTodo}</span>
                    )}
                    {tone === 'is-missing' && (
                      <span className="mc-chip is-pending">
                        {t.chipMissing}
                      </span>
                    )}
                    {tone === 'is-unable' && (
                      <span className="mc-chip is-danger">{t.chipUnable}</span>
                    )}
                    <span className="mc-caret" aria-hidden="true" />
                  </button>
                  {open && (
                    <div className="mc-detail">
                      <ChecklistGuidance guidance={item} defaultOpen />
                      <ChecklistExecutionItem
                        key={`${missionId}:${item.id}`}
                        item={item}
                        missionId={missionId}
                        canExecute={canEditExecution}
                        canAssess={canEditAssessment}
                        rejected={resultStatus === 'REJECTED'}
                        refresh={refresh}
                        compact
                      />
                      <ChecklistEvidencePanel
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
                        refresh={refresh}
                        loadCandidates={loadEvidenceCandidates}
                        attachCandidate={attachEvidenceCandidate}
                        compact
                      />
                      {item.updatedAt && (
                        <small className="mc-updated">
                          {t.updatedAt(formatUpdated(item.updatedAt, locale))}
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
      <div
        className="monitoring-checklist mc-preview"
        aria-label={t.ariaResult}
      >
        <div className="mc-preview-notice" role="note">
          <strong>{t.previewTitle}</strong>
          <span>{t.previewBody}</span>
        </div>
        {loading && <p role="status">{t.loading}</p>}
        {error ? (
          <div role="alert">
            <p>{monitoringErrorMessage(error, lang)}</p>
            <button type="button" className="odm-btn" onClick={refresh}>
              {t.retry}
            </button>
          </div>
        ) : null}
        {data && !rows.length && !loading && <p>{t.none}</p>}
        {data && (
          <ol className="mc-preview-list">
            {rows.map((item) => (
              <li key={`preview:${missionId}:${item.id}`}>
                <span className="mc-preview-mark" aria-hidden="true">
                  ○
                </span>
                <span className="mc-preview-text">
                  <strong>{item.content}</strong>
                  <small>
                    {t.statuses[item.executionStatus]} · {t.minEvidence}:{' '}
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
    <section
      className="monitoring-checklist odm-card"
      aria-label={t.ariaResult}
    >
      <header>
        <div>
          <h2>{t.heading}</h2>
          {!hideImplementationHints && <p>{t.headingHint}</p>}
        </div>
        <button
          type="button"
          className="odm-btn"
          onClick={refresh}
          disabled={loading}
          title={t.reloadTitle}
        >
          <span aria-hidden="true">↻</span> {t.reload}
        </button>
      </header>
      {loading && <p role="status">{t.loadingWithResult}</p>}
      {error ? (
        <div role="alert">
          <p>{monitoringErrorMessage(error, lang)}</p>
          <button type="button" className="odm-btn" onClick={refresh}>
            {t.retry}
          </button>
        </div>
      ) : null}
      {!loading && !error && data ? (
        <>
          <div
            className={`monitoring-summary${(data.checklistEvidenceReady ?? data.readyForSubmission) ? ' is-ready' : ''}`}
            role="status"
          >
            <strong>
              {(data.checklistEvidenceReady ?? data.readyForSubmission)
                ? t.ready
                : t.notReady}
            </strong>
            <span>
              {t.terminalSummary(done, rows.length, rows.length - done)}
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
                  {evidenceReason[reason]}
                </p>
              ))}
            {resultStatus && (
              <p>
                {t.resultStatusLabel}: {t.resultStatuses[resultStatus]}
              </p>
            )}
            {resultStatus === 'REJECTED' && resultNote && (
              <p>
                {t.managerNote}: {resultNote}
              </p>
            )}
            {!data.readyForSubmission && done === rows.length && (
              <p role="alert" className="is-warn">
                {t.notReadyServer}
              </p>
            )}
            {data.legacySnapshot && <p>{t.legacyLong}</p>}
            {!rows.length && <p>{t.none}</p>}
            {!hideImplementationHints && (
              <p className="monitoring-hint">
                {locked
                  ? t.readOnlyLocked
                  : editable
                    ? t.hintEditable
                    : t.hintLocked}
              </p>
            )}
          </div>
        </>
      ) : null}
      {data && (
        <ol className="monitoring-list">
          {rows.map((item) => (
            <li key={`evidence:${missionId}:${item.id}`}>
              <ChecklistExecutionItem
                key={`${missionId}:${item.id}`}
                item={item}
                missionId={missionId}
                canExecute={canEditExecution}
                canAssess={canEditAssessment}
                rejected={resultStatus === 'REJECTED'}
                refresh={refresh}
              />
              <ChecklistEvidencePanel
                missionId={missionId}
                item={item}
                canAttach={
                  canAttach && resultKnown && !locked && !loading && !error
                }
                canDetach={
                  canDetach && resultKnown && !locked && !loading && !error
                }
                refresh={refresh}
                loadCandidates={loadEvidenceCandidates}
                attachCandidate={attachEvidenceCandidate}
              />
            </li>
          ))}
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
}: {
  item: MissionChecklistExecution
  missionId: string
  canExecute: boolean
  canAssess: boolean
  rejected: boolean
  refresh: () => void
  compact?: boolean
}) {
  const editable = canExecute || canAssess
  const { t, lang, locale } = useI18n(monitoringChecklistMessages)
  const [editing, setEditing] = useState(false)
  const [base, setBase] = useState(item)
  const [status, setStatus] = useState(item.executionStatus)
  const [assessment, setAssessment] = useState(item.assessmentStatus)
  const [observation, setObservation] = useState(item.observation ?? '')
  const [reason, setReason] = useState(item.unableToVerifyReason ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  function reset() {
    setBase(item)
    setStatus(item.executionStatus)
    setAssessment(item.assessmentStatus)
    setObservation(item.observation ?? '')
    setReason(item.unableToVerifyReason ?? '')
    setConflict(false)
    setError(null)
  }
  async function save() {
    if (!editable || busy || conflict) return
    if (canExecute && status === 'UNABLE_TO_VERIFY' && !reason.trim()) {
      setError(t.errors.reasonRequired)
      return
    }
    if (observation.length > 2000 || reason.length > 1000) {
      setError(t.errors.tooLong)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const updated =
        await checklistExecutionApi.updateMissionChecklistExecution(
          missionId,
          item.id,
          {
            expectedVersion: base.version,
            executionStatus: canExecute ? status : base.executionStatus,
            assessmentStatus: canAssess ? assessment : base.assessmentStatus,
            observation: canExecute
              ? observation.trim() || null
              : base.observation,
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
      setError(monitoringErrorMessage(cause, lang))
      if (cause instanceof ApiError && cause.code === 'CONCURRENT_UPDATE')
        setConflict(true)
      // Never retry a mutation automatically. Refresh authority/versions after any rejected save.
      refresh()
    } finally {
      setBusy(false)
    }
  }
  if (compact) {
    return (
      <div className="monitoring-item mc-item-body">
        {error && <p role="alert">{error}</p>}
        {!editing ? (
          <>
            <dl className="mc-fields">
              <div>
                <dt>{t.fieldStatus}</dt>
                <dd>{t.statuses[item.executionStatus]}</dd>
              </div>
              <div>
                <dt>{t.fieldAssessment}</dt>
                <dd>{t.assessments[item.assessmentStatus]}</dd>
              </div>
              <div className="is-wide">
                <dt>{t.fieldNote}</dt>
                <dd className={item.observation ? undefined : 'is-empty'}>
                  {item.observation || t.noNote}
                </dd>
              </div>
              {item.unableToVerifyReason && (
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
                {t.edit}
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
                  {t.execStatus}

                  <select
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value as ChecklistExecutionStatus)
                      if (event.target.value !== 'UNABLE_TO_VERIFY')
                        setReason('')
                    }}
                  >
                    {allowedExecutionStatuses(
                      base.executionStatus,
                      rejected,
                    ).map((value) => (
                      <option key={value} value={value}>
                        {t.statuses[value]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {canAssess && (
                <label>
                  {t.assessLabel}

                  <select
                    value={assessment}
                    onChange={(event) =>
                      setAssessment(
                        event.target.value as ChecklistAssessmentStatus,
                      )
                    }
                  >
                    {(
                      Object.keys(t.assessments) as ChecklistAssessmentStatus[]
                    ).map((value) => (
                      <option key={value} value={value}>
                        {t.assessments[value]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {canAssess && <p className="mc-help">ⓘ {t.assessHelp}</p>}
              {canExecute && (
                <label>
                  {t.observation}

                  <textarea
                    maxLength={2000}
                    placeholder={t.observationPlaceholder}
                    value={observation}
                    onChange={(event) => setObservation(event.target.value)}
                  />
                </label>
              )}
              {canExecute && (
                <small className="mc-counter">
                  {observation.length} / 2000
                </small>
              )}
              {canExecute && status === 'UNABLE_TO_VERIFY' && (
                <label>
                  {t.unableReason}

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
                  {t.useFresh}
                </button>
              )}
              <div className="mc-form-actions">
                <button
                  type="button"
                  className="mc-cancel"
                  onClick={() => setEditing(false)}
                >
                  {t.cancel}
                </button>
                <button
                  className="odm-btn odm-btn-p"
                  type="submit"
                  disabled={conflict || busy}
                >
                  {t.save}
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
      {!compact && <h3>{item.content}</h3>}
      {!compact && <ChecklistGuidance guidance={item} defaultOpen />}
      {(!compact || item.assessmentStatus !== 'NOT_ASSESSED') && (
        <div className="monitoring-meta">
          {!compact && (
            <span className={`is-exec-${item.executionStatus.toLowerCase()}`}>
              {t.statuses[item.executionStatus]}
            </span>
          )}
          {item.assessmentStatus !== 'NOT_ASSESSED' && (
            <span
              className={`is-assess-${item.assessmentStatus.toLowerCase()}`}
            >
              {t.assessments[item.assessmentStatus]}
            </span>
          )}
        </div>
      )}
      {item.observation && (
        <p>
          <strong>{t.observationShort}:</strong> {item.observation}
        </p>
      )}
      {item.unableToVerifyReason && (
        <p>
          <strong>{t.unableReason}:</strong> {item.unableToVerifyReason}
        </p>
      )}
      {!compact && item.updatedAt && (
        <small>
          {t.updatedAtColon(new Date(item.updatedAt).toLocaleString(locale))}
        </small>
      )}
      {error && <p role="alert">{error}</p>}
      {editable && !editing && (
        <button
          type="button"
          className={compact ? 'mc-link' : 'odm-btn'}
          onClick={() => {
            reset()
            setEditing(true)
          }}
        >
          {t.updateItem}
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
            {canExecute && (
              <label>
                {t.execStatus}

                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as ChecklistExecutionStatus)
                    if (event.target.value !== 'UNABLE_TO_VERIFY') setReason('')
                  }}
                >
                  {allowedExecutionStatuses(base.executionStatus, rejected).map(
                    (value) => (
                      <option key={value} value={value}>
                        {t.statuses[value]}
                      </option>
                    ),
                  )}
                </select>
              </label>
            )}
            {canAssess && (
              <label>
                {t.assessLabel}

                <select
                  value={assessment}
                  onChange={(event) =>
                    setAssessment(
                      event.target.value as ChecklistAssessmentStatus,
                    )
                  }
                >
                  {(
                    Object.keys(t.assessments) as ChecklistAssessmentStatus[]
                  ).map((value) => (
                    <option key={value} value={value}>
                      {t.assessments[value]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {canAssess && <small>{t.assessHelpLong}</small>}
            {canExecute && (
              <label>
                {t.observation}

                <textarea
                  maxLength={2000}
                  value={observation}
                  onChange={(event) => setObservation(event.target.value)}
                />
              </label>
            )}
            {canExecute && <small>{observation.length} / 2000</small>}
            {canExecute && status === 'UNABLE_TO_VERIFY' && (
              <label>
                {t.unableReason}

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
                {t.useFresh}
              </button>
            )}
            <div className="monitoring-actions">
              <button
                className="odm-btn odm-btn-p"
                type="submit"
                disabled={conflict || busy}
              >
                {t.saveItem}
              </button>
              <button
                className="odm-btn"
                type="button"
                onClick={() => setEditing(false)}
              >
                {t.cancelEdit}
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  )
}
