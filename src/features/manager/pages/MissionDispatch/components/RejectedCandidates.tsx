import { missionDispatchPageMessages } from '../MissionDispatchPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'
import type { ResourceSuggestions } from '../../../types/missions'

export function RejectedCandidates({
  setRejectedOpen,
  rejectedOpen,
  suggestions,
}: {
  setRejectedOpen: Dispatch<SetStateAction<boolean>>
  rejectedOpen: boolean
  suggestions: ResourceSuggestions
}) {
  const { t } = useI18n(missionDispatchPageMessages)
  return (
    <div className="odm-card" style={{ marginTop: 14 }}>
      <button
        type="button"
        className="odm-card-header"
        style={{
          width: '100%',
          border: 0,
          background: 'transparent',
          cursor: 'pointer',
        }}
        onClick={() => setRejectedOpen((v) => !v)}
        aria-expanded={rejectedOpen}
      >
        <span>
          {t.rejectedSummary(
            suggestions.rejected.drones.length,
            suggestions.rejected.operators.length,
          )}
        </span>
        <span>{rejectedOpen ? t.collapse : t.expand}</span>
      </button>
      {rejectedOpen ? (
        <div className="odm-card-body">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            {t.rejectedDrones(suggestions.rejected.drones.length)}
          </div>
          {suggestions.rejected.drones.map((d) => (
            <div key={d.code} className="odm-mgr-rejected-row">
              <span className="odm-mono" style={{ fontWeight: 700 }}>
                {d.code}
              </span>
              <span>: {d.reason}</span>
            </div>
          ))}
          <div style={{ fontWeight: 700, margin: '10px 0 6px' }}>
            {t.rejectedOperators(suggestions.rejected.operators.length)}
          </div>
          {suggestions.rejected.operators.map((o) => (
            <div key={o.name} className="odm-mgr-rejected-row">
              <span style={{ fontWeight: 700 }}>{o.name}</span>
              <span>: {o.reason}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
