// Slow, steady cruise so the drone drifts calmly along the map route.
export const GPS_TARGET_CRUISE_SPEED_MPS = 8

export const MAX_GPS_ROUTE_WAYPOINTS = 5

export const STATUS_POLL_MS = 400

export const STATUS_RETRY_MS = 1200

export const STATUS_MAX_FAILURES = 3

export const controlBaseUrl =
  import.meta.env.VITE_FLIGHT_CONTROL_API_URL ?? 'http://localhost:8090'

export const restrictedZoneTypes = new Set([
  'AIRPORT',
  'RESTRICTED',
  'NO_FLY',
  'NO-FLY',
  'NOFLY',
])

export const cautionDistanceM = 50

export const dangerDistanceM = 20

export const px4HomeSimX = Number(
  import.meta.env.VITE_GEOFENCE_PX4_HOME_SIM_X_M ?? 0,
)

export const px4HomeSimY = Number(
  import.meta.env.VITE_GEOFENCE_PX4_HOME_SIM_Y_M ?? -280,
)

export const standardPressurePa = 101_325

export const standardTemperatureK = 288.15

export const standardLapseRateKPerM = 0.0065

export const barometricExponent = 5.255877
