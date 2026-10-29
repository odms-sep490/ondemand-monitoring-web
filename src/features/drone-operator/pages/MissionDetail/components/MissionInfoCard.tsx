import { InfoCircleOutlined } from '@ant-design/icons'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import { KeyValueList } from '../../../components/common/KeyValueList'
import type { OperatorMission } from '../../../types/mission'
import { STATUS_TONE } from '../missionConstants'
import { missionDetailViewMessages } from '../missionDetailView.messages'
import {
  dash,
  formatCoord,
  formatVnDate,
  locationLabel,
  missionDescriptionText,
  missionStatusLabel,
} from '../missionFormat'

export function MissionInfoCard({ mission }: { mission: OperatorMission }) {
  const { t, lang } = useI18n(missionDetailViewMessages)
  const statusText = missionStatusLabel(
    mission.backendStatus ?? mission.status,
    lang,
  )
  return (
    <CardComponent
      title={t.infoTitle}
      icon={<InfoCircleOutlined />}
      extra={
        <StatusTag tone={STATUS_TONE[mission.status]}>
          {missionStopLabel(mission) ?? statusText}
        </StatusTag>
      }
    >
      <KeyValueList
        items={[
          { label: t.missionCode, value: mission.missionCode ?? mission.id },
          { label: t.systemStatus, value: statusText },
          { label: t.flightDate, value: formatVnDate(mission.date, lang) },
          { label: t.startTime, value: mission.startTime || t.notScheduled },
          { label: t.endTime, value: mission.endTime || t.notScheduled },
          { label: t.location, value: locationLabel(mission.location, lang) },
          {
            label: t.monitoringZone,
            value:
              mission.radiusMeters == null
                ? '—'
                : t.radiusValue(mission.radiusMeters),
          },
          {
            label: t.gps,
            value: `${formatCoord(mission.latitude)}, ${formatCoord(mission.longitude)}`,
          },
          {
            label: t.simCoords,
            value: `X ${dash(mission.targetX)} · Y ${dash(mission.targetY)}`,
          },
          { label: t.missionType, value: mission.serviceLabel },
        ]}
      />
      <div
        className="stf-muted"
        style={{ fontSize: 12, fontWeight: 600, marginTop: 8 }}
      >
        {t.description}
      </div>
      <div className="stf-scroll-note">
        {missionDescriptionText(mission.description, lang)}
      </div>
    </CardComponent>
  )
}
