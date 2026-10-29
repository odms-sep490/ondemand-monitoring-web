import { Button, Input, Select, Typography } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { connectDronePageMessages } from '../ConnectDronePage.messages'
import type { ConnectState } from '../connectTypes'
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
    <div className="stf-stack-sm">
      <CardComponent>
        <StepTitle n={1} text={t.step1Title} />
        <div className="stf-row" style={{ flexWrap: 'nowrap' }}>
          <Input
            size="large"
            className="stf-mono stf-token-input"
            value={token}
            disabled
            onChange={(e) => onTokenChange(e.target.value)}
            aria-label={t.tokenAriaLabel}
          />
          <Button size="large" disabled>
            {t.scanQr}
          </Button>
        </div>
        <div
          className="stf-row"
          style={{
            justifyContent: 'space-between',
            marginTop: 10,
            fontSize: 13,
          }}
        >
          <span className="stf-muted">{t.droneCodeHint}</span>
          {isExpired ? (
            <Typography.Text type="danger" strong>
              {t.expiredAt}
            </Typography.Text>
          ) : (
            <span className="stf-muted" style={{ fontWeight: 600 }}>
              {t.tokenAfterPreflight}
            </span>
          )}
        </div>
      </CardComponent>

      <CardComponent style={{ opacity: isExpired ? 0.6 : 1 }}>
        <StepTitle n={2} text={t.step2Title} />
        <div className="stf-row" style={{ flexWrap: 'nowrap' }}>
          <Select
            size="large"
            style={{ flex: 1, minWidth: 0 }}
            aria-label={t.gcsAriaLabel}
            value={gcsId}
            disabled={isExpired}
            onChange={(value) => onGcsChange(value)}
            options={t.gcsOptions.map((opt) => ({ value: opt, label: opt }))}
          />
          {isExpired ? (
            <Button size="large" type="primary" onClick={onRetryExpired}>
              {t.requestNewCode}
            </Button>
          ) : isConnected ? (
            <Button size="large" disabled>
              {t.connected}
            </Button>
          ) : (
            <Button
              size="large"
              type="primary"
              onClick={onConnect}
              disabled={isConnecting}
              loading={isConnecting}
            >
              {isConnecting
                ? t.connecting
                : state === 'failed'
                  ? t.retry
                  : t.connect}
            </Button>
          )}
        </div>
      </CardComponent>
      <div className="stf-muted" style={{ fontSize: 12 }}>
        {t.sessionNote}
      </div>
    </div>
  )
}
