import type {
  RuntimeCheck,
  ItemState,
  PreflightMessages,
  RuntimeStatus,
  RuntimePreflightStatus,
  WeatherPreflightStatus,
  WeatherObservationForm,
} from './preflightTypes'
import type { PreflightItemKey } from '../../types/mission'
import { RUNTIME_KEY_MAP, ALL_PREFLIGHT_KEYS } from './preflightConstants'

export function mapRuntimeToItems(checks: RuntimeCheck[]) {
  const mapped: Partial<Record<PreflightItemKey, ItemState>> = {}

  for (const check of checks) {
    const key =
      RUNTIME_KEY_MAP[check.key] ??
      (ALL_PREFLIGHT_KEYS.includes(check.key as PreflightItemKey)
        ? (check.key as PreflightItemKey)
        : undefined)
    if (!key) continue

    const current = mapped[key]
    const result =
      check.status === 'PASS' || check.status === 'WARN'
        ? 'ok'
        : check.status === 'FAIL'
          ? 'fail'
          : null

    if (!current || current.result !== 'fail') {
      mapped[key] = {
        result,
        status: check.status,
        message: check.message,
      }
    }
  }

  return mapped
}

export function statusText(
  t: PreflightMessages,
  status?: RuntimeStatus,
  message?: string,
) {
  if (!status) return t.statusNoTrigger
  if (status === 'PASS') return message || t.itemPass
  if (status === 'WARN') return message || t.statusWarnNoBlock
  if (status === 'FAIL') return message || t.itemFail
  if (status === 'CHECKING') return message || t.statusChecking
  return message || t.statusWaiting
}

export function isRuntimeStatus(
  value: unknown,
): value is RuntimePreflightStatus {
  if (!value || typeof value !== 'object') return false
  const candidate = value as RuntimePreflightStatus
  return (
    typeof candidate.checkId === 'string' &&
    ['CHECKING', 'READY', 'FAILED'].includes(candidate.status) &&
    typeof candidate.progress === 'number' &&
    Array.isArray(candidate.checks)
  )
}

export function isWeatherStatus(
  value: unknown,
): value is WeatherPreflightStatus {
  if (!value || typeof value !== 'object') return false
  const candidate = value as WeatherPreflightStatus
  return (
    ['PASS', 'WARN', 'FAIL'].includes(candidate.status) &&
    typeof candidate.safeToFly === 'boolean' &&
    typeof candidate.summary === 'string' &&
    typeof candidate.windSpeedMps === 'number' &&
    typeof candidate.windGustMps === 'number' &&
    typeof candidate.precipitationMmH === 'number' &&
    typeof candidate.visibilityKm === 'number' &&
    typeof candidate.temperatureC === 'number' &&
    typeof candidate.humidityPercent === 'number' &&
    Array.isArray(candidate.advisories)
  )
}

export function formatWeatherObservedAt(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function weatherFormFromStatus(
  status: WeatherPreflightStatus | null,
): WeatherObservationForm {
  return {
    source:
      status?.advisories.find((item) => item.startsWith('Nguồn: '))?.slice(7) ??
      '',
    observedAt: status?.checkedAt
      ? formatWeatherObservedAt(new Date(status.checkedAt))
      : formatWeatherObservedAt(),
    windSpeedMps: status ? String(status.windSpeedMps) : '',
    windGustMps: status ? String(status.windGustMps) : '',
    precipitationMmH: status ? String(status.precipitationMmH) : '',
    visibilityKm: status ? String(status.visibilityKm) : '',
    temperatureC: status ? String(status.temperatureC) : '',
    humidityPercent: status ? String(status.humidityPercent) : '',
    decision: status?.status ?? 'PASS',
    notes: status?.summary ?? '',
  }
}

export function isMissionInFlight(status?: string | null) {
  return (
    status === 'IN_FLIGHT' || status === 'IN_PROGRESS' || status === 'RETURNING'
  )
}

export function demoFlightToken(missionId: string, deviceId: string) {
  return `demo-flight-token:${missionId}:${deviceId}:${Date.now()}`
}
