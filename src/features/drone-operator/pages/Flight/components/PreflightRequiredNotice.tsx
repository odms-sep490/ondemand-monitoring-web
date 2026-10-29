import type { Drone, Mission } from '../../../types/omss'
import { ManualCockpitPreflight } from './ManualCockpitPreflight'

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
    <div className="stf-flight-overlay">
      <ManualCockpitPreflight
        missionLabel={mission.id}
        deviceLabel={drone.name || drone.id}
        onReady={handlePreflightReady}
      />
    </div>
  )
}
