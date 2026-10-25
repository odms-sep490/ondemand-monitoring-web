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

// ─── Mission info card ────────────────────────────────────────────────────────

export function MissionInfoCard({ mission }: { mission: OperatorMission }) {
  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span style={{ fontWeight: 700 }}>Thông tin nhiệm vụ</span>
        <StatusBadge tone={STATUS_TONE[mission.status]}>
          {missionStopLabel(mission) ??
            missionStatusLabel(mission.backendStatus ?? mission.status)}
        </StatusBadge>
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        <InfoRow
          icon="#"
          label="Mã nhiệm vụ"
          value={mission.missionCode ?? mission.id}
        />
        <InfoRow
          icon="•"
          label="Trạng thái hệ thống"
          value={missionStatusLabel(mission.backendStatus ?? mission.status)}
        />
        <InfoRow
          icon="📅"
          label="Ngày bay"
          value={formatVnDate(mission.date)}
        />
        <InfoRow
          icon="⏱"
          label="Giờ bắt đầu"
          value={mission.startTime || 'Chưa lên lịch'}
        />
        <InfoRow
          icon="⏳"
          label="Giờ kết thúc"
          value={mission.endTime || 'Chưa lên lịch'}
        />
        <InfoRow
          icon="📍"
          label="Địa điểm"
          value={locationLabel(mission.location)}
        />
        <InfoRow
          icon="🔵"
          label="Vùng giám sát"
          value={`Bán kính ${mission.radiusMeters == null ? '—' : `${mission.radiusMeters} m`}`}
        />
        <InfoRow
          icon="◎"
          label="Tọa độ GPS"
          value={`${formatCoord(mission.latitude)}, ${formatCoord(mission.longitude)}`}
        />
        <InfoRow
          icon="X"
          label="Tọa độ mô phỏng"
          value={`X ${dash(mission.targetX)} · Y ${dash(mission.targetY)}`}
        />
        <InfoRow icon="📋" label="Loại nhiệm vụ" value={mission.serviceLabel} />

        {/* Description */}
        <div
          style={{
            borderTop: '1px solid var(--bd)',
            paddingTop: 10,
            marginTop: 6,
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--tx3)',
              marginBottom: 5,
              fontWeight: 600,
            }}
          >
            Mô tả mission
          </div>
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.55,
              color: 'var(--tx2)',
              whiteSpace: 'pre-wrap',
              maxHeight: 90,
              overflowY: 'auto',
            }}
          >
            {missionDescriptionText(mission.description)}
          </div>
        </div>
      </div>
    </div>
  )
}
