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
}: {
  mission: OperatorMission
  compact?: boolean
}) {
  return (
    <section className="odm-card" aria-labelledby="mission-info-heading">
      <div className="odm-card-header">
        <h2 id="mission-info-heading" className="mds-card-heading">
          {compact ? 'Thông tin bổ sung' : 'Thông tin nhiệm vụ'}
        </h2>
        {!compact ? (
          <StatusBadge tone={STATUS_TONE[mission.status]}>
            {missionStopLabel(mission) ??
              missionStatusLabel(mission.backendStatus ?? mission.status)}
          </StatusBadge>
        ) : null}
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        {!compact ? (
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
        {!compact ? (
          <InfoRow
            icon={<Icon name="clipboard" width={15} height={15} />}
            label="Loại nhiệm vụ"
            value={mission.serviceLabel}
          />
        ) : null}

        {/* Description */}
        <div
          style={{
            borderTop: '1px solid var(--bd)',
            paddingTop: 10,
            marginTop: 6,
          }}
        >
          <h3 className="mds-info-description-heading">Mô tả nhiệm vụ</h3>
          <div className="mds-info-description">
            {missionDescriptionText(mission.description)}
          </div>
        </div>
      </div>
    </section>
  )
}
