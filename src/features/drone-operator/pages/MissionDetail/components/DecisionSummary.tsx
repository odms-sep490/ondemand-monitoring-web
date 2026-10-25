import type { OperatorMission } from '../../../types/mission'
import { locationLabel, formatVnDate, formatCheckedAt } from '../missionFormat'

// ─── Decision summary ─────────────────────────────────────────────────────────

export function DecisionSummary({ mission }: { mission: OperatorMission }) {
  const time = [mission.startTime, mission.endTime].filter(Boolean).join('–')
  const items: Array<{ label: string; value: string }> = [
    { label: '📍 Khu vực', value: locationLabel(mission.location) },
    {
      label: '🕐 Thời gian',
      value: [formatVnDate(mission.date), time].filter(Boolean).join(' · '),
    },
    {
      label: '🛩 Phạm vi',
      value:
        mission.radiusMeters == null
          ? '—'
          : `Bán kính ${Math.round(mission.radiusMeters)} m`,
    },
    { label: '📋 Loại nhiệm vụ', value: mission.serviceLabel || '—' },
  ]
  if (mission.respondBy) {
    items.push({
      label: '⏳ Hạn phản hồi',
      value: formatCheckedAt(mission.respondBy),
    })
  }
  if (mission.managerNote) {
    items.push({ label: '⚠ Lưu ý từ manager', value: mission.managerNote })
  }
  return (
    <section
      className="odm-card mds-decision"
      aria-label="Thông tin để quyết định"
    >
      <div className="odm-card-header">
        <span style={{ fontWeight: 700 }}>Thông tin để quyết định</span>
      </div>
      <dl className="mds-decision-grid" style={{ margin: 0 }}>
        {items.map((item) => (
          <div key={item.label} className="mds-decision-item">
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
