import { apiRequest } from '../../../shared/api/httpClient'
import type { MissionResponse } from '../types/missions'
import type { ChecklistAssignmentSelection, ExecutionPlan, MissionCancellationResponse, RevisionReasonRequest, SafeStop } from '../types/planning'

import type {
  DeviceTypeResponse,
  DeviceTypeRequest,
  DeviceModelResponse,
  DeviceModelRequest,
  DeviceResponse,
  DeviceRequest,
  SimulationZone,
  SimulationZoneRequest,
  ZonePolygonRequest,
  PlanningGridResponse,
  PlanningMetadataResponse,
  PlanningEnvironmentSample,
  SimulationMapFeature,
} from '../types/planning'

const orderPath = (id: string) => `/api/orders/${encodeURIComponent(id)}`
const missionPath = (id: string) => `/api/missions/${encodeURIComponent(id)}`

export const planningApi = {
  getOrderMissions: (id: string, signal?: AbortSignal) => apiRequest<MissionResponse[]>(`${orderPath(id)}/missions`, { signal }),
  getExecutionPlan: (id: string, signal?: AbortSignal) => apiRequest<ExecutionPlan>(`${orderPath(id)}/execution-plan`, { signal }),
  getAssignments: (id: string, signal?: AbortSignal) => apiRequest<ChecklistAssignmentSelection>(`${missionPath(id)}/checklist-assignments`, { signal }),
  updateMissionChecklistAssignments: (id: string, expectedPlanRevision: number, itemIds: string[]) => apiRequest<ChecklistAssignmentSelection>(`${missionPath(id)}/checklist-assignments`, {
    method: 'PUT', body: { expectedPlanRevision, items: itemIds.map(orderChecklistItemId => ({ orderChecklistItemId })) },
  }),
  finalizeExecutionPlan: (id: string, expectedPlanRevision: number) => apiRequest<ExecutionPlan>(`${orderPath(id)}/execution-plan/finalize`, { method: 'POST', body: { expectedPlanRevision, decompositionConfirmed: true } }),
  amendExecutionPlan: (id: string, request: RevisionReasonRequest) => apiRequest<{ orderId: string; executionPlanStatus: 'DRAFT'; executionPlanRevision: number; amendedAt: string; amendmentReason: string }>(`${orderPath(id)}/execution-plan/amend`, { method: 'POST', body: request }),
  cancelMission: (id: string, request: RevisionReasonRequest) => apiRequest<MissionCancellationResponse>(`${missionPath(id)}/cancel`, { method: 'POST', body: request }),
  getSafeStop: (id: string, signal?: AbortSignal) => apiRequest<SafeStop>(`${missionPath(id)}/safe-stop`, { signal }),
  requestSafeStop: (id: string, request: RevisionReasonRequest) => apiRequest<SafeStop>(`${missionPath(id)}/safe-stop`, { method: 'POST', body: request }),
  confirmSafeStop: (id: string, confirmation: string) => apiRequest<SafeStop>(`${missionPath(id)}/safe-stop/confirm`, { method: 'POST', body: { landedAndDisarmed: true, controlSessionClosed: true, confirmation } }),
  cleanupSafeStop: (id: string) => apiRequest<SafeStop>(`${missionPath(id)}/safe-stop/cleanup`, { method: 'POST' }),
  // ── Device Types CRUD ──
  listDeviceTypes(signal?: AbortSignal): Promise<DeviceTypeResponse[]> {
    return apiRequest<DeviceTypeResponse[]>('/api/device-types', { signal })
  },
  getDeviceType(id: string, signal?: AbortSignal): Promise<DeviceTypeResponse> {
    return apiRequest<DeviceTypeResponse>(`/api/device-types/${id}`, { signal })
  },
  createDeviceType(data: DeviceTypeRequest): Promise<DeviceTypeResponse> {
    return apiRequest<DeviceTypeResponse>('/api/device-types', { method: 'POST', body: data })
  },
  updateDeviceType(id: string, data: DeviceTypeRequest): Promise<DeviceTypeResponse> {
    return apiRequest<DeviceTypeResponse>(`/api/device-types/${id}`, { method: 'PUT', body: data })
  },
  deleteDeviceType(id: string): Promise<void> {
    return apiRequest<void>(`/api/device-types/${id}`, { method: 'DELETE' })
  },

  // ── Device Models CRUD ──
  listDeviceModels(signal?: AbortSignal): Promise<DeviceModelResponse[]> {
    return apiRequest<DeviceModelResponse[]>('/api/device-models', { signal })
  },
  getDeviceModel(id: string, signal?: AbortSignal): Promise<DeviceModelResponse> {
    return apiRequest<DeviceModelResponse>(`/api/device-models/${id}`, { signal })
  },
  createDeviceModel(data: DeviceModelRequest): Promise<DeviceModelResponse> {
    return apiRequest<DeviceModelResponse>('/api/device-models', { method: 'POST', body: data })
  },
  updateDeviceModel(id: string, data: DeviceModelRequest): Promise<DeviceModelResponse> {
    return apiRequest<DeviceModelResponse>(`/api/device-models/${id}`, { method: 'PUT', body: data })
  },
  deleteDeviceModel(id: string): Promise<void> {
    return apiRequest<void>(`/api/device-models/${id}`, { method: 'DELETE' })
  },

  // ── Devices CRUD ──
  listDevices(signal?: AbortSignal): Promise<DeviceResponse[]> {
    return apiRequest<DeviceResponse[]>('/api/devices', { signal })
  },
  getDevice(id: string, signal?: AbortSignal): Promise<DeviceResponse> {
    return apiRequest<DeviceResponse>(`/api/devices/${id}`, { signal })
  },
  createDevice(data: DeviceRequest): Promise<DeviceResponse> {
    return apiRequest<DeviceResponse>('/api/devices', { method: 'POST', body: data })
  },
  updateDevice(id: string, data: DeviceRequest): Promise<DeviceResponse> {
    return apiRequest<DeviceResponse>(`/api/devices/${id}`, { method: 'PUT', body: data })
  },
  deleteDevice(id: string): Promise<void> {
    return apiRequest<void>(`/api/devices/${id}`, { method: 'DELETE' })
  },

  // ── Planning Environment ──
  getPlanningGrid(signal?: AbortSignal): Promise<PlanningGridResponse> {
    return apiRequest<PlanningGridResponse>('/api/planning/environment/grid', { signal })
  },
  getPlanningMetadata(signal?: AbortSignal): Promise<PlanningMetadataResponse> {
    return apiRequest<PlanningMetadataResponse>('/api/planning/environment/metadata', { signal })
  },
  getPlanningEnvironmentSample(signal?: AbortSignal): Promise<PlanningEnvironmentSample> {
    return apiRequest<PlanningEnvironmentSample>('/api/planning/environment/sample', { signal })
  },

  // ── Simulation Map ──
  getSimulationMap(signal?: AbortSignal): Promise<SimulationMapFeature[]> {
    return apiRequest<SimulationMapFeature[]>('/api/simulation-map', { signal })
  },

  // ── Zones CRUD ──
  listZones(signal?: AbortSignal): Promise<SimulationZone[]> {
    return apiRequest<SimulationZone[]>('/api/zones', { signal })
  },
  createZone(data: SimulationZoneRequest): Promise<SimulationZone> {
    return apiRequest<SimulationZone>('/api/zones', { method: 'POST', body: data })
  },
  deleteZone(id: string): Promise<void> {
    return apiRequest<void>(`/api/zones/${id}`, { method: 'DELETE' })
  },
  updateZonePolygon(id: string, data: ZonePolygonRequest): Promise<SimulationZone> {
    return apiRequest<SimulationZone>(`/api/zones/${id}/polygon`, { method: 'PUT', body: data })
  },
}
