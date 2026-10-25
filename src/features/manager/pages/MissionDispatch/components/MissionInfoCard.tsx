import { missionDispatchPageMessages } from '../MissionDispatchPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Mission, ResourceSuggestions } from '../../../types/missions'

export function MissionInfoCard({
  mission,
  suggestions,
}: {
  mission: Mission
  suggestions: ResourceSuggestions
}) {
  const { t } = useI18n(missionDispatchPageMessages)
  return (
    <div className="odm-card" style={{ marginBottom: 14 }}>
      <div className="odm-card-header">
        {t.missionHeader(mission.missionCode)}
      </div>
      <div className="odm-card-body odm-mgr-review-location-grid">
        <div>
          <div className="odm-mgr-review-hint">{t.order}</div>
          <div style={{ fontWeight: 600 }}>
            {mission.orderCode} · {t.attempt(mission.attemptNumber ?? 1)}
          </div>
        </div>
        <div>
          <div className="odm-mgr-review-hint">{t.time}</div>
          <div className="odm-mono" style={{ fontWeight: 600 }}>
            {suggestions.scheduledStart} → {suggestions.scheduledEnd}
          </div>
        </div>
        <div>
          <div className="odm-mgr-review-hint">{t.location}</div>
          <div style={{ fontWeight: 600 }}>
            {suggestions.addressText ?? '—'}
            {suggestions.centerLat != null && suggestions.centerLon != null
              ? ` · ${suggestions.centerLat}, ${suggestions.centerLon}`
              : ''}
            {suggestions.radiusM != null ? t.radius(suggestions.radiusM) : ''}
          </div>
        </div>
        <div>
          <div className="odm-mgr-review-hint">{t.mediaRequirement}</div>
          <div style={{ fontWeight: 600 }}>
            {suggestions.mediaSummary ?? '—'}
          </div>
        </div>
        <div>
          <div className="odm-mgr-review-hint">{t.requiredDuration}</div>
          <div style={{ fontWeight: 600 }}>
            {suggestions.requiredDurationLabel ?? '—'}
          </div>
        </div>
        <div>
          <div className="odm-mgr-review-hint">{t.requiredSensor}</div>
          <div style={{ fontWeight: 600 }}>
            {suggestions.requiredSensor ?? '—'}
          </div>
        </div>
        <div>
          <div className="odm-mgr-review-hint">{t.servingStation}</div>
          <div style={{ fontWeight: 600 }}>
            {suggestions.nearestBase ?? '—'}
          </div>
        </div>
      </div>
    </div>
  )
}
