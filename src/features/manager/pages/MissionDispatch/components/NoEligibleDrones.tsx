import { missionDispatchPageMessages } from '../MissionDispatchPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { ResourceSuggestions } from '../../../types/missions'

export function NoEligibleDrones({
  suggestions,
}: {
  suggestions: ResourceSuggestions
}) {
  const { t } = useI18n(missionDispatchPageMessages)
  return (
    <div className="odm-card" style={{ marginBottom: 14 }}>
      <div className="odm-card-body">
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          {t.noEligibleDrones}
        </div>
        <div style={{ color: 'var(--tx3)', marginBottom: 10 }}>
          {suggestions.explanation}
        </div>
        {suggestions.alternatives.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="odm-mgr-review-hint" style={{ fontWeight: 700 }}>
              {t.alternativeDays}
            </div>
            {suggestions.alternatives.map((alt) => (
              <div key={alt.priority} className="odm-mgr-rejected-row">
                <span style={{ fontWeight: 700 }}>{alt.label}</span>
                <span>
                  {alt.dateLabel} · {alt.windowLabel}
                </span>
                <span className="odm-tn">
                  {t.dronesFree(alt.eligibleDroneCount)}
                </span>
                <span className="odm-tn">
                  {t.operatorsFree(alt.eligibleOperatorCount)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
