import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import type { BackendMission } from '../../../api/liveMission'
import { formatDeviceLabel } from '../../../lib/deviceLabel'
import { connectStatusPanelMessages } from './ConnectStatusPanel.messages'

export function ConnectMissionSummary({
  mission,
}: {
  mission?: BackendMission
}) {
  const { t, locale } = useI18n(connectStatusPanelMessages)
  const deviceLabel = mission ? formatDeviceLabel(mission) : null

  return (
    <section
      className="odm-card connect-mission-summary"
      aria-labelledby="connect-mission-summary-title"
    >
      <div className="odm-card-body connect-mission-summary__body">
        <div className="connect-mission-summary__header">
          <span className="odm-mono connect-mission-summary__code">
            {mission?.missionCode ?? mission?.id ?? t.noMissionSelected}
          </span>
          <StatusBadge tone="green">{t.received}</StatusBadge>
        </div>
        <h2
          id="connect-mission-summary-title"
          className="connect-mission-summary__title"
        >
          {mission?.orderTitle || t.missionBeingAssigned}
        </h2>
        <dl className="connect-mission-summary__details">
          <div>
            <dt>{t.scheduleLabel}</dt>
            <dd>
              {mission?.scheduledStartAt
                ? new Date(mission.scheduledStartAt).toLocaleString(locale)
                : t.noSchedule}
            </dd>
          </div>
          <div>
            <dt>{t.deviceFieldLabel}</dt>
            <dd>{deviceLabel ?? t.noDroneAssigned}</dd>
          </div>
          <div>
            <dt>{t.locationFieldLabel}</dt>
            <dd>{mission?.address ?? t.noAddress}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
