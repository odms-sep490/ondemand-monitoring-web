import { apiRequest } from '../../../shared/api/httpClient'
import type { MissionResponse } from '../types/missions'
import type { ChecklistAssignmentSelection, ExecutionPlan, MissionCancellationResponse, RevisionReasonRequest, SafeStop } from '../types/planning'

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
}
