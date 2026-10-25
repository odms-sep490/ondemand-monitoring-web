import type { PreflightItemKey } from '../../types/mission'

// Internal sentinel for "no mission selected" — never rendered, only used
// for control flow so it stays stable across language switches (unlike the
// translated `noMissionSelected` label, which is only for display).
export const NO_MISSION_SENTINEL = '__no_mission_selected__'

export const NO_DRONE_SENTINEL = '__no_drone_assigned__'

export const controlBaseUrl =
  import.meta.env.VITE_FLIGHT_CONTROL_API_URL ?? 'http://localhost:8090'

export const RUNTIME_KEY_MAP: Record<string, PreflightItemKey> = {
  GAZEBO: 'gazebo',
  PX4: 'px4',
  MAVSDK: 'mavsdk',
  PX4_CONTROL: 'px4Control',
  LOCAL_POSITION: 'localPosition',
  MAVSDK_HEALTH: 'mavsdkHealth',
  BATTERY: 'battery',
  LIDAR: 'lidar',
  CAMERA: 'camera',
  BACKEND: 'backend',
  MEDIA: 'media',
  MODULES: 'modules',
}

export const ALL_PREFLIGHT_KEYS: PreflightItemKey[] = [
  'battery',
  'camera',
  'lidar',
  'px4',
  'mavsdk',
  'px4Control',
  'mavsdkHealth',
  'backend',
  'media',
]
