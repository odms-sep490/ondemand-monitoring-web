export type CockpitCommand =
  | 'takeoff'
  | 'gps_target_start'
  | 'stop'
  | 'photo'
  | 'return_to_base'
  | 'land'
  | 'emergency_stop'

export type CockpitTelemetry = {
  latitude: number | null
  longitude: number | null
  altitudeM: number | null
  speedMps: number | null
  verticalMps: number | null
  headingDeg: number | null
  rollDeg?: number | null
  pitchDeg?: number | null
  batteryPercent: number | null
  inAir: boolean
  flightMode: string | null
  baseDistanceKm: number | null
  targetDistanceKm: number | null
}

export type CockpitLayout = 'split' | 'camera' | 'map'
