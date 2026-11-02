import type { ConnectState } from '../connectTypes'
import { useI18n } from '../../../../../shared/i18n'
import { connectDronePageMessages } from '../ConnectDronePage.messages'
import { StepTitle } from './StepTitle'

export function ConnectForm({
  state,
  gcsId,
  onGcsChange,
  onConnect,
}: {
  state: ConnectState
  gcsId: string
  onGcsChange: (v: string) => void
  onConnect: () => void
}) {
  const { t } = useI18n(connectDronePageMessages)
  const isConnecting = state === 'connecting'
  const isConnected = state === 'connected'

  return (
    <section
      className="connect-drone-form"
      aria-labelledby="connect-form-title"
    >
      <div className="odm-card">
        <div className="odm-card-body connect-drone-form__body">
          <StepTitle id="connect-form-title" n={1} text={t.connectionTitle} />
          <div className="connect-drone-form__controls">
            <select
              className="odm-input connect-drone-form__select"
              aria-label={t.gcsAriaLabel}
              value={gcsId}
              onChange={(e) => onGcsChange(e.target.value)}
            >
              {t.gcsOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {isConnected ? (
              <button
                type="button"
                className="odm-btn connect-drone-form__button"
                disabled
              >
                {t.connected}
              </button>
            ) : (
              <button
                type="button"
                className="odm-btn odm-btn-p connect-drone-form__button"
                onClick={onConnect}
                disabled={isConnecting}
              >
                {isConnecting
                  ? t.connecting
                  : state === 'failed'
                    ? t.retry
                    : t.connect}
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="connect-drone-form__note">{t.sessionNote}</p>
    </section>
  )
}
