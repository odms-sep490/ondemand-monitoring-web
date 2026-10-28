import type { PreflightItemResult } from '../../types/mission'
import { preflightPageMessages } from './PreflightPage.messages'

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

export type PersistedPreflightItemStatus =
  'PENDING' | 'CHECKING' | 'PASSED' | 'FAILED'

export type PersistedPreflightStatus =
  'CHECKING' | 'PASSED' | 'FAILED' | 'CANCELLED'

export type PersistedPreflightCheck = {
  id: string
  status: PersistedPreflightStatus
  progressPercent: number
  items: Array<{
    checkType: string
    checkName: string
    status: PersistedPreflightItemStatus
    checkLevel: 'CRITICAL' | 'WARNING' | 'INFO'
    message?: string | null
  }>
}

export type PersistedPreflightUpdate = {
  status: PersistedPreflightItemStatus
  message: string
  measuredValue?: string
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

export type WeatherObservationForm = {
  source: string
  observedAt: string
  windSpeedMps: string
  windGustMps: string
  precipitationMmH: string
  visibilityKm: string
  temperatureC: string
  humidityPercent: string
  decision: WeatherCheckStatus
  notes: string
}

export type ItemState = {
  result: PreflightItemResult | null
  detail?: string
  message?: string
  status?: RuntimeStatus
}

export type PreflightMessages = (typeof preflightPageMessages)['vi']
