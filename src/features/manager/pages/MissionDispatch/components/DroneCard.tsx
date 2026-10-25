import type { DroneCandidate } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { missionDispatchPageMessages } from '../MissionDispatchPage.messages'
import { ScoreRing } from './ScoreRing'

export function DroneCard({
  rank,
  drone,
  locking,
  onLock,
}: {
  rank: number
  drone: DroneCandidate
  locking: boolean
  onLock: () => void
}) {
  const { t } = useI18n(missionDispatchPageMessages)
  return (
    <div className="odm-mgr-candidate-card">
      <div className="odm-mgr-candidate-head">
        <span
          className="odm-tn"
          style={{ fontWeight: 700, color: 'var(--tx3)' }}
        >
          {rank}
        </span>
        <ScoreRing score={drone.score} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>
            {drone.code} · {drone.name}
          </div>
          <div style={{ color: 'var(--tx3)', fontSize: 12 }}>
            {drone.serialNumber} · {drone.droneModelName}
          </div>
        </div>
      </div>
      <div className="odm-mgr-candidate-metrics">
        <span>
          {t.candidate.battery} <b className="odm-tn">{drone.batteryPct}%</b>
        </span>
        <span>
          {t.candidate.distanceToStation}{' '}
          <b className="odm-tn">{drone.distanceKm} km</b>
        </span>
        <span>
          {t.candidate.enduranceMargin}{' '}
          <b className="odm-tn">{drone.enduranceMarginPct}%</b>
        </span>
        <span>
          {t.candidate.payload} <b>{drone.payload}</b>
        </span>
        <span>
          {t.candidate.hoursSinceMaintenance}{' '}
          <b className="odm-tn">{drone.hoursSinceMaintenance}h</b>
        </span>
      </div>
      <div className="odm-mgr-candidate-reason">
        <div style={{ fontWeight: 700, marginBottom: 2 }}>
          {t.candidate.whySuggested}
        </div>
        {drone.reason}
        <div style={{ color: 'var(--tx3)', fontSize: 11, marginTop: 4 }}>
          {t.candidate.aiNote}
        </div>
      </div>
      <button
        type="button"
        className="odm-btn odm-btn-p odm-btn-sm"
        onClick={onLock}
        disabled={locking}
      >
        {locking ? t.candidate.locking : t.candidate.selectThisDrone}
      </button>
    </div>
  )
}
