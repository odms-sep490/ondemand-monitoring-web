import type { DroneStatus } from '../../../../shared/types/domain'
import type { DeviceResponse } from '../../types/drones'

/** Every backend `DeviceStatus` value, in display order. */
export const ALL_DRONE_STATUSES: DroneStatus[] = [
  'AVAILABLE',
  'RESERVED',
  'PREFLIGHT',
  'IN_MISSION',
  'ACTIVE_MISSION',
  'RETURNING',
  'CHARGING',
  'IDLE_CHARGING',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
  'OFFLINE',
]

export type FilterChip = 'ALL' | DroneStatus

export const FILTER_CHIP_VALUES: FilterChip[] = ['ALL', ...ALL_DRONE_STATUSES]

export type DroneGroup =
  'available' | 'inMission' | 'maintenance' | 'outOfService'

/** Stat-card grouping: every status belongs to exactly one group. */
export const DRONE_GROUPS: Record<DroneGroup, DroneStatus[]> = {
  available: ['AVAILABLE', 'CHARGING', 'IDLE_CHARGING'],
  inMission: ['RESERVED', 'PREFLIGHT', 'IN_MISSION', 'ACTIVE_MISSION', 'RETURNING'],
  maintenance: ['MAINTENANCE'],
  outOfService: ['OUT_OF_SERVICE', 'OFFLINE'],
}

// Manager-actionable transitions [ĐỀ XUẤT per MNG-09]
export const MANUAL_TRANSITIONS: Partial<Record<DroneStatus, DroneStatus[]>> = {
  AVAILABLE: ['MAINTENANCE', 'OFFLINE'],
  MAINTENANCE: ['AVAILABLE', 'OUT_OF_SERVICE'],
  OUT_OF_SERVICE: ['MAINTENANCE'],
  OFFLINE: ['AVAILABLE'],
}

export function groupCounts(drones: DeviceResponse[]): Record<DroneGroup, number> {
  const count = (group: DroneGroup) =>
    drones.filter((d) => DRONE_GROUPS[group].includes(d.status)).length
  return {
    available: count('available'),
    inMission: count('inMission'),
    maintenance: count('maintenance'),
    outOfService: count('outOfService'),
  }
}

export function matchesFilter(
  drone: DeviceResponse,
  filter: FilterChip,
): boolean {
  return filter === 'ALL' || drone.status === filter
}

export function matchesSearch(drone: DeviceResponse, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [
    drone.serialNumber,
    drone.name,
    drone.deviceModel?.modelName,
    drone.deviceModel?.manufacturer,
    drone.deviceModel?.code,
  ].some((value) => value?.toLowerCase().includes(q))
}
