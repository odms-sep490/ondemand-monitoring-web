import { RocketOutlined } from '@ant-design/icons'
import { Divider } from 'antd'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { KeyValueList } from '../../../components/common/KeyValueList'
import { formatDeviceLabel } from '../../../lib/deviceLabel'
import type { OperatorMission } from '../../../types/mission'
import { missionDetailViewMessages } from '../missionDetailView.messages'

export function DroneDeviceCard({ mission }: { mission: OperatorMission }) {
  const { t } = useI18n(missionDetailViewMessages)
  const droneLabel = formatDeviceLabel(mission) ?? t.noDevice
  const rows = [
    { label: t.deviceId, value: mission.deviceId },
    { label: t.deviceCode, value: mission.deviceCode },
    { label: t.serial, value: mission.deviceSerialNumber },
    { label: t.status, value: mission.deviceStatus },
    { label: t.droneCode, value: mission.droneCode },
    { label: t.droneName, value: mission.droneName },
    { label: t.model, value: mission.droneModel },
    { label: t.modelCode, value: mission.deviceModelCode },
    { label: t.manufacturer, value: mission.deviceManufacturer },
    { label: t.payload, value: mission.dronePayload },
    { label: t.station, value: mission.droneStation },
    {
      label: t.stationDistance,
      value:
        mission.droneStationDistanceKm == null
          ? null
          : `${mission.droneStationDistanceKm} km`,
    },
    {
      label: t.readiness,
      value:
        mission.droneReadinessPct == null
          ? null
          : `${mission.droneReadinessPct}%`,
    },
    {
      label: t.hoursSinceMaintenance,
      value:
        mission.droneHoursSinceMaintenance == null
          ? null
          : t.hours(mission.droneHoursSinceMaintenance),
    },
  ].filter((row) => row.value != null && String(row.value).trim() !== '')
  const pct = mission.droneReadinessPct

  return (
    <CardComponent title={t.deviceTitle} icon={<RocketOutlined />}>
      <div className="stf-stack-sm">
        <div>
          <div style={{ fontWeight: 700 }}>{droneLabel}</div>
          {(mission.droneModel || mission.dronePayload) && (
            <div className="stf-muted" style={{ fontSize: 13 }}>
              {[mission.droneModel, mission.dronePayload]
                .filter(Boolean)
                .join(' / ')}
            </div>
          )}
        </div>
        <div>
          <StatusTag
            tone={pct == null ? 'neutral' : pct >= 80 ? 'success' : 'warning'}
          >
            {pct == null ? t.noTelemetry : t.readyPct(pct)}
          </StatusTag>
        </div>
        {(mission.droneStation ||
          mission.droneHoursSinceMaintenance != null) && (
          <div className="stf-muted" style={{ fontSize: 12.5 }}>
            {mission.droneStation && (
              <span>{t.pickupAt(mission.droneStation)}</span>
            )}
            {mission.droneStation && mission.droneStationDistanceKm != null && (
              <span>{t.distanceAway(mission.droneStationDistanceKm)}</span>
            )}
            {mission.droneHoursSinceMaintenance != null && (
              <span style={{ display: 'block', marginTop: 2 }}>
                {t.hoursSinceService(mission.droneHoursSinceMaintenance)}
              </span>
            )}
          </div>
        )}
      </div>
      {rows.length > 0 ? (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <KeyValueList
            items={rows.map((r) => ({
              label: r.label,
              value: String(r.value),
            }))}
          />
        </>
      ) : null}
    </CardComponent>
  )
}
