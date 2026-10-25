import type { ConnectState } from '../connectTypes'
import { useI18n } from '../../../../../shared/i18n'
import { connectDronePageMessages } from '../ConnectDronePage.messages'
import { StepTitle } from './StepTitle'

export function ConnectForm({
  state,
  token,
  gcsId,
  onTokenChange,
  onGcsChange,
  onConnect,
  onRetryExpired,
}: {
  state: ConnectState
  token: string
  gcsId: string
  onTokenChange: (v: string) => void
  onGcsChange: (v: string) => void
  onConnect: () => void
  onRetryExpired: () => void
}) {
  const { t } = useI18n(connectDronePageMessages)
  const isConnecting = state === 'connecting'
  const isConnected = state === 'connected'
  const isExpired = state === 'expired'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="odm-card">
        <div className="odm-card-body" style={{ padding: '16px 18px' }}>
          <StepTitle n={1} text={t.step1Title} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
            <input
              className="odm-input odm-mono"
              value={token}
              disabled
              onChange={(e) => onTokenChange(e.target.value)}
              aria-label={t.tokenAriaLabel}
              style={{
                height: 48,
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: '.08em',
                textAlign: 'center',
                flex: 1,
              }}
            />
            <button
              type="button"
              className="odm-btn"
              disabled
              style={{ height: 48 }}
            >
              {t.scanQr}
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 10,
              fontSize: 13,
            }}
          >
            <span style={{ color: 'var(--tx3)' }}>{t.droneCodeHint}</span>
            {isExpired ? (
              <span style={{ color: 'var(--red-fg)', fontWeight: 700 }}>
                {t.expiredAt}
              </span>
            ) : (
              <span style={{ color: 'var(--orange-fg)', fontWeight: 700 }}>
                {t.tokenAfterPreflight}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="odm-card" style={{ opacity: isExpired ? 0.55 : 1 }}>
        <div className="odm-card-body" style={{ padding: '16px 18px' }}>
          <StepTitle n={2} text={t.step2Title} />
          <div style={{ display: 'flex', gap: 10 }}>
            <select
              className="odm-input"
              aria-label={t.gcsAriaLabel}
              value={gcsId}
              disabled={isExpired}
              onChange={(e) => onGcsChange(e.target.value)}
              style={{ flex: 1, height: 44 }}
            >
              {t.gcsOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {isExpired ? (
              <button
                type="button"
                className="odm-btn odm-btn-p"
                onClick={onRetryExpired}
                style={{ height: 44 }}
              >
                {t.requestNewCode}
              </button>
            ) : isConnected ? (
              <button
                type="button"
                className="odm-btn"
                disabled
                style={{ height: 44, minWidth: 150 }}
              >
                {t.connected}
              </button>
            ) : (
              <button
                type="button"
                className="odm-btn odm-btn-p"
                onClick={onConnect}
                disabled={isConnecting}
                style={{ height: 44, minWidth: 150 }}
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
      <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>{t.sessionNote}</div>
    </div>
  )
}
