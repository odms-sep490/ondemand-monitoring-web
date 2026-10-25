import { authSession, authenticatedFetch } from '../../auth/api/authApi'
import { env } from '../../../config/env'

const baseUrl =
  import.meta.env.VITE_FLIGHT_CONTROL_API_URL ?? 'http://localhost:8090'
// Short cache: dedupes simultaneous callers but keeps live flight telemetry fresh (was 2s).
const STATUS_CACHE_MS = 300

let statusCache: { fetchedAt: number; value: FlightControlStatus } | null = null
let statusRequest: Promise<FlightControlStatus> | null = null

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, options)
  const payload = await response.json().catch(() => undefined)
  if (!response.ok) {
    throw new Error(
      payload?.error ?? `Flight Controller HTTP ${response.status}`,
    )
  }
  return payload as T
}

export type FlightControlStatus = {
  online: boolean
  missionId?: string
  deviceId?: string
  inAir?: boolean
  positionReady?: boolean
  altitudeM?: number
  speedMps?: number
  batteryPercent?: number
  rawPx4BatteryPercent?: number | null
  batteryState?: 'NORMAL' | 'LOW' | 'CRITICAL' | 'EMERGENCY'
  headingDeg?: number
  connection?: { grpcConnected?: boolean; px4Connected?: boolean }
  freshness?: { px4BatteryAgeS?: number | null }
}

export const flightControlApi = {
  baseUrl,
  status: () => {
    const now = Date.now()
    if (statusCache && now - statusCache.fetchedAt < STATUS_CACHE_MS) {
      return Promise.resolve(statusCache.value)
    }
    if (statusRequest) return statusRequest

    statusRequest = request<FlightControlStatus>('/api/control/status')
      .then((value) => {
        statusCache = { fetchedAt: Date.now(), value }
        return value
      })
      .finally(() => {
        statusRequest = null
      })
    return statusRequest
  },
  bindSession: async (missionId: string, deviceId: string) => {
    const authorization = await authenticatedFetch(
      `${env.apiBaseUrl}/api/missions/${encodeURIComponent(missionId)}`,
    )
    if (!authorization.ok) {
      throw new Error(
        `Mission access check failed (HTTP ${authorization.status}); refresh the mission or sign in again`,
      )
    }
    const accessToken = authSession.getAccessToken()
    if (!accessToken) {
      throw new Error('Authentication is required to bind the flight session')
    }
    return request<{ ok: boolean; missionId: string; deviceId: string }>(
      '/api/control/session',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId, deviceId, accessToken }),
      },
    )
  },
  releaseSession: (missionId?: string) =>
    request<{
      ok: boolean
      released: boolean
      retainedVideo?: boolean
      message?: string
    }>('/api/control/session/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionId }),
    }),
}
