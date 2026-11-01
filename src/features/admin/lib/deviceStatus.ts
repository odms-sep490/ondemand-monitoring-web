import type { DeviceStatus } from '../types/devices'

/** antd Tag colour per device status. */
export const DEVICE_STATUS_COLOR: Record<DeviceStatus, string> = {
  AVAILABLE: 'success',
  RESERVED: 'processing',
  PREFLIGHT: 'processing',
  IN_MISSION: 'blue',
  ACTIVE_MISSION: 'blue',
  RETURNING: 'cyan',
  CHARGING: 'gold',
  IDLE_CHARGING: 'gold',
  MAINTENANCE: 'warning',
  OUT_OF_SERVICE: 'error',
  OFFLINE: 'default',
}
