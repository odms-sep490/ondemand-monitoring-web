import type {
  PersistedPreflightCheck,
  RuntimePreflightStatus,
  PersistedPreflightUpdate,
  RuntimeStatus,
  PersistedPreflightItemStatus,
} from './preflightTypes'
import { authenticatedFetch } from '../../../auth/api/authApi'
import { env } from '../../../../config/env'

export function runtimeStatusFromPersisted(
  persisted: PersistedPreflightCheck,
): RuntimePreflightStatus {
  return {
    checkId: persisted.id,
    status:
      persisted.status === 'PASSED'
        ? 'READY'
        : persisted.status === 'FAILED' || persisted.status === 'CANCELLED'
          ? 'FAILED'
          : 'CHECKING',
    progress: persisted.progressPercent,
    checks: persisted.items.map((item) => ({
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
      measuredValue: item.measuredValue,
    })),
  }
}

export async function fetchCurrentPersistedPreflight(
  missionId: string,
  signal?: AbortSignal,
  deviceId?: string,
) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/missions/${encodeURIComponent(missionId)}/pre-device-checks/current${deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : ''}`,
    { cache: 'no-store', signal },
  )
  if (!response.ok) {
    throw new Error(`Preflight result request failed (${response.status})`)
  }
  const payload = await response.json()
  const persisted = payload?.data ?? payload
  if (!persisted || typeof persisted.id !== 'string') return null
  return persisted as PersistedPreflightCheck
}

export async function startPersistedPreflight(missionId: string, deviceId?: string) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/missions/${encodeURIComponent(missionId)}/pre-device-checks${deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : ''}`,
    { method: 'POST' },
  )
  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.message ?? error?.error?.message ?? `Start preflight ${response.status}`)
  }
  const payload = await response.json()
  const persisted = payload?.data ?? payload
  if (!persisted || typeof persisted.id !== 'string') {
    throw new Error('Invalid preflight response')
  }
  return persisted as PersistedPreflightCheck
}

export async function fetchPersistedPreflight(
  persistedId: string,
  signal?: AbortSignal,
) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/pre-device-checks/${encodeURIComponent(persistedId)}`,
    { cache: 'no-store', signal },
  )
  if (!response.ok) return null
  const payload = await response.json()
  const persisted = payload?.data ?? payload
  if (!persisted || typeof persisted.id !== 'string') return null
  return persisted as PersistedPreflightCheck
}

export async function updatePersistedPreflightItem(
  persistedId: string,
  checkType: string,
  update: PersistedPreflightUpdate,
) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/pre-device-checks/${encodeURIComponent(persistedId)}/items/${encodeURIComponent(checkType)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    },
  )
  if (!response.ok) {
    throw new Error(`Persisted preflight item ${checkType} ${response.status}`)
  }
  const payload = await response.json()
  const persisted = payload?.data ?? payload
  return persisted as PersistedPreflightCheck
}

export async function recheckPersistedPreflightItem(
  persistedId: string,
  checkType: string,
) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/pre-device-checks/${encodeURIComponent(persistedId)}/items/${encodeURIComponent(checkType)}/recheck`,
    { method: 'POST' },
  )
  if (!response.ok) {
    throw new Error(`Recheck preflight item ${checkType} ${response.status}`)
  }
  const payload = await response.json()
  const persisted = payload?.data ?? payload
  return persisted as PersistedPreflightCheck
}

export function persistedStatusFromRuntime(
  status: RuntimeStatus,
): PersistedPreflightItemStatus {
  if (status === 'PASS' || status === 'WARN') return 'PASSED'
  if (status === 'FAIL') return 'FAILED'
  if (status === 'CHECKING') return 'CHECKING'
  return 'PENDING'
}
