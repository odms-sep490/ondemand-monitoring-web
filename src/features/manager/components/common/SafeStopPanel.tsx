import { useEffect, useState } from 'react'
import { Icon } from '../../../../shared/components/Icon'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import {
  SafeStopRefresh,
  SafeStopSummary,
} from '../../../mission/components/SafeStopSummary'
import {
  hasStopRequest,
  managerStopAction,
  safeStopError,
} from '../../../mission/lib/safeStopPresentation'
import { planningApi } from '../../api/planningApi'
import { Button, useConfirm, useToast } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { safeStopPanelMessages } from './SafeStopPanel.messages'
import { managerFeedbackMessages } from '../../feedback.messages'

export function SafeStopPanel({
  missionId,
  revision,
  manager = false,
  hideWhenIdle = false,
  onChanged,
  onCapabilitiesChanged,
}: {
  missionId: string
  revision?: number
  manager?: boolean
  hideWhenIdle?: boolean
  onChanged: () => void
  onCapabilitiesChanged?: (missionId: string, canCancel: boolean) => void
}) {
  const query = useApiQuery(
    (signal) => planningApi.getSafeStop(missionId, signal),
    [missionId, revision],
  )
  const { t } = useI18n(safeStopPanelMessages)
  const { t: fb } = useI18n(managerFeedbackMessages)
  const toast = useToast()
  const confirm = useConfirm()
  const [reason, setReason] = useState('')
  const [attested, setAttested] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const stop = query.data
  const ready = !query.loading && !query.error && stop?.missionId === missionId
  const managerAction = ready ? managerStopAction(stop) : null
  const canConfirm =
    ready &&
    !manager &&
    stop.canConfirmSafeStop === true &&
    !stop.confirmedAt &&
    !stop.cleanedAt
  useEffect(() => {
    onCapabilitiesChanged?.(missionId, ready && stop?.canCancelMission === true)
  }, [missionId, ready, stop, onCapabilitiesChanged])
  function refresh() {
    query.reload()
    onChanged()
  }
  async function command(action: 'request' | 'confirm' | 'cleanup') {
    if (busy || !ready) return
    if (action === 'confirm' && (!canConfirm || !attested || !reason.trim()))
      return
    if (action !== 'confirm' && (!manager || managerAction !== action)) return
    if (action === 'request' && (revision === undefined || !reason.trim()))
      return
    if (
      action === 'request' &&
      !(await confirm({
        title: fb.requestSafeStopTitle,
        description: fb.requestSafeStopBody,
        confirmLabel: fb.requestSafeStopAction,
        tone: 'danger',
      }))
    )
      return
    if (
      action === 'cleanup' &&
      !(await confirm({
        title: fb.cleanupTitle,
        description: fb.cleanupBody,
        confirmLabel: fb.cleanupAction,
        tone: 'danger',
      }))
    )
      return
    setBusy(true)
    setMessage('')
    try {
      if (action === 'request')
        await planningApi.requestSafeStop(missionId, {
          expectedPlanRevision: revision!,
          reason: reason.trim(),
        })
      if (action === 'confirm')
        await planningApi.confirmSafeStop(missionId, reason.trim())
      if (action === 'cleanup') await planningApi.cleanupSafeStop(missionId)
      setMessage(
        action === 'confirm'
          ? t.confirmSent
          : t.actionRecorded,
      )
      toast.success(
        action === 'request'
          ? fb.safeStopRequested
          : action === 'confirm'
            ? fb.safeStopConfirmed
            : fb.safeStopCleaned,
      )
      setAttested(false)
    } catch (error) {
      setMessage(safeStopError(error))
      toast.error(safeStopError(error))
    } finally {
      refresh()
      setBusy(false)
    }
  }
  if (
    hideWhenIdle &&
    !manager &&
    (!ready || !stop || !hasStopRequest(stop))
  )
    return null
  return (
    <section
      className="mission-stop"
      aria-label={t.ariaLabel(missionId)}
      aria-busy={busy || query.loading}
    >
      <div className="mission-stop__header">
        <h4>
          <Icon name="shield" width={18} height={18} />
          {t.title}
        </h4>
        <SafeStopRefresh disabled={busy || query.loading} onClick={refresh} />
      </div>
      {query.loading && <p role="status">{t.loadingStatus}</p>}
      {query.error ? (
        <p role="alert" className="mission-stop__warning">
          {safeStopError(query.error)}
        </p>
      ) : null}
      {!query.loading && !query.error && !ready && (
        <p role="alert">
          {t.cannotVerify}
        </p>
      )}
      {ready && (
        <>
          <SafeStopSummary stop={stop} actor={manager ? 'manager' : 'staff'} />
          {stop.reason && (
            <dl className="mission-stop__reason">
              <dt>{t.stopReason}</dt>
              <dd>{stop.reason}</dd>
            </dl>
          )}
          {stop.confirmedAt && stop.confirmation && (
            <dl className="mission-stop__reason">
              <dt>{t.safetyRecord}</dt>
              <dd>{stop.confirmation}</dd>
            </dl>
          )}
          {!manager &&
            !stop.confirmedAt &&
            !stop.cleanedAt &&
            hasStopRequest(stop) &&
            !canConfirm && (
              <p className="mission-stop__guidance">
                {t.waitingAssignee}
              </p>
            )}
          {manager && managerAction === 'request' && revision !== undefined && (
            <form
              className="mission-stop__form"
              onSubmit={(e) => {
                e.preventDefault()
                void command('request')
              }}
            >
              <label>
                {t.stopReason}
                <textarea
                  maxLength={1000}
                  required
                  value={reason}
                  disabled={busy}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <div className="mission-stop__actions">
                <Button type="submit"
                  variant="primary"
                  disabled={busy || !reason.trim()}
                >
                  {t.requestStop}
                </Button>
              </div>
            </form>
          )}
          {canConfirm && (
            <form
              className="mission-stop__form"
              onSubmit={(e) => {
                e.preventDefault()
                void command('confirm')
              }}
            >
              <p className="mission-stop__guidance">
                {t.confirmGuidance}
              </p>
              <label>
                {t.safetyRecord}
                <textarea
                  required
                  maxLength={1000}
                  value={reason}
                  disabled={busy}
                  placeholder={t.safetyPlaceholder}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <label className="mission-stop__attestation">
                <input
                  type="checkbox"
                  required
                  checked={attested}
                  disabled={busy}
                  onChange={(e) => setAttested(e.target.checked)}
                />
                {t.attestation}
              </label>
              <div className="mission-stop__actions">
                <Button type="submit"
                  variant="primary"
                  disabled={busy || !attested || !reason.trim()}
                >
                  {t.confirmSafe}
                </Button>
              </div>
            </form>
          )}
          {manager && managerAction === 'cleanup' && (
            <div className="mission-stop__actions">
              <Button
                type="button"
                variant="primary"
                disabled={busy}
                onClick={() => void command('cleanup')}
              >
                {t.releaseResources}
              </Button>
            </div>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
