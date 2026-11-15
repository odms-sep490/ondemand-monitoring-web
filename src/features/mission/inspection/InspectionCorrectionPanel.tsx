import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Input, Tag } from 'antd'
import {
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import type { MissionChecklistExecution } from '../types/checklistExecution'
import { operatorHref } from '../../drone-operator/routes'
import { managerHref } from '../../manager/routes'
import { inspectionCorrectionApi } from './inspectionCorrectionApi'
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
}: Props) {
  const { t, locale } = useI18n(inspectionCorrectionMessages)
  const query = useApiQuery(
    (signal) => inspectionCorrectionApi.list(missionId, signal),
    [missionId],
  )
  const [reasons, setReasons] = useState<Record<string, string>>({}),
    [media, setMedia] = useState<Record<string, string[]>>({})
  const [note, setNote] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null)
  const command = useRef(crypto.randomUUID())
  const active = query.data?.find((row) => row.status !== 'RESOLVED')
  const failedRows = rows.filter(
    (row) =>
      !row.fulfilledByMissionId && row.assessmentStatus === 'NON_COMPLIANT',
  )
  const selected = failedRows.map((row) => row.id)
  const reasonFor = (row: MissionChecklistExecution) =>
    reasons[`${row.id}:${row.version}`] ?? row.assessmentNote ?? ''

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) query.reload()
    }, 15000)
    return () => clearInterval(timer)
  }, [query.reload])
  async function act(operation: () => Promise<unknown>) {
    if (busy || query.loading) return
    setBusy(true)
    setError(null)
    try {
      await operation()
      setNote('')
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
  function decide(action: 'resubmit' | 'resolve' | 'return') {
    if (active)
      void act(() =>
        inspectionCorrectionApi.decide(missionId, active, action, note.trim()),
      )
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
  if (manager && !query.error && active?.status !== 'OPEN') return null
  if (
    !manager &&
    !query.error &&
    !query.loading &&
    !query.data?.length &&
    !failedRows.length
  )
    return null
  const panelTitle = manager ? t.create : t.title
  if (query.loading && !query.data) return <p role="status">{t.loading}</p>
  return (
    <section className="inspection-corrections" aria-label={panelTitle}>
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
            <h3>{panelTitle}</h3>
            <p>{manager ? t.planHint : t.subtitle}</p>
          </div>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={query.reload}
          disabled={busy}
        >
          {t.refresh}
        </Button>
      </header>
      {query.error ? (
        <Alert type="error" showIcon message={t.loadFailed} />
      ) : (
        <>
          {!manager && (
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
                (label, index) => (
                  <div
                    key={label}
                    className={
                      index === (active.status === 'OPEN' ? 0 : 1)
                        ? 'is-current'
                        : ''
                    }
                  >
                    <span>{index + 1}</span>
                    {label}
                  </div>
                ),
              )}
            </div>
          )}
          {!query.data?.length && !(canRequest && failedRows.length > 0) && (
            <p>{t.empty}</p>
          )}
          {query.data
            ?.filter((row) => !manager || row.id === active?.id)
            .map((row, index) => (
              <article
                key={row.id}
                className={`inspection-corrections__request ${row.status === 'RESOLVED' ? 'is-resolved' : ''}`}
              >
                <div className="inspection-corrections__meta">
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
          {active &&
            ((canRespond && active.status === 'OPEN') ||
              (canRequest && active.status === 'SUBMITTED')) && (
              <div className="inspection-corrections__actions">
                <h4>
                  {active.status === 'SUBMITTED'
                    ? t.waitingInspector
                    : t.waitingStaff}
                </h4>
                <label>
                  {t.note}
                  <Input.TextArea
                    aria-label={t.note}
                    value={note}
                    maxLength={2000}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={disabled}
                  />
                </label>
                <div>
                  {canRespond && active.status === 'OPEN' && (
                    <Button
                      type="primary"
                      disabled={disabled || !note.trim()}
                      onClick={() => decide('resubmit')}
                    >
                      {t.resubmit}
                    </Button>
                  )}
                  {canRequest && active.status === 'SUBMITTED' && (
                    <>
                      <Button
                        danger
                        disabled={disabled || !note.trim()}
                        onClick={() => decide('return')}
                      >
                        {t.return}
                      </Button>
                      <Button
                        type="primary"
                        disabled={disabled || !note.trim()}
                        onClick={() => decide('resolve')}
                      >
                        {t.resolve}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          {canRequest && !active && failedRows.length > 0 && (
            <div className="inspection-corrections__form">
              <div className="inspection-corrections__meta">
                <h4>{t.choose}</h4>
              </div>
              <p>{t.findings}</p>
              {failedRows.map((row) => (
                <div
                  key={row.id}
                  className={`inspection-corrections__choice ${selected.includes(row.id) ? 'is-selected' : ''}`}
                >
                  <strong>{row.content}</strong>
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
                    ),
                  )
                }
              >
                {t.send}
              </Button>
            </div>
          )}
          {manager && active?.status === 'OPEN' && orderId && (
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
                active.supplementalMissionStatus !== 'CANCELLED'
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
