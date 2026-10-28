import type { PreflightItemKey } from '../../types/mission'

// Internal sentinel for "no mission selected" — never rendered, only used
// for control flow so it stays stable across language switches (unlike the
// translated `noMissionSelected` label, which is only for display).
export const NO_MISSION_SENTINEL = '__no_mission_selected__'

export const NO_DRONE_SENTINEL = '__no_drone_assigned__'

export const controlBaseUrl =
  import.meta.env.VITE_FLIGHT_CONTROL_API_URL ?? 'http://localhost:8090'

export const RUNTIME_KEY_MAP: Record<string, PreflightItemKey> = {
  // Persisted backend preflight codes.
  battery_health: 'battery_health',
  propeller_inspection: 'propeller_inspection',
  airframe_inspection: 'airframe_inspection',
  camera_health: 'camera_health',
  obstacle_sensor_health: 'obstacle_sensor_health',
  aircraft_connection: 'aircraft_connection',
  command_link: 'command_link',
  flight_controller: 'flight_controller',
  aircraft_readiness: 'aircraft_readiness',
  monitoring_connection: 'monitoring_connection',
  manual_override: 'manual_override',
  flight_visibility: 'flight_visibility',
  takeoff_area: 'takeoff_area',
  landing_area: 'landing_area',
  airspace_permission: 'airspace_permission',
}

export const ALL_PREFLIGHT_KEYS: PreflightItemKey[] = [
  'battery_health',
  'propeller_inspection',
  'airframe_inspection',
  'camera_health',
  'obstacle_sensor_health',
  'aircraft_connection',
  'command_link',
  'flight_controller',
  'aircraft_readiness',
  'monitoring_connection',
  'manual_override',
  'flight_visibility',
  'takeoff_area',
  'landing_area',
  'airspace_permission',
]

export const MANUAL_PREFLIGHT_KEYS = new Set<PreflightItemKey>([
  'propeller_inspection',
  'airframe_inspection',
  'camera_health',
  'obstacle_sensor_health',
  'manual_override',
  'flight_visibility',
  'takeoff_area',
  'landing_area',
])

export const MANUAL_FALLBACK_PREFLIGHT_KEYS = new Set<PreflightItemKey>([
  'aircraft_connection',
  'command_link',
  'flight_controller',
  'aircraft_readiness',
  'monitoring_connection',
])
