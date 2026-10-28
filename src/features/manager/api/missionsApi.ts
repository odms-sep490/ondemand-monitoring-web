import { apiRequest } from '../../../shared/api/httpClient'
import { env } from '../../../config/env'
import type {
  CancelMissionRequest,
  CreateIncidentRequest,
  CreateMissionRequest,
  FlightPermitUpdateRequest,
  LiveTelemetry,
  MediaAssetResponse,
  MediaResponse,
  Mission,
  MissionCalendarItem,
  MissionIncident,
  MissionPlanResponse,
  MissionResponse,
  MissionResultResponse,
  PatchScheduleRequest,
  PersistedPostDeviceCheckResponse,
  PersistedPreflightCheckResponse,
  PostFlightStatusRequest,
  PreflightCheckResponse,
  ResourceSuggestions,
  WeatherPreflightCheckRequest,
  WeatherPreflightCheckResponse,
} from '../types/missions'

type StaffMissionPage = {
  items: MissionResponse[]
  page: number
  totalPages: number
}

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
    attemptNumber: null,
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
    nearestBase: null,
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

  /** `POST /api/missions/{orderId}/additional`: create a PLANNING Mission on a finalized Order. */
  createAdditionalMission(
    orderId: string,
    request: CreateMissionRequest,
  ): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${encodeURIComponent(orderId)}/additional`, {
      method: 'POST',
      body: request,
    })
  },

  /** `POST /api/missions/{missionId}/confirm-planning`. */
  confirmMissionPlanning(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(
      `/api/missions/${encodeURIComponent(missionId)}/confirm-planning`,
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

  /**
   * `GET /api/missions/{id}/resource-suggestions` [BRIEF C4]. `scenario`
   * is a PROPOSED query flag the mock uses to reach the design's "không đủ
   * nguồn lực" state deterministically (see mock JSON `_note`); a real
   * backend would compute `feasible` from the mission's own data instead.
   */
  getResourceSuggestions(
    missionId: string,
    options?: { scenario?: 'insufficient'; signal?: AbortSignal },
  ): Promise<ResourceSuggestions> {
    return apiRequest<ResourceSuggestions>(
      `/api/missions/${missionId}/resource-suggestions`,
      {
        query: options?.scenario ? { scenario: options.scenario } : undefined,
        signal: options?.signal,
      },
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

  /** `POST /api/missions/{id}/assignments/{aid}/release` [BRIEF C4 = TK]. */
  releaseAssignment(
    missionId: string,
    assignmentId: string,
    releaseReason: string,
  ): Promise<Mission> {
    return apiRequest<Mission>(
      `/api/missions/${missionId}/assignments/${assignmentId}/release`,
      { method: 'POST', body: { releaseReason } },
    )
  },

  /**
   * `GET /api/missions?from=&to=&status=` [TK]. Lists missions within an
   * optional date range and optional status filter for MNG-06 calendar view.
   */
  async listMissions(
    options: {
      from?: string
      to?: string
      status?: string
      signal?: AbortSignal
    } = {},
  ): Promise<{ items: MissionCalendarItem[] }> {
    const query: Record<string, string> = {}
    if (options.from) query['from'] = options.from
    if (options.to) query['to'] = options.to
    if (options.status) query['status'] = options.status
    if (env.useMockApi || import.meta.env.MODE === 'test') {
      return apiRequest<{ items: MissionCalendarItem[] }>('/api/missions', {
        query,
        signal: options.signal,
      })
    }
    const items: MissionCalendarItem[] = []
    let page = 0
    let totalPages: number
    do {
      const result = await apiRequest<StaffMissionPage>('/api/missions/staff', {
        query: { ...query, page: String(page), size: '100' },
        signal: options.signal,
      })
      items.push(...result.items.map(toMissionCalendarItem))
      totalPages = result.totalPages
      page += 1
    } while (page < totalPages)
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
   * `GET /api/missions/{id}/live` [BRIEF C4]. Polling endpoint for real-time
   * telemetry, incidents and livestream state.
   */
  getLive(missionId: string, signal?: AbortSignal): Promise<LiveTelemetry> {
    return apiRequest<LiveTelemetry>(`/api/missions/${missionId}/live`, {
      signal,
    })
  },

  /**
   * `POST /api/missions/{id}/incidents` [ĐỀ XUẤT — table `mission_incident`
   * exists in BRIEF A6].
   */
  createIncident(
    missionId: string,
    request: CreateIncidentRequest,
  ): Promise<MissionIncident> {
    return apiRequest<MissionIncident>(`/api/missions/${missionId}/incidents`, {
      method: 'POST',
      body: request,
    })
  },

  /**
   * `POST /api/missions/{id}/retry` [ĐỀ XUẤT]. Creates a new mission from a
   * FAILED mission. Returns the new mission id.
   */
  retryMission(missionId: string): Promise<{ newMissionId: string }> {
    return apiRequest<{ newMissionId: string }>(
      `/api/missions/${missionId}/retry`,
      { method: 'POST' },
    )
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

  /** `GET /api/missions` [BE]. Lists missions, optionally filtered by operatorId. */
  listAllMissions(options?: {
    operatorId?: string
    signal?: AbortSignal
  }): Promise<MissionResponse[]> {
    const query: Record<string, string> = {}
    if (options?.operatorId) query['operatorId'] = options.operatorId
    return apiRequest<MissionResponse[]>('/api/missions', {
      query,
      signal: options?.signal,
    })
  },

  /** `GET /api/missions/pending-assignment` [BE]. */
  getPendingAssignment(signal?: AbortSignal): Promise<MissionResponse[]> {
    return apiRequest<MissionResponse[]>('/api/missions/pending-assignment', {
      signal,
    })
  },

  /** `GET /api/missions/code/{missionCode}` [BE]. */
  getMissionByCode(
    missionCode: string,
    signal?: AbortSignal,
  ): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/code/${missionCode}`, {
      signal,
    })
  },

  /** `GET /api/missions/{id}/plan` [BE]. */
  getMissionPlan(
    missionId: string,
    signal?: AbortSignal,
  ): Promise<MissionPlanResponse> {
    return apiRequest<MissionPlanResponse>(`/api/missions/${missionId}/plan`, {
      signal,
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

  /** `GET /api/missions/{missionId}/pre-device-checks` [BE]. History. */
  getPreflightHistory(
    missionId: string,
    signal?: AbortSignal,
  ): Promise<PersistedPreflightCheckResponse[]> {
    return apiRequest<PersistedPreflightCheckResponse[]>(
      `/api/missions/${missionId}/pre-device-checks`,
      { signal },
    )
  },

  /** `POST /api/missions/{missionId}/pre-device-checks` [BE]. Start a new preflight check session. */
  startPreflightCheck(
    missionId: string,
  ): Promise<PersistedPreflightCheckResponse> {
    return apiRequest<PersistedPreflightCheckResponse>(
      `/api/missions/${missionId}/pre-device-checks`,
      {
        method: 'POST',
      },
    )
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

  /** `POST /api/manager/missions/{missionId}/media-approvals/{mediaId}/approve` [BE]. Makes one media asset visible to the customer. */
  approveMissionMedia(missionId: string, mediaId: string): Promise<unknown> {
    return apiRequest<unknown>(
      `/api/manager/missions/${missionId}/media-approvals/${mediaId}/approve`,
      {
        method: 'POST',
      },
    )
  },
  rejectMissionMedia(missionId: string, mediaId: string): Promise<unknown> {
    return apiRequest<unknown>(
      `/api/manager/missions/${encodeURIComponent(missionId)}/media-approvals/${encodeURIComponent(mediaId)}/reject`,
      { method: 'POST' },
    )
  },

  /** `POST /api/missions/{id}/connect` [BE]. */
  connectMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/connect`, {
      method: 'POST',
    })
  },

  /** `POST /api/missions/{id}/disconnect` [BE]. */
  disconnectMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(
      `/api/missions/${missionId}/disconnect`,
      {
        method: 'POST',
      },
    )
  },

  /** `POST /api/missions/{id}/return` [BE]. */
  returnMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/return`, {
      method: 'POST',
    })
  },

  /** `POST /api/missions/{id}/postflight` [BE]. */
  postflightMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(
      `/api/missions/${missionId}/postflight`,
      {
        method: 'POST',
      },
    )
  },

  /** `POST /api/missions/{id}/gcs-lost` [BE]. Report GCS connection lost. */
  reportGcsLost(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/gcs-lost`, {
      method: 'POST',
    })
  },

  /** `POST /api/missions/{id}/handover` [BE]. Handover mission. */
  handoverMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/handover`, {
      method: 'POST',
    })
  },

  /** `PATCH /api/missions/{id}/replace-drone` [BE]. Replace drone on mission. */
  replaceDrone(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(
      `/api/missions/${missionId}/replace-drone`,
      {
        method: 'PATCH',
      },
    )
  },

  /** `PATCH /api/missions/{id}/postflight-status` [BE]. Update post-flight status. */
  updatePostflightStatus(
    missionId: string,
    request: PostFlightStatusRequest,
  ): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(
      `/api/missions/${missionId}/postflight-status`,
      {
        method: 'PATCH',
        body: request,
      },
    )
  },

  /** `POST /api/missions/{missionId}/images` [BE]. Upload image for mission. */
  uploadMissionImage(
    missionId: string,
    file: File,
  ): Promise<MediaAssetResponse> {
    // TODO: needs multipart handling - apiRequest JSON-stringifies body
    return apiRequest<MediaAssetResponse>(`/api/missions/${missionId}/images`, {
      method: 'POST',
      body: file,
    })
  },

  /** `POST /api/weather/preflight-check` [BE]. Check weather conditions. */
  checkWeather(
    request: WeatherPreflightCheckRequest,
  ): Promise<WeatherPreflightCheckResponse> {
    return apiRequest<WeatherPreflightCheckResponse>(
      '/api/weather/preflight-check',
      {
        method: 'POST',
        body: request,
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

  /** `GET /api/pre-device-checks/{id}` [BE]. Get preflight check by ID. */
  getPreflightCheckById(
    id: string,
    signal?: AbortSignal,
  ): Promise<PersistedPreflightCheckResponse> {
    return apiRequest<PersistedPreflightCheckResponse>(
      `/api/pre-device-checks/${id}`,
      { signal },
    )
  },

  /** `PATCH /api/pre-device-checks/{id}/items/{checkType}` [BE]. Update preflight check item. */
  updatePreflightCheckItem(
    id: string,
    checkType: string,
    data: unknown,
  ): Promise<PersistedPreflightCheckResponse> {
    return apiRequest<PersistedPreflightCheckResponse>(
      `/api/pre-device-checks/${id}/items/${checkType}`,
      {
        method: 'PATCH',
        body: data,
      },
    )
  },
}
