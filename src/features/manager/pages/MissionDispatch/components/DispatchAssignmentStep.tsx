import { LockedDroneCard } from './LockedDroneCard'
import { OperatorCard } from './OperatorCard'
import { missionDispatchPageMessages } from '../MissionDispatchPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { LockedDrone } from '../dispatchTypes'
import type { ResourceSuggestions } from '../../../types/missions'
import type { Dispatch, SetStateAction } from 'react'

export function DispatchAssignmentStep({
  lockedDrone,
  suggestions,
  selectedOperator,
  setSelectedOperator,
}: {
  lockedDrone: LockedDrone
  suggestions: ResourceSuggestions
  selectedOperator: string | null
  setSelectedOperator: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(missionDispatchPageMessages)
  return (
    <>
      {/* Locked drone card */}
      <div
        className="odm-card"
        style={{
          marginBottom: 14,
          borderLeft: '3px solid var(--blue-solid)',
        }}
      >
        <div className="odm-card-header" style={{ color: 'var(--blue-solid)' }}>
          {t.step1Done}
        </div>
        {lockedDrone.candidate ? (
          <LockedDroneCard drone={lockedDrone.candidate} />
        ) : (
          <div className="odm-card-body" style={{ fontWeight: 700 }}>
            {lockedDrone.code} · {lockedDrone.name}
          </div>
        )}
      </div>

      {/* ── Bước 2: chọn phi công ──────────────────────────────────────── */}
      <div className="odm-card" style={{ marginBottom: 14 }}>
        <div className="odm-card-header">
          {t.step2Choose}
          <span
            style={{
              fontWeight: 500,
              color: 'var(--tx3)',
              fontSize: 11.5,
            }}
          >
            {t.topOf(
              suggestions.topOperators.length,
              suggestions.eligibleOperatorCount,
            )}
          </span>
        </div>
        {suggestions.topOperators.map((o, i) => (
          <OperatorCard
            key={o.code}
            rank={i + 1}
            operator={o}
            selected={selectedOperator === o.code}
            onSelect={() => setSelectedOperator(o.code)}
          />
        ))}
      </div>
    </>
  )
}
