import type {
  RuntimePreflightStatus,
  WeatherPreflightStatus,
  PostflightCheckStatus,
  StoredPreflightStatus,
  StoredWeatherStatus,
} from './types'
import { authenticatedFetch } from '../../../auth/api/authApi'
import { env } from '../../../../config/env'

// ─── Storage helpers ─────────────────────────────────────────────────────────

export function preflightStateStorageKey(
  missionId: string,
  droneLabel: string,
) {
  return `omss.droneOperator.preflightState.${missionId}.${droneLabel}`
}

export function weatherStateStorageKey(missionId: string, droneLabel: string) {
  return `omss.droneOperator.weatherState.${missionId}.${droneLabel}`
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

export function isPostflightStatus(
  value: unknown,
): value is PostflightCheckStatus {
  if (!value || typeof value !== 'object') return false
  const candidate = value as PostflightCheckStatus
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.overallOk === 'boolean' &&
    typeof candidate.checkedAt === 'string'
  )
}

export function postflightItemFailed(item: { status?: string | null }) {
  return item.status === 'FAIL' || item.status === 'FAILED'
}

export function normalizePostflightItemStatus(status?: string | null) {
  if (status === 'PASSED') return 'PASS'
  if (status === 'FAILED') return 'FAIL'
  if (status === 'PENDING') return 'WARN'
  return status ?? null
}

export function hasAnyPostflightType(
  items: Array<{ checkType?: string | null; status?: string | null }>,
  types: string[],
) {
  const relevant = items.filter((item) =>
    types.includes(String(item.checkType ?? '').toUpperCase()),
  )
  if (relevant.length === 0) return null
  return relevant.every((item) => !postflightItemFailed(item))
}

export function normalizePostflightStatus(
  value: unknown,
): PostflightCheckStatus | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<PostflightCheckStatus>
  if (typeof candidate.id !== 'string') return null
  const items = (candidate.items ?? []).map((item) => ({
    ...item,
    status: normalizePostflightItemStatus(item.status),
  }))
  const status = candidate.status
  const overallOk =
    typeof candidate.overallOk === 'boolean'
      ? candidate.overallOk
      : status === 'PASSED'
        ? true
        : status === 'FAILED'
          ? false
          : items.length > 0
            ? items.every((item) => !postflightItemFailed(item))
            : false
  const checkedAt =
    candidate.checkedAt ??
    candidate.completedAt ??
    candidate.startedAt ??
    new Date().toISOString()

  return {
    ...candidate,
    id: candidate.id,
    overallOk,
    checkedAt,
    items,
    batteryOk:
      candidate.batteryOk ??
      hasAnyPostflightType(items, ['BATTERY', 'E1', 'E4']),
    motorOk:
      candidate.motorOk ??
      hasAnyPostflightType(items, ['PROPELLERS', 'MOTORS', 'P1', 'P2']),
    cameraOk:
      candidate.cameraOk ?? hasAnyPostflightType(items, ['CAMERA', 'E2']),
    gpsOk: candidate.gpsOk ?? hasAnyPostflightType(items, ['GPS', 'E3']),
    communicationOk:
      candidate.communicationOk ??
      hasAnyPostflightType(items, ['COMMUNICATION', 'D1']),
    physicalConditionOk:
      candidate.physicalConditionOk ??
      hasAnyPostflightType(items, ['AIRFRAME', 'A1', 'A2']),
  }
}

export function readStoredPreflightState(
  missionId: string,
  droneLabel?: string | null,
) {
  if (!droneLabel) return null
  try {
    const raw = window.localStorage.getItem(
      preflightStateStorageKey(missionId, droneLabel),
    )
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredPreflightStatus
    return isRuntimeStatus(parsed.status) ? parsed.status : null
  } catch {
    return null
  }
}

export function readStoredWeatherState(
  missionId: string,
  droneLabel?: string | null,
) {
  if (!droneLabel) return null
  try {
    const raw = window.localStorage.getItem(
      weatherStateStorageKey(missionId, droneLabel),
    )
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredWeatherStatus
    return isWeatherStatus(parsed.status) ? parsed.status : null
  } catch {
    return null
  }
}

export function runtimeStatusFromPersisted(persisted: {
  id: string
  status: 'CHECKING' | 'PASSED' | 'FAILED' | 'CANCELLED'
  progressPercent: number
  items?: Array<{
    checkType: string
    checkName: string
    status: 'PENDING' | 'CHECKING' | 'PASSED' | 'FAILED'
    checkLevel?: 'CRITICAL' | 'WARNING' | 'INFO'
    message?: string | null
  }>
}): RuntimePreflightStatus {
  return {
    checkId: persisted.id,
    status:
      persisted.status === 'PASSED'
        ? 'READY'
        : persisted.status === 'FAILED' || persisted.status === 'CANCELLED'
          ? 'FAILED'
          : 'CHECKING',
    progress: persisted.progressPercent,
    checks: (persisted.items ?? []).map((item) => ({
      key: item.checkType,
      name: item.checkName,
      status:
        item.status === 'PASSED'
          ? 'PASS'
          : item.status === 'FAILED'
            ? 'FAIL'
            : item.status,
      message: item.message ?? '',
      critical: item.checkLevel === 'CRITICAL',
    })),
  }
}

// ─── API helpers ─────────────────────────────────────────────────────────────

export async function fetchPersistedPreflight(
  missionId: string,
  signal?: AbortSignal,
) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/missions/${encodeURIComponent(missionId)}/pre-device-checks/current`,
    { cache: 'no-store', signal },
  )
  if (!response.ok) return null
  const payload = await response.json()
  const persisted = payload?.data ?? payload
  if (!persisted || typeof persisted.id !== 'string') return null
  return runtimeStatusFromPersisted(persisted)
}

export async function fetchLatestWeatherCheck(
  missionId: string,
  signal?: AbortSignal,
) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/weather/pre-device-checks/latest?missionId=${encodeURIComponent(missionId)}`,
    { cache: 'no-store', signal },
  )
  if (!response.ok) return null
  const payload = await response.json()
  const weather = payload?.data ?? payload
  return isWeatherStatus(weather) ? weather : null
}

export async function fetchLatestPostflightCheck(
  missionId: string,
  signal?: AbortSignal,
) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/missions/${encodeURIComponent(missionId)}/post-device-checks/current`,
    { cache: 'no-store', signal },
  )
  if (!response.ok) return null
  const payload = await response.json()
  const postflight = payload?.data ?? payload
  const normalized = normalizePostflightStatus(postflight)
  return normalized && isPostflightStatus(normalized) ? normalized : null
}
