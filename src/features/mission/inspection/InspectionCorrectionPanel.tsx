import { SupplementInspectionResult } from './SupplementInspectionResult'
import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Input, Tag, Radio } from 'antd'
import {
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import type { MissionChecklistExecution } from '../types/checklistExecution'
import { customerSelectionProgress } from '../lib/customerEvidenceSelection'
import { operatorHref } from '../../drone-operator/routes'
import { managerHref } from '../../manager/routes'
import { inspectionCorrectionApi, type CorrectionMode } from './inspectionCorrectionApi'
import { inspectionCorrectionMessages } from './inspectionCorrection.messages'
import './InspectionCorrectionPanel.css'
import { CorrectionEvidenceGallery } from './CorrectionEvidenceGallery'
type Props = {
  missionId: string
  rows?: MissionChecklistExecution[]
  canRequest?: boolean
  canRespond?: boolean
  manager?: boolean
  orderId?: string
  refresh?: () => void
  onReviewChecklist?: (executionId?: string) => void
}
export function InspectionCorrectionPanel(props: Props) {
  return <CorrectionContent key={props.missionId} {...props} />
}
function CorrectionContent({
  missionId,
  rows = [],
  canRequest = false,
  canRespond = false,
  manager = false,
  orderId,
  refresh,
  onReviewChecklist,
}: Props) {
  const { t, locale } = useI18n(inspectionCorrectionMessages)
  const query = useApiQuery(
    (signal) => inspectionCorrectionApi.list(missionId, signal),
    [missionId],
  )
  const [reasons, setReasons] = useState<Record<string, string>>({}),
    [media, setMedia] = useState<Record<string, string[]>>({})
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null)
  const [resultRefresh, setResultRefresh] = useState(0)
  const [mode, setMode] = useState<CorrectionMode>('DOSSIER_ADJUSTMENT')
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh
  const command = useRef(crypto.randomUUID())
  const active = query.data?.find((row) => row.status !== 'RESOLVED')
  const reviewAttempt = useRef('')
  const reviewSignature = rows.map(row => `${row.id}:${row.version}`).join('|')
  useEffect(() => {
    if (busy || query.loading || !canRequest || active?.mode !== 'DOSSIER_ADJUSTMENT' || active.status !== 'SUBMITTED') return
    const requested = rows.filter(row => active.items.some(item => item.executionId === row.id))
    if (requested.length !== active.items.length || !requested.length
      || requested.some(row => row.assessmentStatus === 'NOT_ASSESSED')) return
    const failed = requested.filter(row => row.assessmentStatus === 'NON_COMPLIANT')
    if (failed.length ? failed.some(row => !row.assessmentNote?.trim())
      : requested.some(row => !row.readyForFinalApproval)) return
    const key = `${active.id}:${active.version}:${reviewSignature}`
    if (reviewAttempt.current === key) return
    reviewAttempt.current = key
    void act(() => inspectionCorrectionApi.reconcileChecklistReview(missionId))
  }, [active, canRequest, reviewSignature, rows, missionId, busy, query.loading])
  const displaySupplement = active ?? query.data?.find(row => row.supplementalMissionStatus === 'COMPLETED')
  const supplementedExecutionIds = new Set(
    (query.data ?? [])
      .filter(
        (correction) =>
          correction.status === 'RESOLVED' &&
          correction.supplementalMissionStatus === 'COMPLETED',
      )
      .flatMap((correction) => correction.items.map((item) => item.executionId)),
  )
  const pendingSourceRows = rows.filter((row) => {
    if (row.fulfilledByMissionId || supplementedExecutionIds.has(row.id)) {
      return false
    }
    if (row.assessmentStatus !== 'COMPLIANT') return true
    if (typeof row.readyForFinalApproval === 'boolean') {
      return !row.readyForFinalApproval
    }
    return !customerSelectionProgress(
      row,
      (row.evidence ?? [])
        .filter((link) => link.selectedForCustomer)
        .map((link) => link.evidenceId),
    ).valid
  })
  const failedRows = rows.filter(
    (row) =>
      !row.fulfilledByMissionId && row.assessmentStatus === 'NON_COMPLIANT',
  )
  const selected = failedRows.map((row) => row.id)
  const reasonFor = (row: MissionChecklistExecution) =>
    reasons[`${row.id}:${row.version}`] ?? row.assessmentNote ?? ''

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) { query.reload(); refreshRef.current?.() }
    }, 15000)
    return () => clearInterval(timer)
  }, [query.reload])
  async function act(operation: () => Promise<unknown>) {
    if (busy || query.loading) return
    setBusy(true)
    setError(null)
    try {
      await operation()
      setReasons({})
      setMedia({})
      command.current = crypto.randomUUID()
      query.reload()
      refresh?.()
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : undefined
      setError(code ?? 'failed')
      query.reload()
    } finally {
      setBusy(false)
    }
  }
  const disabled = busy || query.loading || Boolean(query.error)
  const format = (value: string) =>
    new Date(value).toLocaleString(locale, {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'short',
      timeStyle: 'short',
    })
  const actionName = (action: string) =>
    t.action[action as keyof typeof t.action] ?? t.history
  // Manager sees only an actionable planning request, never the inspection workspace.
  if (manager && !query.error && (active?.status !== 'OPEN' || active.mode === 'DOSSIER_ADJUSTMENT')) return null
  if (
    !manager &&
    !query.error &&
    !query.loading &&
    !query.data?.length &&
    !failedRows.length
  )
    return null
  const reviewingSupplement = !manager && canRequest && Boolean(active?.supplementalMissionId) && active?.supplementalMissionStatus === 'COMPLETED'
  const creatingRequest = canRequest && !active && failedRows.length > 0
  const composingBelowChecklist = creatingRequest && !(query.data?.length)
  const panelTitle = manager ? t.create : t.title
  if (query.loading && !query.data) return <p role="status">{t.loading}</p>
  return (
    <section
      className={`inspection-corrections${reviewingSupplement ? ' inspection-corrections--review' : ''}${composingBelowChecklist ? ' is-composing' : ''}`}
      aria-label={panelTitle}
    >
      <header>
        <div className="inspection-corrections__heading">
          <span className="inspection-corrections__icon" aria-hidden="true">
            <SafetyCertificateOutlined />
          </span>
          <div>
            <span className="inspection-corrections__eyebrow">
              {manager
                ? t.managerRole
                : canRequest
                  ? t.inspectorRole
                  : t.staffRole}
            </span>
            <h3>{reviewingSupplement ? t.reviewTitle : panelTitle}</h3>
            <p>
              {reviewingSupplement
                ? t.reviewHint
                : manager
                  ? t.planHint
                  : composingBelowChecklist
                    ? t.composerSubtitle
                    : active && !canRespond
                      ? active.status === 'SUBMITTED'
                        ? t.activeSubmittedSubtitle
                        : t.activeOpenSubtitle
                      : t.subtitle}
            </p>
          </div>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => { reviewAttempt.current = ''; query.reload(); setResultRefresh(value => value + 1); refresh?.() }}
          disabled={busy}
        >
          {t.refresh}
        </Button>
      </header>
      {query.error ? (
        <Alert type="error" showIcon message={t.loadFailed} />
      ) : (
        <>
          {!manager && !reviewingSupplement && (!creatingRequest || canRespond) && !(active && !canRespond) && (
            <p className="inspection-corrections__guide">
              {canRequest
                ? canRespond
                  ? t.dualRoleGuide
                  : t.inspectorGuide
                : t.staffGuide}
            </p>
          )}
          {!manager && active && (
            <div
              className="inspection-corrections__progress"
              aria-label={t.pending}
            >
              {[t.requestedStep, t.submittedStep, t.resolvedStep].map(
                (label, index) => {
                  const currentStep = active.status === 'OPEN' ? 0 : 1
                  return (
                    <div
                      key={label}
                      className={
                        index === currentStep
                          ? 'is-current'
                          : index < currentStep
                            ? 'is-done'
                            : ''
                      }
                    >
                      <span>{index + 1}</span>
                      {label}
                    </div>
                  )
                },
              )}
            </div>
          )}
          {!query.data?.length && !(canRequest && failedRows.length > 0) && (
            <p>{t.empty}</p>
          )}
          {Boolean(query.data?.length) && <div className="inspection-corrections__review-layout">
          <div className="inspection-corrections__context">
          {query.data
            ?.filter((row) => !manager || row.id === active?.id)
            .map((row, index) => (
              <article
                key={row.id}
                className={`inspection-corrections__request ${row.status === 'RESOLVED' ? 'is-resolved' : ''}`}
              >
                <div className="inspection-corrections__meta">
                  <Tag color="blue">
                    {row.mode === 'DOSSIER_ADJUSTMENT' ? t.dossier : t.flight}
                  </Tag>
                  <strong>
                    {t.number} {query.data!.length - index}
                  </strong>
                  <Tag color={row.status === 'RESOLVED' ? 'green' : 'orange'}>
                    {t.status[row.status]}
                  </Tag>
                  <small>{format(row.requestedAt)}</small>
                  <span className="inspection-corrections__count">
                    {t.itemCount(row.items.length)}
                  </span>
                </div>
                <ol className="inspection-corrections__items">
                  {row.items.map((item, itemIndex) => (
                    <li key={item.executionId}>
                      <span className="inspection-corrections__item-number">
                        {row.status === 'RESOLVED' ? (
                          <CheckCircleOutlined />
                        ) : (
                          itemIndex + 1
                        )}
                      </span>
                      <div>
                        <strong>{item.content}</strong>
                        <p>{item.reason}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                {row.status === 'RESOLVED' && (
                  <p className="inspection-corrections__resolved">
                    {t.resolvedHint}
                  </p>
                )}
                {row.supplementalMissionId && (
                  <p>
                    {t.supplement}:{' '}
                    <a
                      href={
                        manager
                          ? managerHref({
                              screen: 'missionDetail',
                              missionId: row.supplementalMissionId,
                            })
                          : operatorHref({
                              screen: 'missionDetail',
                              missionId: row.supplementalMissionId,
                            })
                      }
                    >
                      {row.supplementalMissionCode}
                    </a>
                  </p>
                )}
                <details className="inspection-corrections__history">
                  <summary>
                    {t.history} ({row.events.length})
                  </summary>
                  {row.events.map((event, i) => (
                    <p className="inspection-corrections__event" key={i}>
                      <strong>{actionName(event.action)}</strong> ·{' '}
                      {format(event.occurredAt)}
                      {event.note && <> — {event.note}</>}
                    </p>
                  ))}
                </details>
              </article>
            ))}
          </div>
          <div className="inspection-corrections__review-main">
          {!manager && canRequest && displaySupplement?.supplementalMissionId && displaySupplement.supplementalMissionStatus === 'COMPLETED' && (
            <SupplementInspectionResult missionId={missionId} correctionId={displaySupplement.id} version={displaySupplement.version} refreshToken={resultRefresh} />
          )}
          {!manager && canRequest && !active && displaySupplement?.status === 'RESOLVED' && displaySupplement.supplementalMissionStatus === 'COMPLETED' && pendingSourceRows.length > 0 && (
            <Alert
              type="warning"
              showIcon
              className="inspection-corrections__next-step"
              message={t.sourceRemainingTitle}
              description={t.sourceRemainingHint(pendingSourceRows.length)}
            />
          )}
          {canRequest && active?.mode === 'SUPPLEMENTAL_FLIGHT' && active.status !== 'RESOLVED' && active.supplementalMissionStatus === 'COMPLETED' && (
            <div className="inspection-corrections__actions inspection-corrections__actions--bar">
              <p>{t.acceptedSupplementHint}</p>
              <Button type="primary" disabled={disabled} onClick={() => void act(() => inspectionCorrectionApi.synchronizeSupplement(missionId, active.id))}>{t.receiveSupplement}</Button>
            </div>
          )}
          {active?.mode === 'DOSSIER_ADJUSTMENT' && (() => {
            const isReview = Boolean(canRequest && active.status === 'SUBMITTED')
            const isCrewStep = Boolean(canRespond && !isReview)
            const inspectionHash = operatorHref({ screen: 'inspection', missionId })
            const alreadyOnInspection =
              typeof window !== 'undefined' &&
              window.location.hash.startsWith(inspectionHash)
            const handleReviewInPlace =
              isReview && onReviewChecklist && alreadyOnInspection
                ? () => {
                    const targetExecution =
                      active.items.find((item) => {
                        const row = rows.find((r) => r.id === item.executionId)
                        return !row || row.assessmentStatus !== 'COMPLIANT' || !row.readyForFinalApproval
                      }) ?? active.items[0]
                    onReviewChecklist(targetExecution?.executionId)
                  }
                : undefined
            return (
              <div className="inspection-corrections__actions inspection-corrections__actions--bar">
                <p>
                  {isReview
                    ? handleReviewInPlace
                      ? t.workflowReviewHereHint
                      : t.workflowReviewHint
                    : isCrewStep
                      ? t.workflowStaffHint
                      : t.workflowWaitingHint}
                </p>
                {handleReviewInPlace ? (
                  <Button type="primary" onClick={handleReviewInPlace}>
                    {t.workflowReview}
                  </Button>
                ) : (
                  <Button
                    type={isReview || isCrewStep ? 'primary' : 'default'}
                    href={operatorHref({
                      screen: isReview ? 'inspection' : 'corrections',
                      missionId,
                    })}
                  >
                    {isReview
                      ? t.workflowReview
                      : isCrewStep
                        ? t.workflowOpen
                        : t.workflowTrack}
                  </Button>
                )}
              </div>
            )
          })()}
          </div>
          </div>}
          {creatingRequest && (
            <div className="inspection-corrections__form inspection-corrections__composer">
              <div className="inspection-corrections__meta">
                <h4>{t.strategy}</h4>
              </div>
              <Radio.Group className="inspection-corrections__strategy" aria-label={t.strategy} value={mode} onChange={e => setMode(e.target.value)} disabled={disabled}>
                <Radio value="DOSSIER_ADJUSTMENT" aria-label={t.dossier}>
                  <span className="inspection-corrections__strategy-copy">
                    <strong className="inspection-corrections__strategy-title">{t.dossier}</strong>
                    <span className="inspection-corrections__strategy-desc">{t.dossierHint}</span>
                  </span>
                </Radio>
                <Radio value="SUPPLEMENTAL_FLIGHT" aria-label={t.flight}>
                  <span className="inspection-corrections__strategy-copy">
                    <strong className="inspection-corrections__strategy-title">{t.flight}</strong>
                    <span className="inspection-corrections__strategy-desc">{t.flightHint}</span>
                  </span>
                </Radio>
              </Radio.Group>
              <h4>{t.choose} ({failedRows.length})</h4>
              {failedRows.map((row, index) => (
                <div
                  key={row.id}
                  className="inspection-corrections__choice"
                >
                  <div className="inspection-corrections__finding-title">
                    <div className="inspection-corrections__finding-heading">
                      <span className="inspection-corrections__item-number">{index + 1}</span>
                      <strong>{row.content}</strong>
                    </div>
                    <Tag color="red">{t.failedBadge}</Tag>
                  </div>
                  {selected.includes(row.id) && (
                    <>
                      <label>
                        {t.reason}
                        <Input.TextArea
                          aria-label={`${t.reason}: ${row.content}`}
                          value={reasonFor(row)}
                          maxLength={2000}
                          placeholder={t.reasonHint}
                          disabled={disabled}
                          onChange={(e) =>
                            setReasons({
                              ...reasons,
                              [`${row.id}:${row.version}`]: e.target.value,
                            })
                          }
                        />
                      </label>
                      {!!row.evidence?.length && (
                        <CorrectionEvidenceGallery
                          missionId={missionId}
                          executionId={row.id}
                          links={row.evidence}
                          selected={media[row.id] ?? []}
                          disabled={disabled}
                          onChange={(ids) =>
                            setMedia((current) => ({
                              ...current,
                              [row.id]: ids,
                            }))
                          }
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
              <div className="inspection-corrections__submit-bar">
                <span className="inspection-corrections__submit-summary">
                  {t.composeSummary(
                    selected.length,
                    mode === 'DOSSIER_ADJUSTMENT' ? t.dossier : t.flight,
                  )}
                </span>
                <Button
                  type="primary"
                  disabled={
                    disabled ||
                    !selected.length ||
                    failedRows.some((row) => !reasonFor(row).trim())
                  }
                  onClick={() =>
                    void act(() =>
                      inspectionCorrectionApi.request(
                        missionId,
                        command.current,
                        selected.map((id) => ({
                          executionId: id,
                          expectedVersion: rows.find((row) => row.id === id)!
                            .version,
                          reason: reasonFor(
                            rows.find((row) => row.id === id)!,
                          ).trim(),
                          mediaIds: media[id] ?? [],
                        })),
                        mode,
                      ),
                    )
                  }
                >
                  {t.send}
                </Button>
              </div>
            </div>
          )}
          {manager && active?.status === 'OPEN' && active.mode !== 'DOSSIER_ADJUSTMENT' && orderId && (
            <div className="inspection-corrections__form">
              <details>
                <summary>{t.supplement}</summary>
                <p>{t.fieldNote}</p>
              </details>
              <Button
                type="primary"
                href={managerHref({
                  screen: 'inspectionPlanning',
                  orderId,
                  sourceMissionId: missionId,
                  correctionId: active.id,
                })}
                disabled={disabled}
              >
                {active.supplementalMissionId &&
                !['CANCELLED','FAILED'].includes(active.supplementalMissionStatus ?? '')
                  ? t.openPlanning
                  : t.plan}
              </Button>
            </div>
          )}
        </>
      )}
      {error && (
        <Alert
          type="error"
          showIcon
          message={
            [
              'CONCURRENT_UPDATE',
              'INSPECTION_CORRECTION_STATE_CONFLICT',
              'EXECUTION_PLAN_REVISION_CONFLICT',
            ].includes(error)
              ? t.stale
              : [
                    'CHECKLIST_NOT_READY',
                    'INSPECTION_CORRECTION_PENDING',
                  ].includes(error)
                ? t.notReady
                : error === 'RESOURCE_TIME_CONFLICT'
                  ? t.resourceConflict
                  : error === 'ACCESS_DENIED'
                    ? t.forbidden
                    : t.failed
          }
        />
      )}
    </section>
  )
}
