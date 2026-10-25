import type { DroneCandidate } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { missionDispatchPageMessages } from '../MissionDispatchPage.messages'
import { ScoreRing } from './ScoreRing'
import { managerHref } from '../../../routes'

export function LockedDroneCard({ drone }: { drone: DroneCandidate }) {
  const { t } = useI18n(missionDispatchPageMessages)
  return (
    <div className="odm-mgr-candidate-card selected">
      <div className="odm-mgr-candidate-head">
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
      <a
        href={managerHref({ screen: 'drones' })}
        className="odm-btn odm-btn-sm"
      >
        {t.candidate.changeDrone}
      </a>
    </div>
  )
}
