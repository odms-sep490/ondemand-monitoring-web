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

// Perimeter of the two main tower blocks, including their outer scaffolding.
// The exported GLB also contains cranes and scattered site props; orbiting its
// full bounds made the checklist route unnecessarily far from the buildings.
export const CONSTRUCTION_SITE_BOUNDS = {
  minX: 189.875,
  maxX: 265.875,
  minY: -46.37732,
  maxY: -16.37732,
} as const
export const CONSTRUCTION_SITE_CENTER = {
  simX: (CONSTRUCTION_SITE_BOUNDS.minX + CONSTRUCTION_SITE_BOUNDS.maxX) / 2,
  simY: (CONSTRUCTION_SITE_BOUNDS.minY + CONSTRUCTION_SITE_BOUNDS.maxY) / 2,
} as const
const CONSTRUCTION_ORBIT_MARGIN_M = 5
const CONSTRUCTION_DEMO_SPEED_MPS = 20
const CONSTRUCTION_DEMO_MIN_SPEED_MPS = 4
const CONSTRUCTION_WAYPOINT_RADIUS_M = 1.5
const CONSTRUCTION_SLOWDOWN_RADIUS_M = 80

export function isConstructionChecklistMission(serviceLabel?: string) {
  const label = serviceLabel?.trim().toLocaleLowerCase('vi') ?? ''
  return label === 'giám sát công trình' || label === 'construction monitoring'
}

/** Clockwise perimeter route around the construction asset for both demo checklists. */
export function buildConstructionChecklistWaypoints(
  requestedAltitudeM: number,
): MissionRoutePoint[] {
  const altitudeM = Math.max(
    10,
    Math.min(
      120,
      Number.isFinite(requestedAltitudeM) ? requestedAltitudeM : 32,
    ),
  )
  const { minX, maxX, minY, maxY } = CONSTRUCTION_SITE_BOUNDS
  const westX = minX - CONSTRUCTION_ORBIT_MARGIN_M
  const eastX = maxX + CONSTRUCTION_ORBIT_MARGIN_M
  const southY = minY - CONSTRUCTION_ORBIT_MARGIN_M
  const northY = maxY + CONSTRUCTION_ORBIT_MARGIN_M
  const waypoint = (
    id: string,
    sequence: number,
    simX: number,
    simY: number,
    reason: string,
    yawDeg?: number,
    mediaActions?: MissionRoutePoint['mediaActions'],
  ): MissionRoutePoint => ({
    id,
    sequence,
    simX,
    simY,
    altitudeM,
    speedMps: CONSTRUCTION_DEMO_SPEED_MPS,
    minSpeedMps: CONSTRUCTION_DEMO_MIN_SPEED_MPS,
    reachedRadiusM: CONSTRUCTION_WAYPOINT_RADIUS_M,
    slowdownRadiusM: CONSTRUCTION_SLOWDOWN_RADIUS_M,
    reason,
    ...(yawDeg !== undefined ? { yawDeg } : {}),
    ...(mediaActions ? { mediaActions } : {}),
  })

  const homeWaypoint: MissionRoutePoint = {
    ...waypoint('construction-home', 0, px4HomeSimX, px4HomeSimY, 'START'),
    altitudeM: 0,
    reachedRadiusM: 8,
    slowdownRadiusM: 40,
  }

  return [
    homeWaypoint,
    waypoint(
      'construction-south-west',
      1,
      westX,
      southY,
      'CHECKLIST_PHOTO_SOUTH_WEST',
      45,
      ['video_start', 'photo'],
    ),
    waypoint(
      'construction-north-west',
      2,
      westX,
      northY,
      'CHECKLIST_PHOTO_NORTH_WEST',
      135,
      ['photo'],
    ),
    waypoint(
      'construction-north-east',
      3,
      eastX,
      northY,
      'CHECKLIST_PHOTO_NORTH_EAST',
      225,
      ['photo'],
    ),
    waypoint(
      'construction-south-east',
      4,
      eastX,
      southY,
      'CHECKLIST_PHOTO_SOUTH_EAST',
      315,
      ['photo'],
    ),
    waypoint(
      'construction-orbit-complete',
      5,
      westX,
      southY,
      'CHECKLIST_VIDEO_COMPLETE',
      45,
      ['video_stop'],
    ),
    {
      ...waypoint(
        'construction-return-home',
        6,
        px4HomeSimX,
        px4HomeSimY,
        'RETURN',
      ),
      altitudeM: Math.min(10, altitudeM),
      reachedRadiusM: 8,
      slowdownRadiusM: 40,
    },
  ]
}
