import { apiRequest } from '../../../shared/api/httpClient'
import type { MissionResponse } from '../../manager/types/missions'
export type InspectionCorrection = {
  id: string
  missionId: string
  version: number
  status: 'OPEN' | 'SUBMITTED' | 'RESOLVED'
  reviewToken: string
  requestedBy: string
  requestedAt: string
  resolvedAt: string | null
  supplementalMissionId: string | null
  supplementalMissionCode: string | null
  supplementalMissionStatus: string | null
  items: {
    executionId: string
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
export type CorrectionItemRequest = {
  executionId: string
  expectedVersion: number
  reason: string
  mediaIds: string[]
}
const path = (id: string) =>
  `/api/missions/${encodeURIComponent(id)}/inspection-corrections`
export const inspectionCorrectionApi = {
  list: (id: string, signal?: AbortSignal) =>
    apiRequest<InspectionCorrection[]>(path(id), { signal }),
  request: (
    id: string,
    clientRequestId: string,
    items: CorrectionItemRequest[],
  ) =>
    apiRequest<InspectionCorrection>(path(id), {
      method: 'POST',
      body: { clientRequestId, items },
    }),
  decide: (
    id: string,
    row: InspectionCorrection,
    action: 'resubmit' | 'resolve' | 'return',
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
