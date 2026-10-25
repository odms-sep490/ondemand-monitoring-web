import { ManualCockpitPreflight } from './ManualCockpitPreflight'
import type { Mission, Drone } from '../../../types/omss'

export function PreflightRequiredNotice({
  mission,
  drone,
  handlePreflightReady,
}: {
  mission: Mission
  drone: Drone
  handlePreflightReady: () => Promise<void>
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        background: '#f1f5f9',
        overflow: 'auto',
        padding: 22,
      }}
    >
      <ManualCockpitPreflight
        missionLabel={mission.id}
        deviceLabel={drone.name || drone.id}
        onReady={handlePreflightReady}
      />
    </div>
  )
}
