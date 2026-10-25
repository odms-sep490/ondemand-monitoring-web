import type { ResourceSuggestions } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { missionDispatchPageMessages } from '../MissionDispatchPage.messages'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'

export function TimelineCard({
  timeline,
}: {
  timeline: ResourceSuggestions['timeline']
}) {
  const { t } = useI18n(missionDispatchPageMessages)
  if (timeline.resources.length === 0) return null
  return (
    <div className="odm-card" style={{ marginTop: 14 }}>
      <div className="odm-card-header">
        {t.timelineHeader(
          timeline.date,
          timeline.windowStart,
          timeline.windowEnd,
        )}
      </div>
      <div className="odm-card-body">
        {timeline.resources.map((r) => (
          <div key={r.code} className="odm-mgr-timeline-row">
            <span style={{ fontWeight: 700, width: 140 }}>
              {r.code} {r.name}
            </span>
            {r.rejected ? (
              <StatusBadge tone="red">{r.rejectedReason}</StatusBadge>
            ) : null}
            {r.bookings.map((b, i) => (
              <span
                key={i}
                className={b.conflict ? 'odm-mgr-modal-error' : undefined}
                style={{ marginLeft: 8 }}
              >
                {b.missionCode}
                {b.start && b.end
                  ? ` · ${b.start.slice(11, 16)}–${b.end.slice(11, 16)}`
                  : ''}
                {b.conflict ? t.conflict : ''}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
