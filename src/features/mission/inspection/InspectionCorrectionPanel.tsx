import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Checkbox, Input, Tag } from 'antd'
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
import { planningApi } from '../../manager/api/planningApi'
import { inspectionCorrectionApi } from './inspectionCorrectionApi'
import { inspectionCorrectionMessages } from './inspectionCorrection.messages'
import './InspectionCorrectionPanel.css'
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
  const [editing, setEditing] = useState(false),
    [reasons, setReasons] = useState<Record<string, string>>({}),
    [selected, setSelected] = useState<string[]>([]),
    [media, setMedia] = useState<Record<string, string[]>>({})
  const [note, setNote] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState(''),
    [start, setStart] = useState(''),
    [end, setEnd] = useState(''),
    [checked, setChecked] = useState(false)
  const command = useRef(crypto.randomUUID()),
    missionCommand = useRef(crypto.randomUUID())
  const active = query.data?.find((row) => row.status !== 'RESOLVED')
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
      setEditing(false)
      setNote('')
      setSelected([])
      setReasons({})
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
              {canRequest ? t.inspectorGuide : t.staffGuide}
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
          {!query.data?.length && <p>{t.empty}</p>}
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
          {canRequest && !active && !editing && (
            <Button
              disabled={disabled || !rows.length}
              onClick={() => setEditing(true)}
            >
              {t.newRequest}
            </Button>
          )}
          {canRequest && !active && editing && (
            <div className="inspection-corrections__form">
              <div className="inspection-corrections__meta">
                <h4>{t.choose}</h4>
                <Button
                  type="text"
                  onClick={() => setEditing(false)}
                  disabled={busy}
                >
                  {t.cancel}
                </Button>
              </div>
              <p>{t.findings}</p>
              {rows
                .filter((r) => !r.fulfilledByMissionId)
                .map((row) => (
                  <div
                    key={row.id}
                    className={`inspection-corrections__choice ${selected.includes(row.id) ? 'is-selected' : ''}`}
                  >
                    <Checkbox
                      checked={selected.includes(row.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, row.id]
                            : selected.filter((id) => id !== row.id),
                        )
                      }
                    >
                      {row.content}
                    </Checkbox>
                    {selected.includes(row.id) && (
                      <>
                        <label>
                          {t.reason}
                          <Input.TextArea
                            aria-label={`${t.reason}: ${row.content}`}
                            value={reasons[row.id] ?? ''}
                            maxLength={2000}
                            onChange={(e) =>
                              setReasons({
                                ...reasons,
                                [row.id]: e.target.value,
                              })
                            }
                          />
                        </label>
                        {!!row.evidence?.length && (
                          <fieldset>
                            <legend>{t.media}</legend>
                            {row.evidence.map((link) => (
                              <Checkbox
                                key={link.evidenceId}
                                checked={
                                  media[row.id]?.includes(link.mediaId) ?? false
                                }
                                onChange={(e) =>
                                  setMedia({
                                    ...media,
                                    [row.id]: e.target.checked
                                      ? [...(media[row.id] ?? []), link.mediaId]
                                      : (media[row.id] ?? []).filter(
                                          (id) => id !== link.mediaId,
                                        ),
                                  })
                                }
                              >
                                {link.fileName ?? link.mediaId}
                              </Checkbox>
                            ))}
                          </fieldset>
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
                  selected.some((id) => !reasons[id]?.trim())
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
                        reason: reasons[id].trim(),
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
              {!active.supplementalMissionId ||
              active.supplementalMissionStatus === 'CANCELLED' ? (
                <>
                  <label>
                    {t.scope}
                    <Input
                      value={scope}
                      maxLength={255}
                      onChange={(e) => setScope(e.target.value)}
                    />
                  </label>
                  <div className="inspection-corrections__schedule">
                    <label>
                      {t.start}
                      <input
                        type="datetime-local"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                      />
                    </label>
                    <label>
                      {t.end}
                      <input
                        type="datetime-local"
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                      />
                    </label>
                  </div>
                  <Button
                    disabled={disabled || !scope.trim() || !start || !end}
                    onClick={() =>
                      void act(() =>
                        inspectionCorrectionApi.createMission(
                          missionId,
                          active,
                          {
                            clientRequestId: missionCommand.current,
                            scopeLabel: scope.trim(),
                            scheduledStartAt: new Date(
                              start + ':00+07:00',
                            ).toISOString(),
                            scheduledEndAt: new Date(
                              end + ':00+07:00',
                            ).toISOString(),
                          },
                        ),
                      )
                    }
                  >
                    {t.plan}
                  </Button>
                </>
              ) : (
                <>
                  <a
                    href={managerHref({
                      screen: 'missionDispatch',
                      missionId: active.supplementalMissionId,
                    })}
                  >
                    {t.configure}
                  </a>
                  <Checkbox
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                  >
                    {t.confirmPlan}
                  </Checkbox>
                  <Button
                    type="primary"
                    disabled={
                      disabled ||
                      !checked ||
                      active.supplementalMissionStatus !== 'PLANNING'
                    }
                    onClick={() =>
                      void act(async () => {
                        const plan = await planningApi.getExecutionPlan(orderId)
                        await inspectionCorrectionApi.finalize(
                          missionId,
                          active,
                          plan.revision,
                        )
                      })
                    }
                  >
                    {t.finalize}
                  </Button>
                </>
              )}
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
