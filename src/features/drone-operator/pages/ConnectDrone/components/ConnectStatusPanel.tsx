import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import { operatorHref } from '../../../routes'
import type { ConnectState } from '../connectTypes'
import { connectStatusPanelMessages } from './ConnectStatusPanel.messages'

export function ConnectStatusPanel({
  state,
  error,
  missionId,
}: {
  state: ConnectState
  error: string | null
  missionId?: string
}) {
  const { t } = useI18n(connectStatusPanelMessages)
  const trackerSteps = t.trackerSteps
  const doneCount =
    state === 'connected'
      ? 3
      : state === 'connecting' || state === 'failed'
        ? 1
        : 0
  const activeIndex = state === 'connecting' ? 1 : -1
  const failedIndex = state === 'failed' ? 1 : -1

  const badgeTone =
    state === 'connected'
      ? 'green'
      : state === 'connecting'
        ? 'blue'
        : state === 'failed'
          ? 'red'
          : 'gray'
  const badgeLabel =
    state === 'connected'
      ? t.badge.connected
      : state === 'connecting'
        ? t.badge.connecting
        : state === 'failed'
          ? t.badge.failed
          : t.badge.default

  return (
    <div className="connect-status-panel">
      <section
        className="odm-card connect-status-panel__card"
        aria-labelledby="connect-status-title"
      >
        <div className="odm-card-body connect-status-panel__body">
          <div className="connect-status-panel__heading">
            <h2 id="connect-status-title">{t.connectionStatus}</h2>
            <span role="status" aria-live="polite" aria-atomic="true">
              <StatusBadge tone={badgeTone}>{badgeLabel}</StatusBadge>
            </span>
          </div>

          <ol className="connect-status-list">
            {trackerSteps.map((label, index) => {
              const done = index < doneCount
              const active = index === activeIndex
              const failedHere = index === failedIndex
              const stateLabel = failedHere
                ? t.stepState.failed
                : done
                  ? t.stepState.complete
                  : active
                    ? t.stepState.inProgress
                    : t.stepState.waiting

              return (
                <li
                  key={label}
                  className={`connect-status-item${done ? ' is-done' : ''}${active ? ' is-active' : ''}${failedHere ? ' is-failed' : ''}`}
                  aria-current={active ? 'step' : undefined}
                  aria-label={`${label} — ${stateLabel}`}
                >
                  <span
                    className="connect-status-item__marker"
                    aria-hidden="true"
                  >
                    {failedHere ? '×' : done ? '✓' : active ? '…' : '○'}
                  </span>
                  <span className="connect-status-item__label">{label}</span>
                </li>
              )
            })}
          </ol>

          {state === 'failed' && error ? (
            <div className="connect-status-panel__error" role="alert">
              <strong>{t.disconnectReason}</strong>
              <span>{error}</span>
            </div>
          ) : null}

          {state === 'connected' ? (
            <div className="connect-status-panel__telemetry">
              <div className="connect-status-panel__telemetry-heading">
                <strong>{t.heartbeatTelemetry}</strong>
                <span className="odm-mono">10 Hz</span>
              </div>
              <p>{t.telemetrySummary(18)}</p>
            </div>
          ) : null}
        </div>
      </section>

      {state === 'connected' ? (
        <a
          className="odm-btn odm-btn-p connect-status-panel__action"
          href={operatorHref({ screen: 'preflight', missionId })}
        >
          {t.continueToPrecheck}
        </a>
      ) : (
        <a
          className="odm-btn connect-status-panel__action"
          href={operatorHref({ screen: 'missions' })}
        >
          {t.backToMission}
        </a>
      )}
    </div>
  )
}
