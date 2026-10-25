import type {
  Mission,
  MissionStaffRole,
  MissionResult,
  MissionResultMedia,
  ReferenceCaptureResult,
  PreflightCheck,
  DeviceImage,
  DeviceStatus,
} from '../types/mission'
import type { FlightControlStatus } from '../../drone-operator/api/flightControlApi'

import { env } from '../../../config/env'
import { ApiError } from '../../../shared/api/httpClient'

const API_BASE = `${env.apiBaseUrl}/api`

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

import { authenticatedFetch } from '../../auth/api/authApi'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers)
  headers.set('Content-Type', 'application/json')

  const res = await authenticatedFetch(url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new ApiError(errorData.message || `HTTP ${res.status}: ${res.statusText}`, {
      status: res.status, code: errorData.code, method: options?.method ?? 'GET', path: url,
    })
  }

  const payload: ApiResponse<T> = await res.json()
  return payload.data
}

export const missionApi = {
  getPermissions: (missionId: string) =>
    request<import('../types/permissions').MissionPermissions>(
      `${API_BASE}/missions/${encodeURIComponent(missionId)}/permissions`,
    ),
  // GET /api/missions?operatorId={id} – list all missions for an operator
  getMissionsByOperator: async (operatorId: string): Promise<Mission[]> => {
    return request<Mission[]>(
      `${API_BASE}/missions?operatorId=${encodeURIComponent(operatorId)}`,
    )
  },

  // Query Mission Details
  getMissionById: async (missionId: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}`)
  },

  getMissionResult: async (
    missionId: string,
    signal?: AbortSignal,
  ): Promise<MissionResult | null> => {
    const res = await authenticatedFetch(
      `${API_BASE}/missions/${encodeURIComponent(missionId)}/result`,
      {
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (res.status === 404) return null

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new ApiError(errorData.message || `HTTP ${res.status}: ${res.statusText}`, {
        status: res.status, code: errorData.code, method: 'GET', path: `/api/missions/${missionId}/result`,
      })
    }

    const payload: ApiResponse<MissionResult> = await res.json()
    return payload.data
  },

  /**
   * POST /api/missions/{id}/media/capture-reference — the server uses the drone's latest telemetry
   * and Mapillary; the client sends no coordinates.
   */
  captureReferenceImage: async (missionId: string): Promise<ReferenceCaptureResult> => {
    const res = await authenticatedFetch(
      `${API_BASE}/missions/${encodeURIComponent(missionId)}/media/capture-reference`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } },
    )
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`)
    }
    const payload = (await res.json()) as { data: ReferenceCaptureResult }
    return payload.data
  },

  /** GET /api/missions/{id}/media — all uploaded media of a mission (fallback when no result yet). */
  getMissionMedia: async (
    missionId: string,
    signal?: AbortSignal,
  ): Promise<MissionResultMedia[]> => {
    const res = await authenticatedFetch(
      `${API_BASE}/missions/${encodeURIComponent(missionId)}/media`,
      { signal, headers: { 'Content-Type': 'application/json' } },
    )
    if (res.status === 404) return []
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(
        errorData.message || `HTTP ${res.status}: ${res.statusText}`,
      )
    }
    const payload = (await res.json()) as
      { data?: MissionResultMedia[] | null } | MissionResultMedia[]
    return (Array.isArray(payload) ? payload : payload.data) ?? []
  },

  submitMissionResult: async (
    missionId: string,
    payload: {
      status:
        'COMPLETED' | 'COMPLETED_WITH_ISSUES' | 'FAILED' | 'REVIEW_REQUIRED'
      startedAt?: string | null
      endedAt?: string | null
      completedAt?: string | null
      summary?: string | null
      notes?: string | null
      reviewedBy?: string | null
    },
  ): Promise<unknown> => {
    return request<unknown>(
      `${API_BASE}/missions/${encodeURIComponent(missionId)}/result`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    )
  },

  getPendingAssignmentMissions: async (): Promise<Mission[]> => {
    return request<Mission[]>(`${API_BASE}/missions/pending-assignment`)
  },

  getMyMissions: async (): Promise<Mission[]> => {
    return request<Mission[]>(`${API_BASE}/missions/mine`)
  },

  assignResources: async (
    missionId: string,
    deviceIds: string | string[],
    staffAssignments:
      Partial<Record<MissionStaffRole, string | string[]>> | string,
  ): Promise<Mission> => {
    const resolvedDeviceIds = Array.isArray(deviceIds) ? deviceIds : [deviceIds]
    let latest: Mission | null = null
    for (const [index, deviceId] of resolvedDeviceIds.entries()) {
      latest = await request<Mission>(
        `${API_BASE}/missions/${encodeURIComponent(missionId)}/assign-device`,
        {
          method: 'POST',
          body: JSON.stringify({
            deviceId,
            deviceRole: index === 0 ? 'MAIN' : 'SUPPORT',
          }),
        },
      )
    }
    const assignments =
      typeof staffAssignments === 'string'
        ? ({ PILOT: [staffAssignments] } as Partial<
            Record<MissionStaffRole, string[]>
          >)
        : staffAssignments

    for (const assignedRole of [
      'PILOT',
      'OPERATOR',
      'MAINTAINER',
      'INSPECTOR',
    ] as MissionStaffRole[]) {
      const roleStaff = assignments[assignedRole]
      const staffIds = Array.isArray(roleStaff)
        ? roleStaff
        : roleStaff
          ? [roleStaff]
          : []
      for (const staffId of staffIds) {
        latest = await request<Mission>(
          `${API_BASE}/missions/${encodeURIComponent(missionId)}/assign-staff`,
          {
            method: 'POST',
            body: JSON.stringify({ staffId, assignedRole }),
          },
        )
      }
    }
    if (!latest) throw new Error('Please assign at least one staff member.')
    return latest
  },

  acceptMyMission: async (missionId: string): Promise<Mission> => {
    return request<Mission>(
      `${API_BASE}/missions/${encodeURIComponent(missionId)}/accept-current`,
      { method: 'PATCH' },
    )
  },

  startMissionWorkflow: async (missionId: string): Promise<Mission> => {
    return request<Mission>(
      `${API_BASE}/missions/${encodeURIComponent(missionId)}/start-operation`,
      { method: 'POST' },
    )
  },

  rejectMyMission: async (
    missionId: string,
    reason: string,
  ): Promise<Mission> => {
    return request<Mission>(
      `${API_BASE}/missions/${encodeURIComponent(missionId)}/reject-current`,
      { method: 'PATCH', body: JSON.stringify({ reason }) },
    )
  },

  handoverMyMission: async (missionId: string): Promise<Mission> => {
    return request<Mission>(
      `${API_BASE}/missions/${encodeURIComponent(missionId)}/handover-current`,
      { method: 'POST' },
    )
  },

  assignDrone: async (missionId: string, droneId: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/assign-device`, {
      method: 'POST',
      body: JSON.stringify({ deviceId: droneId, deviceRole: 'MAIN' }),
    })
  },

  assignOperator: async (
    missionId: string,
    operatorId: string,
  ): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/assign-staff`, {
      method: 'POST',
      body: JSON.stringify({ staffId: operatorId, assignedRole: 'PILOT' }),
    })
  },

  // F3.1 Accept mission (PATCH /api/missions/{id}/accept)
  acceptMission: async (
    missionId: string,
    _operatorId?: string,
  ): Promise<Mission> => {
    void _operatorId // The backend resolves the accepting account from the access token.
    return request<Mission>(
      `${API_BASE}/missions/${missionId}/accept-current`,
      {
        method: 'PATCH',
      },
    )
  },

  // F3.1 Reject mission (PATCH /api/missions/{id}/reject)
  rejectMission: async (
    missionId: string,
    reason: string,
    _operatorId?: string,
  ): Promise<Mission> => {
    void _operatorId // The backend resolves the rejecting account from the access token.
    return request<Mission>(
      `${API_BASE}/missions/${missionId}/reject-current`,
      {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      },
    )
  },

  // F3.2 Connect GCS (POST /api/missions/{id}/connect)
  connectGcs: async (missionId: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/connect`, {
      method: 'POST',
    })
  },

  disconnectGcs: async (
    missionId: string,
    reason = 'MISSION_COMPLETED',
  ): Promise<Mission> => {
    return request<Mission>(
      `${API_BASE}/missions/${encodeURIComponent(missionId)}/disconnect?reason=${encodeURIComponent(reason)}`,
      { method: 'POST' },
    )
  },

  getTelemetryReadiness: async (
    missionId: string,
  ): Promise<{
    deviceId: string
    ready: boolean
    lastTelemetryAt: string | null
  }> => {
    return request(
      `${API_BASE}/missions/${encodeURIComponent(missionId)}/telemetry-readiness`,
    )
  },

  // F3.2 Run pre-device check (POST /api/missions/{id}/pre-device-check?deviceId=...)
  runPreflightCheck: async (
    missionId: string,
    deviceId: string,
  ): Promise<PreflightCheck> => {
    return request<PreflightCheck>(
      `${API_BASE}/missions/${missionId}/pre-device-check?deviceId=${encodeURIComponent(
        deviceId,
      )}`,
      { method: 'POST' },
    )
  },

  // F3.2 Replace Drone (PATCH /api/missions/{id}/replace-drone)
  replaceDrone: async (
    missionId: string,
    newDeviceCode: string,
  ): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/replace-drone`, {
      method: 'PATCH',
      body: JSON.stringify({ newDeviceCode }),
    })
  },

  // F3.2 Handover Control (POST /api/missions/{id}/handover)
  handoverControl: async (
    missionId: string,
    _newOperatorId?: string,
  ): Promise<Mission> => {
    void _newOperatorId // Flight control can only be handed to the authenticated pilot.
    return request<Mission>(
      `${API_BASE}/missions/${missionId}/handover-current`,
      {
        method: 'POST',
      },
    )
  },

  // F3.3 Start Mission / Takeoff (POST /api/missions/{id}/start)
  startMission: async (
    missionId: string,
    tokenValue?: string,
  ): Promise<Mission> => {
    const query = tokenValue
      ? `?tokenValue=${encodeURIComponent(tokenValue)}`
      : ''
    return request<Mission>(`${API_BASE}/missions/${missionId}/start${query}`, {
      method: 'POST',
    })
  },

  // F3.3 Upload Mission Image / Media (POST /api/missions/{id}/media)
  uploadMedia: async (
    missionId: string,
    deviceId: string,
    file: File,
  ): Promise<DeviceImage> => {
    const formData = new FormData()
    formData.append('deviceId', deviceId)
    formData.append('file', file)

    const res = await authenticatedFetch(
      `${API_BASE}/missions/${missionId}/media`,
      {
        method: 'POST',
        body: formData,
      },
    )

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `Upload failed: ${res.statusText}`)
    }

    const payload: ApiResponse<DeviceImage> = await res.json()
    return payload.data
  },

  // F3.3 Mark Returning (POST /api/missions/{id}/return)
  markReturning: async (missionId: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/return`, {
      method: 'POST',
    })
  },

  // F3.4 Start Postflight Checking (POST /api/missions/{id}/postflight)
  startPostflight: async (missionId: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/postflight`, {
      method: 'POST',
    })
  },

  // F3.5 Update Post-flight Status & Complete (PATCH /api/missions/{id}/postflight-status?deviceId=...)
  postFlightStatus: async (
    missionId: string,
    deviceId: string,
    newDeviceStatus: DeviceStatus,
    notes: string,
    inspectionResults?: Record<string, 'PASS' | 'WARN' | 'FAIL'>,
    telemetrySnapshot?: FlightControlStatus | null,
  ): Promise<Mission> => {
    return request<Mission>(
      `${API_BASE}/missions/${missionId}/postflight-status?deviceId=${encodeURIComponent(
        deviceId,
      )}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          newDeviceStatus,
          notes,
          inspectionResults,
          telemetrySnapshot,
        }),
      },
    )
  },

  // F3.5 Complete Mission (POST /api/missions/{id}/complete)
  completeMission: async (missionId: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/complete`, {
      method: 'POST',
    })
  },

  failMission: async (missionId: string, reason: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/fail`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },
}
