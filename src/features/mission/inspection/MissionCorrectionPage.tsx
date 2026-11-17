import { useEffect, useState } from 'react'
import { Alert, Button, Input, Tag } from 'antd'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { ApiError } from '../../../shared/api/httpClient'
import { useMissionMonitoring } from '../hooks/useMissionMonitoring'
import { UploadMediaPage } from '../../drone-operator/pages/UploadMedia/UploadMediaPage'
import { operatorHref } from '../../drone-operator/routes'
import { inspectionCorrectionApi } from './inspectionCorrectionApi'
import { InspectionCorrectionPanel } from './InspectionCorrectionPanel'
import { CorrectionEvidenceGallery } from './CorrectionEvidenceGallery'
import { evidenceCountLabel } from '../lib/evidenceProgress'
import { inspectionCorrectionMessages } from './inspectionCorrection.messages'
import { missionCorrectionPageMessages } from './MissionCorrectionPage.messages'
import './MissionCorrectionPage.css'

type Step = 'overview' | 'media' | 'evidence' | 'submit'
export function MissionCorrectionPage({ missionId }: { missionId: string }) {
  return <CorrectionWorkspace key={missionId} missionId={missionId} />
}
function CorrectionWorkspace({ missionId }: { missionId: string }) {
  const { t, locale, lang } = useI18n(missionCorrectionPageMessages)
  const { t: correctionText } = useI18n(inspectionCorrectionMessages)
  const query = useApiQuery(
    (signal) => inspectionCorrectionApi.list(missionId, signal),
    [missionId],
  )
  const monitoring = useMissionMonitoring(missionId)
  const [step, setStep] = useState<Step>('overview')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [workspaceBusy, setWorkspaceBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const correction =
    query.data?.find((row) => row.status !== 'RESOLVED') ?? query.data?.[0]
  useEffect(() => {
    if (correction?.mode === 'DOSSIER_ADJUSTMENT' && correction.status === 'SUBMITTED'
      && monitoring.data?.permissions.canAssessMonitoringChecklist)
      window.location.hash = operatorHref({ screen: 'inspection', missionId })
  }, [correction?.mode, correction?.status, monitoring.data?.permissions.canAssessMonitoringChecklist, missionId])
  const latestReturn = correction?.events
    .slice()
    .reverse()
    .find((event) => event.action === 'RETURNED')
  const permissions = monitoring.data?.permissions
  const active = correction?.status === 'OPEN'
  const canRespond =
    active &&
    (permissions?.canAttachChecklistEvidence === true ||
      permissions?.canExecuteMonitoringChecklist === true)
  const canReview =
    correction?.status === 'SUBMITTED' &&
    permissions?.canAssessMonitoringChecklist === true
  const executionIds = correction?.items.map((item) => item.executionId).filter(id =>
    !active || monitoring.data?.checklist.executions.find(row => row.id === id)?.assessmentStatus !== 'COMPLIANT',
  ) ?? []
  const rows =
    monitoring.data?.checklist.executions.filter((row) =>
      executionIds.includes(row.id),
    ) ?? []
  const scopeKnown = Boolean(
    correction && rows.length === executionIds.length && rows.length > 0,
  )
  const evidenceReady =
    scopeKnown &&
    rows.every(
      (row) =>
        row.evidenceReady === true &&
        (row.evidence ?? []).every(
          (link) => link.eligibleForOperationalReadiness === true,
        ),
    )
  const disabled =
    busy ||
    workspaceBusy ||
    query.loading ||
    (!monitoring.data && monitoring.loading) ||
    Boolean(query.error || monitoring.error)
  function refresh() {
    query.reload()
    monitoring.reload()
  }
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden && !workspaceBusy && !busy) query.reload()
    }, 15000)
    return () => clearInterval(timer)
  }, [query.reload, workspaceBusy, busy])
  async function decide(
    action: 'resubmit' | 'require-flight',
  ) {
    if (!correction || disabled || !note.trim()) return
    setBusy(true)
    setError(null)
    try {
      await inspectionCorrectionApi.decide(
        missionId,
        correction,
        action,
        note.trim(),
      )
      setNote('')
      setStep('overview')
      refresh()
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : undefined
      setError(
        code === 'CONCURRENT_UPDATE' ||
          code === 'INSPECTION_CORRECTION_STATE_CONFLICT'
          ? t.stale
          : code === 'CHECKLIST_NOT_READY'
            ? t.blocked
            : code === 'ACCESS_DENIED'
              ? t.denied
              : t.failed,
      )
      refresh()
    } finally {
      setBusy(false)
    }
  }
  function go(next: Step) {
    if (disabled) return
    setStep(next)
    setError(null)
    refresh()
  }
  const steps: { id: Step; label: string }[] = [
    { id: 'overview', label: t.overview },
    { id: 'media', label: t.media },
    { id: 'evidence', label: t.evidence },
    { id: 'submit', label: t.submit },
  ]
  return (
    <main className="mission-correction-workspace">
      <header className="mcw-header">
        <div>
          <a href={operatorHref({ screen: 'missionDetail', missionId })}>
            <ArrowLeftOutlined /> {t.back}
          </a>
          <h1>{canReview ? t.inspectorTitle : t.title}</h1>
          <p>{canReview ? t.reviewHint : t.guide}</p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          disabled={busy || workspaceBusy}
          onClick={refresh}
        >
          {t.refresh}
        </Button>
      </header>
      {query.error || monitoring.error ? (
        <Alert type="error" showIcon message={t.loadFailed} />
      ) : !query.data || !monitoring.data ? (
        <p role="status">{t.loading}</p>
      ) : !correction ? (
        <Alert type="info" message={t.noRequest} />
      ) : (
        <>
          <div className="mcw-context">
            <Tag color={canReview ? 'purple' : 'blue'}>
              {canReview ||
              (!canRespond && permissions?.canAccessMissionInspection)
                ? t.inspector
                : t.reporter}
            </Tag>
            <strong>{t.count(correction.items.length)}</strong>
            <span>
              {new Date(correction.requestedAt).toLocaleString(locale, {
                timeZone: 'Asia/Ho_Chi_Minh',
              })}
            </span>
          </div>
          {correction.mode !== 'DOSSIER_ADJUSTMENT' ? (
            <>
              <Alert type="info" showIcon message={t.flight} />
              <InspectionCorrectionPanel
                missionId={missionId}
                rows={monitoring.data.checklist.executions}
                canRequest={permissions?.canAssessMonitoringChecklist}
                canRespond={permissions?.canAttachChecklistEvidence}
                refresh={refresh}
              />
            </>
          ) : correction.status === 'RESOLVED' ? (
            <section className="mcw-section mcw-success">
              <CheckCircleOutlined />
              <h2>{t.resolved}</h2>
              <p>{t.resolvedHint}</p>
              {permissions?.canAccessMissionInspection && (
                <Button
                  type="primary"
                  href={operatorHref({ screen: 'inspection', missionId })}
                >
                  {t.inspection}
                </Button>
              )}
            </section>
          ) : (
            <>
              {canRespond && (
                <nav className="mcw-steps" aria-label={t.title}>
                  {steps.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={disabled}
                      aria-label={item.label}
                      aria-current={step === item.id ? 'step' : undefined}
                      onClick={() => go(item.id)}
                    >
                      <span>{index + 1}</span>
                      <strong>
                        {item.label}
                        {item.id === 'media' && <small>{t.optional}</small>}
                      </strong>
                    </button>
                  ))}
                </nav>
              )}
              {!canRespond && !canReview && (
                <Alert
                  type="info"
                  showIcon
                  message={
                    correction.status === 'SUBMITTED'
                      ? t.waiting
                      : t.waitingCrew
                  }
                  description={
                    correction.status === 'SUBMITTED'
                      ? t.waitingHint
                      : undefined
                  }
                />
              )}
              {(step === 'overview' || !canRespond) && (
                <details
                  className="mcw-section"
                  open={canRespond && step === 'overview'}
                >
                  <summary>
                    {t.requested} ({correction.items.length})
                  </summary>
                  {active && latestReturn?.note && (
                    <Alert
                      type="warning"
                      showIcon
                      message={t.latestFinding}
                      description={latestReturn?.note}
                    />
                  )}

                  <ol className="mcw-findings">
                    {correction.items.filter(item => !active || executionIds.includes(item.executionId)).map((item) => {
                      const related =
                        rows
                          .find((row) => row.id === item.executionId)
                          ?.evidence?.filter((link) =>
                            item.mediaIds.includes(link.mediaId),
                          ) ?? []
                      return (
                        <li key={item.executionId}>
                          <h3>{item.content}</h3>
                          <small>{t.reason}</small>
                          <p>{active ? rows.find(row => row.id === item.executionId)?.assessmentNote || item.reason : item.reason}</p>
                          {related.length > 0 && (
                            <CorrectionEvidenceGallery
                              missionId={missionId}
                              executionId={item.executionId}
                              links={related}
                              selected={[]}
                              disabled
                              onChange={() => {}}
                              readOnly
                            />
                          )}
                        </li>
                      )
                    })}
                  </ol>
                  {canRespond && (
                    <div className="mcw-actions">
                      <Button
                        type="primary"
                        onClick={() => go('evidence')}
                        disabled={disabled}
                      >
                        {t.existing}
                      </Button>
                      <Button onClick={() => go('media')} disabled={disabled}>
                        {t.addFiles}
                      </Button>
                    </div>
                  )}
                </details>
              )}
              {canRespond && (step === 'media' || step === 'evidence') && (
                <section className="mcw-section">
                  <h2>{step === 'media' ? t.media : t.evidence}</h2>
                  <p>{step === 'media' ? t.mediaHint : t.evidenceHint}</p>
                  <UploadMediaPage
                    missionId={missionId}
                    mode={step === 'media' ? 'media' : 'checklist'}
                    embedded
                    correctionStage="evidence"
                    executionIds={executionIds}
                    onBusyChange={setWorkspaceBusy}
                    onEvidenceChanged={refresh}
                  />
                  <div className="mcw-actions">
                    <Button onClick={() => go('overview')} disabled={disabled}>
                      {t.previous}
                    </Button>
                    <Button
                      type="primary"
                      aria-label={
                        step === 'media' ? t.nextEvidence : t.nextSubmit
                      }
                      icon={<ArrowRightOutlined />}
                      disabled={disabled}
                      onClick={() =>
                        go(step === 'media' ? 'evidence' : 'submit')
                      }
                    >
                      {step === 'media' ? t.nextEvidence : t.nextSubmit}
                    </Button>
                  </div>
                </section>
              )}
              {canRespond && step === 'submit' && (
                <section className="mcw-section">
                  <h2>{t.submit}</h2>
                  {!evidenceReady && (
                    <Alert
                      type="warning"
                      showIcon
                      message={t.blocked}
                    />
                  )}
                  <ul className="mcw-validation">
                    {rows.map((row) => (
                      <li key={row.id}>
                        <strong>{row.content}</strong>
                        <span>{evidenceCountLabel(row, lang)}</span>
                        <Tag
                          color={
                            (
                              canReview
                                ? row.readyForFinalApproval
                                : row.evidenceReady
                            )
                              ? 'green'
                              : 'orange'
                          }
                        >
                          {(
                            canReview
                              ? row.readyForFinalApproval
                              : row.evidenceReady
                          )
                            ? t.ready
                            : t.needsWork}
                        </Tag>
                      </li>
                    ))}
                  </ul>
                  <label htmlFor="correction-note">
                    {t.note}
                  </label>
                  <Input.TextArea
                    id="correction-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={4}
                    maxLength={2000}
                    disabled={disabled}
                    placeholder={t.noteHint}
                  />
                  <div className="mcw-actions">

                      <>
                        <Button
                          disabled={disabled}
                          onClick={() => go('evidence')}
                        >
                          {t.previous}
                        </Button>
                        <Button
                          type="primary"
                          disabled={disabled || !note.trim() || !evidenceReady}
                          onClick={() => void decide('resubmit')}
                        >
                          {t.resend}
                        </Button>
                      </>

                  </div>
                  {canRespond && (
                    <details>
                      <summary>{t.details}</summary>
                      <p>{t.escalateHint}</p>
                      <Button
                        disabled={disabled || !note.trim()}
                        onClick={() => void decide('require-flight')}
                      >
                        {t.escalate}
                      </Button>
                    </details>
                  )}
                </section>
              )}
            </>
          )}
          <details className="mcw-section">
            <summary>
              {t.history} ({correction.events.length})
            </summary>
            {correction.events.map((event, index) => (
              <p key={index}>
                <strong>
                  {correctionText.action[
                    event.action as keyof typeof correctionText.action
                  ] ?? correctionText.history}
                </strong>
                {' · '}
                <time>
                  {new Date(event.occurredAt).toLocaleString(locale, {
                    timeZone: 'Asia/Ho_Chi_Minh',
                  })}
                </time>
                {event.note && <> — {event.note}</>}
              </p>
            ))}
          </details>
        </>
      )}
      {error && <Alert type="error" showIcon message={error} />}
    </main>
  )
}
