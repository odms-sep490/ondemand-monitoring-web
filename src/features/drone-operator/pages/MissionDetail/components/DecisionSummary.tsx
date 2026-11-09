import type { OperatorMission } from '../../../types/mission'
import { locationLabel, formatVnDate, formatCheckedAt } from '../missionFormat'
import { Icon, type IconName } from '../../../../../shared/components/Icon'

// ─── Decision summary ─────────────────────────────────────────────────────────

export function DecisionSummary({ mission }: { mission: OperatorMission }) {
  const time = [mission.startTime, mission.endTime].filter(Boolean).join('–')
  const items: Array<{ icon: IconName; label: string; value: string }> = [
    {
      icon: 'map-pin',
      label: 'Khu vực',
      value: locationLabel(mission.location),
    },
    {
      icon: 'clock',
      label: 'Thời gian',
      value: [formatVnDate(mission.date), time].filter(Boolean).join(' · '),
    },
    {
      icon: 'route',
      label: 'Phạm vi',
      value:
        mission.radiusMeters == null
          ? '—'
          : `Bán kính ${Math.round(mission.radiusMeters)} m`,
    },
    {
      icon: 'clipboard',
      label: 'Loại nhiệm vụ',
      value: mission.serviceLabel || '—',
    },
  ]
  if (mission.respondBy) {
    items.push({
      icon: 'clock',
      label: 'Hạn phản hồi',
      value: formatCheckedAt(mission.respondBy),
    })
  }
  return (
    <section
      className="odm-card mds-decision"
      aria-labelledby="mission-decision-heading"
    >
      <div className="odm-card-header">
        <h2 id="mission-decision-heading" className="mds-card-heading">
          Thông tin để quyết định
        </h2>
      </div>
      <dl className="mds-decision-grid" style={{ margin: 0 }}>
        {items.map((item) => (
          <div key={item.label} className="mds-decision-item">
            <dt>
              <Icon
                className="mds-info-icon"
                name={item.icon}
                width={15}
                height={15}
                aria-hidden="true"
              />
              {item.label}
            </dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
