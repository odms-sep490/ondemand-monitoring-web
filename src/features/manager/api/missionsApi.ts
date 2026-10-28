import { apiRequest } from '../../../shared/api/httpClient'
import { env } from '../../../config/env'
import { toISODate } from '../lib/calendarWeek'
import type {
  CancelMissionRequest,
  CreateMissionRequest,
  FlightPermitUpdateRequest,
  MediaAssetResponse,
  MediaResponse,
  Mission,
  MissionCalendarItem,
  MissionResponse,
  MissionResultResponse,
  MissionUpdateRequest,
  PatchScheduleRequest,
  PersistedPostDeviceCheckResponse,
  PersistedPreflightCheckResponse,
  PreflightCheckResponse,
  WeatherPreflightCheckResponse,
} from '../types/missions'

export function toMissionCalendarItem(
  source: MissionResponse,
): MissionCalendarItem {
  return {
    id: source.id,
    orderId: source.orderId,
    orderCode: source.orderCode ?? null,
    missionCode: source.missionCode,
    status: source.status,
    flightPermitStatus: source.flightPermitStatus ?? 'NOT_REQUESTED',
    flightPermitNote: source.flightPermitNote ?? null,
    flightPermitFileName: source.flightPermitFileName ?? null,
    flightPermitContentType: source.flightPermitContentType ?? null,
    flightPermitDataUrl: source.flightPermitDataUrl ?? null,
    safeStopStatus: source.safeStopStatus,
    safeStopRequestedAt: source.safeStopRequestedAt,
    safeStopConfirmedAt: source.safeStopConfirmedAt,
    safeStopCleanedAt: source.safeStopCleanedAt,
    droneId: source.droneId ?? source.deviceId ?? null,
    operatorId: source.operatorId,
    droneAssignmentId: null,
    operatorAssignmentId: null,
    scheduledStartAt: source.scheduledStartAt,
    scheduledEndAt: source.scheduledEndAt ?? null,
    orderPreferredDateFrom: source.orderPreferredDateFrom ?? null,
    orderPreferredDateTo: source.orderPreferredDateTo ?? null,
    orderPreferredTimeName: source.orderPreferredTimeName ?? null,
    orderPreferredTimeStart: source.orderPreferredTimeStart ?? null,
    orderPreferredTimeEnd: source.orderPreferredTimeEnd ?? null,
    orderWeatherFallback: source.orderWeatherFallback ?? 'CONTACT_CUSTOMER',
    lastRescheduleReason: source.lastRescheduleReason ?? null,
    lastRescheduleNote: source.lastRescheduleNote ?? null,
    lastRescheduledAt: source.lastRescheduledAt ?? null,
    scheduleRevision: source.scheduleRevision ?? 0,
    addressText: source.address,
    centerLat: source.latitude,
    centerLon: source.longitude,
    radiusM: null,
    requiredSensor: null,
    mediaRequirements: [],
    flightPlan: null,
    waypoints: [],
    serviceLabel: source.orderTitle || null,
    droneCode: source.droneCode ?? source.deviceCode ?? null,
    droneName: source.deviceName ?? null,
    operatorName:
      source.staffAssignments?.find((item) => item.assignedRole === 'PILOT')
        ?.staffName ?? null,
    staffAssignments: source.staffAssignments ?? [],
  }
}

/** MNG-04 / MNG-05 mission-creation + dispatch APIs. See evd/00-PLAN.md §3-5. */
export const missionsApi = {
  /**
   * Canonical planning-only creation command. Requires an idempotency key
   * and public plan revision; replay returns the original Mission.
   */
  createMission(
    orderId: string,
    request: CreateMissionRequest,
  ): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${encodeURIComponent(orderId)}`, {
      method: 'POST',
      body: request,
    })
  },

  replaceMission(
    missionId: string,
    request: CreateMissionRequest,
  ): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${encodeURIComponent(missionId)}/replacement`, {
      method: 'POST',
      body: request,
    })
  },

  finalizeReplacementMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(
      `/api/missions/${encodeURIComponent(missionId)}/finalize-replacement`,
      { method: 'POST' },
    )
  },

  /** `GET /api/missions/{id}` [BE `MissionController.getById`]. */
  getMission(id: string, signal?: AbortSignal): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${id}`, { signal })
  },

  /** `GET /api/missions/{id}` [BE `MissionResponse`]. Full manager/operator detail shape. */
  getMissionResponse(
    id: string,
    signal?: AbortSignal,
  ): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${id}`, { signal })
  },

  updateFlightPermit(
    missionId: string,
    request: FlightPermitUpdateRequest,
  ): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(
      `/api/missions/${missionId}/flight-permit`,
      { method: 'PATCH', body: request },
    )
  },

  /** `POST /api/missions/{id}/assign-device` [BE]. */
  assignDrone(missionId: string, droneId: string, deviceRole: string = 'MAIN'): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${missionId}/assign-device`, {
      method: 'POST',
      body: { deviceId: droneId, deviceRole },
    })
  },

  /** `POST /api/missions/{id}/assign-device` [BE]. */
  assignDevice(missionId: string, deviceId: string, deviceRole: string = 'MAIN'): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${missionId}/assign-device`, {
      method: 'POST',
      body: { deviceId, deviceRole },
    })
  },

  /** `POST /api/missions/{id}/remove-device` [BE]. */
  removeDevice(missionId: string, deviceId: string, reason?: string): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${missionId}/remove-device`, {
      method: 'POST',
      body: { deviceId, reason },
    })
  },

  /** `POST /api/missions/{id}/assign-staff` [BE]. */
  assignOperator(missionId: string, operatorId: string, assignedRole: string = 'PILOT'): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${missionId}/assign-staff`, {
      method: 'POST',
      body: { staffId: operatorId, assignedRole },
    })
  },

  /** `POST /api/missions/{id}/assign-staff` [BE]. */
  assignStaff(missionId: string, staffId: string, assignedRole: string = 'PILOT'): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${missionId}/assign-staff`, {
      method: 'POST',
      body: { staffId, assignedRole },
    })
  },

  /** `POST /api/missions/{id}/remove-staff` [BE]. */
  removeStaff(missionId: string, staffId: string, assignedRole?: string, reason?: string): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${missionId}/remove-staff`, {
      method: 'POST',
      body: { staffId, assignedRole, reason },
    })
  },

  /**
   * Lists missions for the MNG-06 calendar and MNG-08 list. Real backend:
   * `GET /api/missions/all` (no server-side filters, so `from`/`to`/`status`
   * are applied client-side). Mock/test transport keeps the filtered
   * `GET /api/missions` handler.
   */
  async listMissions(
    options: {
      from?: string
      to?: string
      status?: string
      signal?: AbortSignal
    } = {},
  ): Promise<{ items: MissionCalendarItem[] }> {
    if (env.useMockApi || import.meta.env.MODE === 'test') {
      const query: Record<string, string> = {}
      if (options.from) query['from'] = options.from
      if (options.to) query['to'] = options.to
      if (options.status) query['status'] = options.status
      return apiRequest<{ items: MissionCalendarItem[] }>('/api/missions', {
        query,
        signal: options.signal,
      })
    }
    const all = await apiRequest<MissionResponse[]>('/api/missions/all', {
      signal: options.signal,
    })
    const items = all
      .map(toMissionCalendarItem)
      .filter((item) => {
        if (options.status && item.status !== options.status) return false
        const day = item.scheduledStartAt
          ? toISODate(new Date(item.scheduledStartAt))
          : undefined
        if (options.from && (!day || day < options.from)) return false
        if (options.to && (!day || day > options.to)) return false
        return true
      })
    return { items }
  },

  /** `PUT /api/missions/{id}` [BE `MissionController.updateMission`]. Planning-phase edit of schedule/checklist. */
  updateMission(
    missionId: string,
    request: { scheduledStartAt?: string; scheduledEndAt?: string; checklistIds?: string[] },
  ): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${encodeURIComponent(missionId)}`, {
      method: 'PUT',
      body: request,
    })
  },

  /**
   * `PUT /api/missions/{id}` [BE `MissionUpdateRequest`]. Reschedules the
   * mission window; conflicts surface as ApiError.
   */
  rescheduleMission(
    missionId: string,
    request: MissionUpdateRequest,
  ): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}`, {
      method: 'PUT',
      body: request,
    })
  },

  /** Updates a pre-flight mission schedule after enforcing the Order fallback policy. */
  async patchSchedule(
    missionId: string,
    request: PatchScheduleRequest,
  ): Promise<MissionCalendarItem> {
    const response = await apiRequest<MissionResponse | MissionCalendarItem>(`/api/missions/${missionId}/schedule`, {
      method: 'PATCH',
      body: request,
    })
    return 'customerName' in response
      ? toMissionCalendarItem(response)
      : response
  },

  /**
   * `POST /api/missions/{id}/cancel` [ĐỀ XUẤT — field `cancellation_reason`
   * in BRIEF A6]. The UI must confirm with a 2-step modal (MNG-07 design).
   */
  cancelMission(
    missionId: string,
    request: CancelMissionRequest,
  ): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${missionId}/cancel`, {
      method: 'POST',
      body: request,
    })
  },

  /** `POST /api/missions/{id}/start?tokenValue=` [BE]. */
  startMission(
    missionId: string,
    tokenValue: string,
  ): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/start`, {
      method: 'POST',
      query: { tokenValue },
    })
  },

  /** `POST /api/missions/{id}/complete` [BE]. */
  completeMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/complete`, {
      method: 'POST',
    })
  },

  /** `POST /api/missions/{id}/fail` [BE]. */
  failMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/fail`, {
      method: 'POST',
    })
  },

  /** `PATCH /api/missions/{id}/accept` [BE]. Header: X-Operator-Id. */
  acceptMission(
    missionId: string,
    operatorId: string,
  ): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/accept`, {
      method: 'PATCH',
      headers: { 'X-Operator-Id': operatorId },
    })
  },

  /** `PATCH /api/missions/{id}/reject` [BE]. */
  rejectMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/reject`, {
      method: 'PATCH',
    })
  },

  /** `POST /api/missions/{id}/pre-device-check?droneCode=` [BE]. */
  preflightCheck(
    missionId: string,
    droneCode: string,
  ): Promise<PreflightCheckResponse> {
    return apiRequest<PreflightCheckResponse>(
      `/api/missions/${missionId}/pre-device-check`,
      {
        method: 'POST',
        query: { droneCode },
      },
    )
  },

  /** `GET /api/missions/{missionId}/media` [BE]. */
  getMissionMedia(
    missionId: string,
    signal?: AbortSignal,
  ): Promise<MediaResponse[]> {
    return apiRequest<MediaResponse[]>(`/api/missions/${missionId}/media`, {
      signal,
    })
  },

  /**
   * `POST /api/missions/{id}/media` [BE]. Upload media (multipart).
   * TODO: `apiRequest` always sets `Content-Type: application/json` and
   * JSON-stringifies the body, so a `FormData` body will NOT be sent as
   * multipart through it as-is. This needs either a dedicated multipart
   * transport path in `httpClient.ts` (skip JSON stringify + let the
   * browser set the multipart boundary) or a separate upload helper
   * before this method is wired up to a real upload flow.
   */
  uploadMissionMedia(
    missionId: string,
    file: File,
  ): Promise<MediaAssetResponse> {
    const formData = new FormData()
    formData.append('file', file)
    return apiRequest<MediaAssetResponse>(`/api/missions/${missionId}/media`, {
      method: 'POST',
      body: formData,
    })
  },

  /** `GET /api/missions/{missionId}/pre-device-checks/current` [BE]. */
  getCurrentPreflight(
    missionId: string,
    signal?: AbortSignal,
  ): Promise<PersistedPreflightCheckResponse> {
    return apiRequest<PersistedPreflightCheckResponse>(
      `/api/missions/${missionId}/pre-device-checks/current`,
      { signal },
    )
  },

  /** `GET /api/missions/{missionId}/post-device-checks/current` [BE]. */
  getCurrentPostDeviceCheck(
    missionId: string,
    signal?: AbortSignal,
  ): Promise<PersistedPostDeviceCheckResponse> {
    return apiRequest<PersistedPostDeviceCheckResponse>(
      `/api/missions/${missionId}/post-device-checks/current`,
      { signal },
    )
  },

  /** `GET /api/missions/{missionId}/result` [BE]. */
  getMissionResult(
    missionId: string,
    signal?: AbortSignal,
  ): Promise<MissionResultResponse | null> {
    return apiRequest<MissionResultResponse | null>(
      `/api/missions/${missionId}/result`,
      { signal },
    ).then((result) => result ?? null)
  },

  /** `POST /api/manager/mission-results/{resultId}/approve` [BE]. Makes the mission result customer-deliverable. */
  approveMissionResult(
    resultId: string,
    note?: string,
  ): Promise<MissionResultResponse> {
    return apiRequest<MissionResultResponse>(
      `/api/manager/mission-results/${resultId}/approve`,
      {
        method: 'POST',
        body: note?.trim() ? { note: note.trim() } : {},
      },
    )
  },

  rejectMissionResult(
    resultId: string,
    note: string,
  ): Promise<MissionResultResponse> {
    return apiRequest<MissionResultResponse>(
      `/api/manager/mission-results/${encodeURIComponent(resultId)}/reject`,
      {
        method: 'POST',
        body: { note: note.trim() || null },
      },
    )
  },

  /** `GET /api/weather/pre-device-checks/latest?missionId=...` [BE]. Latest weather result recorded during preflight. */
  getLatestWeatherCheck(
    missionId: string,
    signal?: AbortSignal,
  ): Promise<WeatherPreflightCheckResponse | null> {
    return apiRequest<WeatherPreflightCheckResponse | null>(
      '/api/weather/pre-device-checks/latest',
      { query: { missionId }, signal },
    )
  },

}
