// ─── Types ───────────────────────────────────────────────────────────────────

export type RuntimeStatus = 'PENDING' | 'CHECKING' | 'PASS' | 'WARN' | 'FAIL'

export type RuntimeOverallStatus = 'CHECKING' | 'READY' | 'FAILED'

export type RuntimeCheck = {
  key: string
  name: string
  status: RuntimeStatus
  message: string
  critical: boolean
}

export type RuntimePreflightStatus = {
  checkId: string
  status: RuntimeOverallStatus
  progress: number
  checks: RuntimeCheck[]
}

export type StoredPreflightStatus = {
  savedAt: number
  runtimeSessionId?: string | null
  status: RuntimePreflightStatus
}

export type WeatherCheckStatus = 'PASS' | 'WARN' | 'FAIL'

export type WeatherPreflightStatus = {
  id?: string
  missionId?: string
  droneCode?: string
  status: WeatherCheckStatus
  safeToFly: boolean
  summary: string
  windSpeedMps: number
  windGustMps: number
  precipitationMmH: number
  visibilityKm: number
  temperatureC: number
  humidityPercent: number
  advisories: string[]
  checkedAt: string
}

export type StoredWeatherStatus = {
  savedAt: number
  status: WeatherPreflightStatus
}

export type PostflightCheckStatus = {
  id: string
  missionId?: string | null
  deviceConnectionId?: string | null
  deviceCode?: string | null
  deviceName?: string | null
  droneCode?: string | null
  checkedBy?: string | null
  status?: string | null
  batteryOk?: boolean | null
  motorOk?: boolean | null
  cameraOk?: boolean | null
  gpsOk?: boolean | null
  communicationOk?: boolean | null
  physicalConditionOk?: boolean | null
  overallOk: boolean
  faultType?: string | null
  notes?: string | null
  landingBatteryPercent?: number | null
  landingBatteryState?: string | null
  landingAltitudeM?: number | null
  landingSpeedMps?: number | null
  landingHeadingDeg?: number | null
  landingTelemetryOnline?: boolean | null
  checkedAt: string
  startedAt?: string | null
  completedAt?: string | null
  totalChecks?: number | null
  passedChecks?: number | null
  failedChecks?: number | null
  progressPercent?: number | null
  items?: Array<{
    id?: string | null
    checkType?: string | null
    checkName?: string | null
    status?:
      'PASS' | 'WARN' | 'FAIL' | 'PASSED' | 'FAILED' | 'PENDING' | string | null
    checkLevel?: string | null
    message?: string | null
    checkedAt?: string | null
  }>
}

export type GpsPoint = { latitude: number; longitude: number }
