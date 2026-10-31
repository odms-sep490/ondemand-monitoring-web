import type { OperatorMission } from '../../../types/mission'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { STATUS_TONE } from '../missionConstants'
import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import {
  missionStatusLabel,
  formatVnDate,
  locationLabel,
  formatCoord,
  dash,
  missionDescriptionText,
} from '../missionFormat'
import { InfoRow } from './InfoRow'
import { Icon } from '../../../../../shared/components/Icon'

// ─── Mission info card ────────────────────────────────────────────────────────

export function MissionInfoCard({
  mission,
  compact = false,
  overview = false,
}: {
  mission: OperatorMission
  compact?: boolean
  overview?: boolean
}) {
  const description = missionDescriptionText(mission.description)
  const hasDescription = description !== 'Chưa có mô tả'
  const hasGpsCoordinates =
    mission.latitude != null || mission.longitude != null
  const hasSimulatedCoordinates =
    mission.targetX != null || mission.targetY != null
  const overviewRows = [
    {
      icon: <Icon name="clock" width={15} height={15} />,
      label: 'Ngày bay',
      value: formatVnDate(mission.date),
    },
    {
      icon: <Icon name="clock" width={15} height={15} />,
      label: 'Khung giờ',
      value:
        [mission.startTime, mission.endTime].filter(Boolean).join('–') ||
        'Chưa lên lịch',
    },
    {
      icon: <Icon name="map-pin" width={15} height={15} />,
      label: 'Địa điểm',
      value: locationLabel(mission.location),
    },
    ...(mission.radiusMeters == null
      ? []
      : [
          {
            icon: <Icon name="route" width={15} height={15} />,
            label: 'Bán kính',
            value: `${mission.radiusMeters} m`,
          },
        ]),
    ...(mission.serviceLabel.trim()
      ? [
          {
            icon: <Icon name="clipboard" width={15} height={15} />,
            label: 'Dịch vụ',
            value: mission.serviceLabel,
          },
        ]
      : []),
  ]

  return (
    <section
      className={`odm-card${overview ? ' mds-overview-info' : ''}`}
      aria-labelledby="mission-info-heading"
    >
      <div className="odm-card-header">
        <h2 id="mission-info-heading" className="mds-card-heading">
          {compact
            ? 'Thông tin bổ sung'
            : overview
              ? 'Lịch & khu vực'
              : 'Thông tin nhiệm vụ'}
        </h2>
        {!compact && !overview ? (
          <StatusBadge tone={STATUS_TONE[mission.status]}>
            {missionStopLabel(mission) ??
              missionStatusLabel(mission.backendStatus ?? mission.status)}
          </StatusBadge>
        ) : null}
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        {overview ? (
          <>
            {overviewRows.map((row) => (
              <InfoRow
                key={row.label}
                icon={row.icon}
                label={row.label}
                value={row.value}
              />
            ))}
            {(hasGpsCoordinates ||
              hasSimulatedCoordinates ||
              hasDescription) && (
              <details className="mds-device-details mds-mission-details">
                <summary>Thông tin khác</summary>
                <div>
                  {hasGpsCoordinates ? (
                    <InfoRow
                      icon={<Icon name="map-pin" width={15} height={15} />}
                      label="Tọa độ GPS"
                      value={`${formatCoord(mission.latitude)}, ${formatCoord(mission.longitude)}`}
                    />
                  ) : null}
                  {hasSimulatedCoordinates ? (
                    <InfoRow
                      icon={<Icon name="activity" width={15} height={15} />}
                      label="Tọa độ mô phỏng"
                      value={`X ${dash(mission.targetX)} · Y ${dash(mission.targetY)}`}
                    />
                  ) : null}
                  {hasDescription ? (
                    <div className="mds-info-extra-description">
                      <h3 className="mds-info-description-heading">
                        Mô tả nhiệm vụ
                      </h3>
                      <div className="mds-info-description">{description}</div>
                    </div>
                  ) : null}
                </div>
              </details>
            )}
          </>
        ) : null}
        {!compact && !overview ? (
          <>
            <InfoRow
              icon={<Icon name="file-text" width={15} height={15} />}
              label="Mã nhiệm vụ"
              value={mission.missionCode ?? mission.id}
            />
            <InfoRow
              icon={<Icon name="activity" width={15} height={15} />}
              label="Trạng thái hệ thống"
              value={missionStatusLabel(
                mission.backendStatus ?? mission.status,
              )}
            />
            <InfoRow
              icon={<Icon name="clock" width={15} height={15} />}
              label="Ngày bay"
              value={formatVnDate(mission.date)}
            />
            <InfoRow
              icon={<Icon name="clock" width={15} height={15} />}
              label="Giờ bắt đầu"
              value={mission.startTime || 'Chưa lên lịch'}
            />
            <InfoRow
              icon={<Icon name="clock" width={15} height={15} />}
              label="Giờ kết thúc"
              value={mission.endTime || 'Chưa lên lịch'}
            />
            <InfoRow
              icon={<Icon name="map-pin" width={15} height={15} />}
              label="Địa điểm"
              value={locationLabel(mission.location)}
            />
            <InfoRow
              icon={<Icon name="route" width={15} height={15} />}
              label="Vùng giám sát"
              value={`Bán kính ${mission.radiusMeters == null ? '—' : `${mission.radiusMeters} m`}`}
            />
          </>
        ) : null}
        {!overview ? (
          <>
            <InfoRow
              icon={<Icon name="map-pin" width={15} height={15} />}
              label="Tọa độ GPS"
              value={`${formatCoord(mission.latitude)}, ${formatCoord(mission.longitude)}`}
            />
            <InfoRow
              icon={<Icon name="activity" width={15} height={15} />}
              label="Tọa độ mô phỏng"
              value={`X ${dash(mission.targetX)} · Y ${dash(mission.targetY)}`}
            />
          </>
        ) : null}
        {!compact && !overview ? (
          <InfoRow
            icon={<Icon name="clipboard" width={15} height={15} />}
            label="Loại nhiệm vụ"
            value={mission.serviceLabel}
          />
        ) : null}

        {/* Description */}
        {!overview ? (
          <div
            style={{
              borderTop: '1px solid var(--bd)',
              paddingTop: 10,
              marginTop: 6,
            }}
          >
            <h3 className="mds-info-description-heading">Mô tả nhiệm vụ</h3>
            <div className="mds-info-description">{description}</div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
