import type { ControlStatus } from './inFlightTypes'
import {
  px4HomeSimX,
  px4HomeSimY,
  MAX_GPS_ROUTE_WAYPOINTS,
} from './inFlightConstants'
import type { MissionRoutePoint } from '../../types/omss'
import { inFlightControlMessages } from './components/InFlightControl.messages'

export function statusToSimulationPoint(
  status: ControlStatus | null,
): [number, number] | null {
  if (status?.positionNed) {
    return [
      px4HomeSimX + status.positionNed.eastM,
      px4HomeSimY + status.positionNed.northM,
    ]
  }
  if (status?.positionGazebo) {
    return [status.positionGazebo.x, status.positionGazebo.y]
  }
  return null
}

export function toControllerRouteWaypoints(
  route: Array<{ latitude: number; longitude: number }>,
) {
  const waypoints = route.slice(1)
  if (waypoints.length <= MAX_GPS_ROUTE_WAYPOINTS) return waypoints

  const target = waypoints[waypoints.length - 1]
  const step = (waypoints.length - 1) / (MAX_GPS_ROUTE_WAYPOINTS - 1)
  const sampled = Array.from(
    { length: MAX_GPS_ROUTE_WAYPOINTS - 1 },
    (_, index) => waypoints[Math.floor(index * step)],
  )
  return [...sampled, target]
}

export function planReasonLabel(
  point: MissionRoutePoint,
  t: (typeof inFlightControlMessages)['vi'],
) {
  const reason = point.reason.toUpperCase()
  if (reason === 'START') return t.planReason.start
  if (reason === 'TARGET') return t.planReason.order
  if (reason === 'TARGET_APPROACH') return t.planReason.approach
  if (reason === 'TERRAIN_CLEARANCE') return t.planReason.clear
  if (reason === 'RETURN') return t.planReason.return
  return t.planReason.cruise
}

export function planSpeedLabel(point: MissionRoutePoint) {
  return typeof point.speedMps === 'number' && Number.isFinite(point.speedMps)
    ? `${point.speedMps.toFixed(1)} m/s`
    : '--'
}

export function planHeadingLabel(
  point: MissionRoutePoint,
  nextPoint: MissionRoutePoint | undefined,
  hold: string,
) {
  if (!nextPoint) return hold
  const dx = nextPoint.simX - point.simX
  const dy = nextPoint.simY - point.simY
  if (Math.hypot(dx, dy) < 0.001) return hold
  const headingDeg = (Math.atan2(dx, dy) * 180) / Math.PI
  return `${Math.round((headingDeg + 360) % 360)}°`
}
