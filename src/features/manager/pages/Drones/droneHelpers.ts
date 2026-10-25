import type { DroneStatus } from '../../../../shared/types/domain'
import type { DroneResponse } from '../../types/drones'

export type FilterChip =
  'ALL' | 'AVAILABLE' | 'FLYING' | 'MAINTENANCE' | 'OUT_OF_SERVICE'

export const FILTER_CHIP_VALUES: FilterChip[] = [
  'ALL',
  'AVAILABLE',
  'FLYING',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
]

// Manager-actionable transitions [ĐỀ XUẤT per MNG-09]
export const MANUAL_TRANSITIONS: Partial<Record<DroneStatus, DroneStatus[]>> = {
  AVAILABLE: ['MAINTENANCE', 'OFFLINE'],
  MAINTENANCE: ['AVAILABLE', 'OUT_OF_SERVICE'],
  OUT_OF_SERVICE: ['MAINTENANCE'],
  OFFLINE: ['AVAILABLE'],
}

export function matchesFilter(
  drone: DroneResponse,
  filter: FilterChip,
): boolean {
  if (filter === 'ALL') return true
  if (filter === 'AVAILABLE') return drone.status === 'AVAILABLE'
  if (filter === 'FLYING')
    return (
      drone.status === 'IN_MISSION' ||
      drone.status === 'RESERVED' ||
      drone.status === 'RETURNING'
    )
  if (filter === 'MAINTENANCE') return drone.status === 'MAINTENANCE'
  if (filter === 'OUT_OF_SERVICE') return drone.status === 'OUT_OF_SERVICE'
  return true
}
