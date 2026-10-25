import { TelemetryPanel } from './TelemetryPanel'
import { LidarDetailPanel } from './LidarDetailPanel'
import { MissionInfoPanel } from './MissionInfoPanel'
import { RealMiniMap } from './RealMiniMap'
import type { ControlStatus } from '../inFlightTypes'
import type { Mission } from '../../../types/omss'

export function MissionControlSide({
  controlStatus,
  lidarDetailsOpen,
  progress,
  mission,
}: {
  controlStatus: ControlStatus | null
  lidarDetailsOpen: boolean
  progress: number
  mission: Mission
}) {
  return (
    <aside
      className="mission-control-side"
      style={{
        gridColumn: 3,
        gridRow: '1 / 3',
        minWidth: 0,
        minHeight: 0,
        height: '100%',
        maxHeight: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        paddingRight: 4,
        scrollbarGutter: 'stable',
      }}
    >
      <TelemetryPanel status={controlStatus} />
      {lidarDetailsOpen && <LidarDetailPanel status={controlStatus} />}
      <MissionInfoPanel
        status={controlStatus}
        progress={progress}
        mission={mission}
      />
      <RealMiniMap status={controlStatus} mission={mission} />
    </aside>
  )
}
