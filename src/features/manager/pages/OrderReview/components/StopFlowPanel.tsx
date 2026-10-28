import { Icon } from '../../../../../shared/components/Icon'
import {
  SafeStopRefresh,
  SafeStopSummary,
} from '../../../../mission/components/SafeStopSummary'
import { safeStopError } from '../../../../mission/lib/safeStopPresentation'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { SafeStop } from '../../../types/planning'
import { Button } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { stopFlowPanelMessages } from './StopFlowPanel.messages'

export function StopFlowPanel({
  flowRef,
  missionCode,
  busy,
  query,
  ready,
  stop,
  requested,
  refresh,
  setIntent,
  missionId,
  intent,
  triggerRef,
  reason,
  nextAction,
  setReason,
  actionReason,
  draft,
  allowed,
  command,
  message,
}: {
  flowRef: RefObject<HTMLElement | null>
  missionCode: string
  busy: boolean
  query: UseApiQueryState<SafeStop>
  ready: boolean
  stop: SafeStop
  requested: boolean
  refresh: () => void
  setIntent: Dispatch<SetStateAction<'cancel' | null>>
  missionId: string
  intent: 'cancel'
  triggerRef: RefObject<HTMLButtonElement | null>
  reason: string
  nextAction: 'cancel' | 'request' | 'cleanup' | null
  setReason: Dispatch<SetStateAction<string>>
  actionReason: string
  draft: boolean
  allowed: boolean
  command: (action: 'cancel' | 'request' | 'cleanup') => Promise<void>
  message: string
}) {
  const { t } = useI18n(stopFlowPanelMessages)
  return (
    <section
      className="odm-manager-stop-flow mission-stop"
      ref={flowRef}
      tabIndex={-1}
      aria-label={t.stopMission(missionCode)}
      aria-busy={busy || query.loading}
    >
      <div className="mission-stop__header">
        <h4>
          <Icon name="shield" width={18} height={18} />
          {ready && stop?.canCancelMission === true && !requested
            ? t.confirmCancel
            : t.safeStop}
        </h4>
        <div className="mission-stop__header-actions">
          <SafeStopRefresh disabled={busy || query.loading} onClick={refresh} />
          <Button
            disabled={busy}
            onClick={() => {
              setIntent(null)
              window.requestAnimationFrame(() => {
                const button = document.querySelector<HTMLButtonElement>(
                  `[data-stop-trigger="${missionId}:${intent}"]`,
                )
                ;(button ?? triggerRef.current)?.focus()
              })
            }}
          >
            {t.closePanel}
          </Button>
        </div>
      </div>
      {query.loading && <p role="status">{t.checkingStatus}</p>}
      {query.error ? (
        <p role="alert" className="mission-stop__warning">
          {safeStopError(query.error)}
        </p>
      ) : null}
      {ready && (
        <>
          {stop.canCancelMission === true && !requested ? (
            <p className="mission-stop__description">{t.canCancel}</p>
          ) : (
            <>
              <SafeStopSummary stop={stop} actor="manager" />
              {!requested && (
                <p className="mission-stop__guidance">{t.crewResponsible}</p>
              )}
            </>
          )}
          {requested ? (
            <dl className="mission-stop__reason">
              <dt>{t.stopReason}</dt>
              <dd>{stop.reason || reason || t.noReason}</dd>
            </dl>
          ) : (
            (nextAction === 'request' || nextAction === 'cancel') && (
              <div className="mission-stop__form">
                <label className="mission-stop__field">
                  {t.stopReason}
                  <textarea
                    maxLength={1000}
                    value={reason}
                    disabled={busy}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
              </div>
            )
          )}
          {requested && nextAction === 'cancel' && !actionReason && (
            <p className="mission-stop__warning">{t.reasonNotLoaded}</p>
          )}
          {stop.cleanedAt && stop.canCancelMission !== true && (
            <p className="mission-stop__guidance">
              {draft ? t.cannotCancelNow : t.openAdjustPlan}
            </p>
          )}
          {stop.confirmedAt && !stop.cleanedAt && nextAction === null && (
            <p className="mission-stop__guidance">{t.notReadyToRelease}</p>
          )}
          {nextAction && (
            <div className="mission-stop__actions">
              <Button
                variant={nextAction === 'cancel' ? 'danger' : 'primary'}
                disabled={
                  !allowed || (nextAction !== 'cleanup' && !actionReason)
                }
                onClick={() => void command(nextAction)}
              >
                {busy
                  ? t.processing
                  : {
                      request: t.requestStop,
                      cleanup: t.releaseResources,
                      cancel: t.cancelMission,
                    }[nextAction]}
              </Button>
            </div>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
