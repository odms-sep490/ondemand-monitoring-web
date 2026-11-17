import type { MissionChecklistExecution } from '../types/checklistExecution'
import { apiRequest } from '../../../shared/api/httpClient'
import type { MissionResponse } from '../../manager/types/missions'
export type CorrectionMode = 'DOSSIER_ADJUSTMENT' | 'SUPPLEMENTAL_FLIGHT'
export type InspectionCorrection = {
  id: string
  missionId: string
  version: number
  status: 'OPEN' | 'SUBMITTED' | 'RESOLVED'
  mode?: CorrectionMode
  reviewToken: string
  requestedBy: string
  requestedAt: string
  resolvedAt: string | null
  supplementalMissionId: string | null
  supplementalMissionCode: string | null
  supplementalMissionStatus: string | null
  items: {
    executionId: string
    orderChecklistItemId?: string
    content: string
    requestedExecutionVersion: number
    reason: string
    mediaIds: string[]
  }[]
  events: {
    action: string
    actor: string
    occurredAt: string
    note: string | null
  }[]
}
export type SupplementInspectionResult = {
  missionId: string
  missionCode: string
  completedAt: string | null
  executions: MissionChecklistExecution[]
}
export type CorrectionItemRequest = {
  executionId: string
  expectedVersion: number
  reason: string
  mediaIds: string[]
}
const path = (id: string) =>
  `/api/missions/${encodeURIComponent(id)}/inspection-corrections`
export const inspectionCorrectionApi = {
  reconcileChecklistReview: (id: string) =>
    apiRequest<boolean>(`${path(id)}/reconcile-checklist-review`, { method: 'POST' }),
  list: (id: string, signal?: AbortSignal) =>
    apiRequest<InspectionCorrection[]>(path(id), { signal }),
  request: (
    id: string,
    clientRequestId: string,
    items: CorrectionItemRequest[],
    mode: CorrectionMode = 'SUPPLEMENTAL_FLIGHT',
  ) =>
    apiRequest<InspectionCorrection>(path(id), {
      method: 'POST',
      body: { clientRequestId, items, mode },
    }),
  supplementResult: (id: string, correctionId: string, signal?: AbortSignal) =>
    apiRequest<SupplementInspectionResult>(`${path(id)}/${encodeURIComponent(correctionId)}/supplement-result`, { signal }),
  synchronizeSupplement: (id: string, correctionId: string) =>
    apiRequest<InspectionCorrection>(`${path(id)}/${encodeURIComponent(correctionId)}/synchronize-supplement`, { method: 'POST' }),
  decide: (
    id: string,
    row: InspectionCorrection,
    action: 'resubmit' | 'resolve' | 'return' | 'require-flight',
    note: string,
  ) =>
    apiRequest<InspectionCorrection>(
      `${path(id)}/${encodeURIComponent(row.id)}/${action}`,
      {
        method: 'POST',
        body: {
          expectedVersion: row.version,
          reviewToken: row.reviewToken,
          note,
        },
      },
    ),
  createMission: (
    id: string,
    row: InspectionCorrection,
    body: {
      clientRequestId: string
      scopeLabel: string
      scheduledStartAt: string
      scheduledEndAt: string
    },
  ) =>
    apiRequest<MissionResponse>(
      `${path(id)}/${encodeURIComponent(row.id)}/missions`,
      { method: 'POST', body: { ...body, expectedVersion: row.version } },
    ),
  finalize: (
    id: string,
    row: InspectionCorrection,
    expectedPlanRevision: number,
  ) =>
    apiRequest<MissionResponse>(
      `${path(id)}/${encodeURIComponent(row.id)}/finalize-plan`,
      { method: 'POST', body: { expectedPlanRevision } },
    ),
}

export type InternalCorrectionPlanningContext = {
  sourceMissionId: string
  correctionId: string
}
export type InternalCorrectionCreation = {
  sourceMissionId: string
  correction: InspectionCorrection
}
