// Shared in-memory mission collection for the mock API. Mission creation
// happens from the staff scheduling flow, not from order approval, so
// managerMissions.ts owns writes for newly scheduled missions. Modules must
// import `missions` from here rather than creating their own
// `createCollection(missionsSeed.missions)` — two separate collections
// seeded from the same JSON file would silently diverge.
import type { MissionStatus } from '../../shared/types/domain'
import type { MissionRescheduleReason } from '../../features/manager/types/missions'
import { createCollection } from '../db'
import missionsSeed from '../data/missions.json'
import calendarSeed from '../data/missions-calendar.json'

export type StoredMediaRequirement =
  | { mediaType: 'VIDEO'; quantity: number; durationSec: number }
  | { mediaType: 'PHOTO'; quantity: number; width: number; height: number }
  | { mediaType: 'LIVESTREAM'; quantity: number; durationSec: number }

export type StoredFlightPlan = {
  planType: 'ORBIT' | 'GRID' | 'POINT'
  centerLat: number
  centerLon: number
  radiusM: number
  altitudeM: number
  speedMs: number | null
  estimatedDurationSec: number
  generatedBy: 'SYSTEM' | 'MANUAL'
}

export type StoredWaypoint = {
  seq: number
  action: string
  lat: number
  lon: number
  altM: number
}

export type StoredMission = {
  id: string
  orderId: string
  orderCode: string
  missionCode: string
  status: MissionStatus
  attemptNumber: number
  droneId: string | null
  operatorId: string | null
  droneAssignmentId: string | null
  operatorAssignmentId: string | null
  scheduledStartAt: string | null
  scheduledEndAt: string | null
  lastRescheduleReason?: MissionRescheduleReason | null
  lastRescheduleNote?: string | null
  lastRescheduledAt?: string | null
  scheduleRevision?: number
  addressText: string | null
  centerLat: number | null
  centerLon: number | null
  radiusM: number | null
  requiredSensor: string | null
  nearestBase: string | null
  mediaRequirements: StoredMediaRequirement[]
  flightPlan: StoredFlightPlan | null
  waypoints: StoredWaypoint[]
}

const mainIds = new Set(missionsSeed.missions.map((m) => m.id))
const merged = [
  ...missionsSeed.missions,
  ...calendarSeed.missions.filter((m) => !mainIds.has(m.id)),
]

export const missions = createCollection(merged) as unknown as StoredMission[]

export function findMissionById(id: string): StoredMission | undefined {
  return missions.find((m) => m.id === id || m.missionCode === id)
}

export function findMissionsForOrder(orderId: string): StoredMission[] {
  return missions.filter((m) => m.orderId === orderId)
}

/** Builds a minimal mission shell before the staff scheduling details are attached. */
export function newMinimalMission(
  orderId: string,
  orderCode: string,
): StoredMission {
  const existingAttempts = findMissionsForOrder(orderId).length
  const attemptNumber = existingAttempts + 1
  const suffix = orderCode.slice(4)
  return {
    id: `msn-${suffix}-${attemptNumber}`,
    orderId,
    orderCode,
    missionCode: `MSN-${suffix}-${attemptNumber}`,
    status: 'CREATED',
    attemptNumber,
    droneId: null,
    operatorId: null,
    droneAssignmentId: null,
    operatorAssignmentId: null,
    scheduledStartAt: null,
    scheduledEndAt: null,
    addressText: null,
    centerLat: null,
    centerLon: null,
    radiusM: null,
    requiredSensor: null,
    nearestBase: null,
    mediaRequirements: [],
    flightPlan: null,
    waypoints: [],
  }
}
