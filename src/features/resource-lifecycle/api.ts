import { apiRequest } from '../../shared/api/httpClient'
import type {
  AlertResponse,
  AuditLogResponse,
  DroneHealthResponse,
  MaintenanceCycleResponse,
  OverviewResponse,
  PolicyFamily,
  PolicyImpactPreview,
  PolicyRequest,
  PolicyResponse,
  PolicyVersionResponse,
  RecommendationResponse,
  ScheduleForecastItem,
  StaffWorkloadResponse,
  UsageRequest,
  UsageResponse,
} from './types'

const BASE = '/api/resource-lifecycle'

export const resourceLifecycleApi = {
  getOverview: (signal?: AbortSignal) =>
    apiRequest<OverviewResponse>(`${BASE}/overview`, { signal }),

  listDrones: (signal?: AbortSignal) =>
    apiRequest<DroneHealthResponse[]>(`${BASE}/drones`, { signal }),

  listStaff: (signal?: AbortSignal) =>
    apiRequest<StaffWorkloadResponse[]>(`${BASE}/staff`, { signal }),

  getMyWorkload: (signal?: AbortSignal) =>
    apiRequest<StaffWorkloadResponse>(`${BASE}/staff/me`, { signal }),

  listUsage: (
    params?: { resourceKind?: string; resourceId?: string; status?: string },
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams()
    if (params?.resourceKind) query.set('resourceKind', params.resourceKind)
    if (params?.resourceId) query.set('resourceId', params.resourceId)
    if (params?.status) query.set('status', params.status)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return apiRequest<UsageResponse[]>(`${BASE}/usage${suffix}`, { signal })
  },

  recordUsage: (body: UsageRequest) =>
    apiRequest<UsageResponse>(`${BASE}/usage`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  verifyUsage: (usageId: string, body: { approved: boolean; reason: string }) =>
    apiRequest<UsageResponse>(`${BASE}/usage/${encodeURIComponent(usageId)}/verify`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listPolicies: (family?: PolicyFamily, signal?: AbortSignal) => {
    const suffix = family ? `?family=${encodeURIComponent(family)}` : ''
    return apiRequest<PolicyResponse[]>(`${BASE}/policies${suffix}`, { signal })
  },

  createPolicy: (body: PolicyRequest) =>
    apiRequest<PolicyResponse>(`${BASE}/policies`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updatePolicy: (policyId: string, body: PolicyRequest) =>
    apiRequest<PolicyResponse>(`${BASE}/policies/${encodeURIComponent(policyId)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  previewPolicy: (policyId: string) =>
    apiRequest<PolicyImpactPreview>(`${BASE}/policies/${encodeURIComponent(policyId)}/preview`, {
      method: 'POST',
    }),

  activatePolicy: (policyId: string, body: { expectedRevision: number; reason: string }) =>
    apiRequest<PolicyResponse>(`${BASE}/policies/${encodeURIComponent(policyId)}/activate`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deactivatePolicy: (policyId: string, body: { expectedRevision: number; reason: string }) =>
    apiRequest<PolicyResponse>(`${BASE}/policies/${encodeURIComponent(policyId)}/deactivate`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listPolicyVersions: (policyId: string) =>
    apiRequest<PolicyVersionResponse[]>(`${BASE}/policies/${encodeURIComponent(policyId)}/versions`),

  listMaintenanceCycles: (openOnly = false, signal?: AbortSignal) =>
    apiRequest<MaintenanceCycleResponse[]>(
      `${BASE}/maintenance-cycles?openOnly=${openOnly ? 'true' : 'false'}`,
      { signal },
    ),

  submitMaintenanceWork: (
    cycleId: string,
    body: {
      workNotes: string
      evidenceReference: string
      checklistItems?: string[]
      replacedComponents?: string[]
    },
  ) =>
    apiRequest<MaintenanceCycleResponse>(
      `${BASE}/maintenance-cycles/${encodeURIComponent(cycleId)}/work`,
      { method: 'POST', body: JSON.stringify(body) },
    ),

  inspectMaintenanceCycle: (
    cycleId: string,
    body: { passed: boolean; reason: string },
  ) =>
    apiRequest<MaintenanceCycleResponse>(
      `${BASE}/maintenance-cycles/${encodeURIComponent(cycleId)}/inspect`,
      { method: 'POST', body: JSON.stringify(body) },
    ),

  listAlerts: (status?: string, signal?: AbortSignal) => {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : ''
    return apiRequest<AlertResponse[]>(`${BASE}/alerts${suffix}`, { signal })
  },

  actOnAlert: (alertId: string, body: { action: 'ACKNOWLEDGE' | 'RESOLVE'; reason: string }) =>
    apiRequest<AlertResponse>(`${BASE}/alerts/${encodeURIComponent(alertId)}/action`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getScheduleForecasts: (signal?: AbortSignal) =>
    apiRequest<ScheduleForecastItem[]>(`${BASE}/forecasts/schedule`, { signal }),

  listAudits: (signal?: AbortSignal) =>
    apiRequest<AuditLogResponse[]>(`${BASE}/audits`, { signal }),

  recommendForMission: (missionId: string) =>
    apiRequest<RecommendationResponse>(
      `${BASE}/missions/${encodeURIComponent(missionId)}/recommend`,
      { method: 'POST' },
    ),
}
