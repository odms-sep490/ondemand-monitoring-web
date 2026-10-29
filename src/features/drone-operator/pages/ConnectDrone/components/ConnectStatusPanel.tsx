import { Alert, Button, Steps } from 'antd'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { BackendMission } from '../../../api/liveMission'
import { formatDeviceLabel } from '../../../lib/deviceLabel'
import { operatorHref } from '../../../routes'
import type { ConnectState } from '../connectTypes'
import { connectStatusPanelMessages } from './ConnectStatusPanel.messages'

export function ConnectStatusPanel({
  state,
  error,
  mission,
}: {
  state: ConnectState
  error: string | null
  mission?: BackendMission
}) {
  const { t, locale } = useI18n(connectStatusPanelMessages)
  const deviceLabel = mission ? formatDeviceLabel(mission) : null
  const doneCount =
    state === 'connected'
      ? 3
      : state === 'connecting'
        ? 1
        : state === 'failed'
          ? 1
          : 0
  const activeIndex = state === 'connecting' ? 1 : -1
  const failedIndex = state === 'failed' ? 1 : -1

  const badgeTone =
    state === 'connected'
      ? 'success'
      : state === 'connecting'
        ? 'info'
        : state === 'failed'
          ? 'danger'
          : 'neutral'
  const badgeLabel =
    state === 'connected'
      ? t.badge.connected
      : state === 'connecting'
        ? t.badge.connecting
        : state === 'failed'
          ? t.badge.failed
          : t.badge.default

  return (
    <div className="stf-stack-sm">
      <CardComponent>
        <div className="stf-stack-sm" style={{ gap: 6 }}>
          <div className="stf-row" style={{ justifyContent: 'space-between' }}>
            <span className="stf-mono" style={{ fontWeight: 700 }}>
              {mission?.missionCode ?? mission?.id ?? t.noMissionSelected}
            </span>
            <StatusTag tone="success">{t.received}</StatusTag>
          </div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {mission?.orderTitle ?? t.missionBeingAssigned}
          </div>
          <div
            className="stf-muted stf-stack-sm"
            style={{ gap: 3, fontSize: 13 }}
          >
            <span>
              {mission?.scheduledStartAt
                ? new Date(mission.scheduledStartAt).toLocaleString(locale)
                : t.noSchedule}
            </span>
            <span>{deviceLabel ?? t.noDroneAssigned}</span>
            <span>{mission?.address ?? t.noAddress}</span>
          </div>
        </div>
      </CardComponent>

      {state === 'expired' ? (
        <Alert
          type="error"
          showIcon
          message={<strong>{t.codeExpiredTitle}</strong>}
          description={t.codeExpiredBody}
        />
      ) : (
        <CardComponent
          title={t.connectionStatus}
          extra={<StatusTag tone={badgeTone}>{badgeLabel}</StatusTag>}
        >
          <Steps
            direction="vertical"
            size="small"
            items={t.trackerSteps.map((label, i) => ({
              title: label,
              status:
                i === failedIndex
                  ? 'error'
                  : i < doneCount
                    ? 'finish'
                    : i === activeIndex
                      ? 'process'
                      : 'wait',
            }))}
          />
          {state === 'failed' && error ? (
            <Alert
              style={{ marginTop: 8 }}
              type="error"
              showIcon
              message={<span className="stf-mono">disconnect_reason</span>}
              description={<strong>{error}</strong>}
            />
          ) : null}
          {state === 'connected' ? (
            <Alert
              style={{ marginTop: 8 }}
              type="success"
              showIcon
              message={
                <div
                  className="stf-row"
                  style={{ justifyContent: 'space-between' }}
                >
                  <span>{t.heartbeatTelemetry}</span>
                  <span className="stf-mono">10 Hz</span>
                </div>
              }
              description={t.telemetrySummary(18)}
            />
          ) : null}
        </CardComponent>
      )}

      {state === 'connected' ? (
        <Button
          block
          type="primary"
          size="large"
          href={operatorHref({ screen: 'preflight', missionId: mission?.id })}
        >
          {t.continueToPrecheck}
        </Button>
      ) : (
        <Button block size="large" href={operatorHref({ screen: 'missions' })}>
          {t.backToMission}
        </Button>
      )}
    </div>
  )
}
