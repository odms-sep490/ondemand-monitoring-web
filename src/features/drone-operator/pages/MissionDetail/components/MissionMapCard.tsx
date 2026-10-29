import { Tag } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { OperatorMission } from '../../../types/mission'
import { missionDetailViewMessages } from '../missionDetailView.messages'
import { useOperatorMissionMap } from '../useOperatorMissionMap'

export function MissionMapCard({ mission }: { mission: OperatorMission }) {
  const { t } = useI18n(missionDetailViewMessages)
  const { container, target } = useOperatorMissionMap(mission)

  return (
    <CardComponent styles={{ body: { padding: 0, overflow: 'hidden' } }}>
      <div className="stf-map-view">
        <div
          ref={container}
          className="stf-map-canvas"
          role="application"
          aria-label={t.mapAria}
        />
        {target ? (
          <Tag bordered={false} className="stf-map-tag stf-map-tag--tl">
            {t.routeLegend}
          </Tag>
        ) : null}
        {target ? (
          <Tag
            bordered={false}
            color="error"
            className="stf-map-tag stf-map-tag--tr"
          >
            {t.monitoringPoint} · {target.latitude.toFixed(6)},{' '}
            {target.longitude.toFixed(6)}
          </Tag>
        ) : null}
        {mission.radiusMeters ? (
          <Tag bordered={false} className="stf-map-tag stf-map-tag--bl">
            {t.monitoringRadius(Math.round(mission.radiusMeters))}
          </Tag>
        ) : null}
        <Tag
          bordered={false}
          color="error"
          className="stf-map-tag stf-map-tag--br"
        >
          {t.noFlyZone}
        </Tag>
      </div>
    </CardComponent>
  )
}
