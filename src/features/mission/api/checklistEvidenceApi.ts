import { apiRequest } from '../../../shared/api/httpClient'
import type {
  ContentAssessment,
  ContentAssessmentRequest,
  CustomerEvidenceSelectionRequest,
  DeliverySuggestion,
  EvidenceCandidate,
  MissionChecklistEvidence,
} from '../types/checklistExecution'
const root = (missionId: string) =>
  `/api/missions/${encodeURIComponent(missionId)}`
export const checklistEvidenceApi = {
  getDeliverySuggestion: (missionId: string, executionId: string) =>
    apiRequest<DeliverySuggestion>(
      `${root(missionId)}/checklist-executions/${encodeURIComponent(executionId)}/delivery-suggestion`,
    ),
  assessImageContent: (
    missionId: string,
    executionId: string,
    evidenceId: string,
    body: ContentAssessmentRequest,
    signal?: AbortSignal,
  ) =>
    apiRequest<ContentAssessment>(
      `${root(missionId)}/checklist-executions/${encodeURIComponent(executionId)}/evidence/${encodeURIComponent(evidenceId)}/content-assessment`,
      { method: 'POST', body, signal },
    ),
  selectForCustomer: (
    missionId: string,
    executionId: string,
    body: CustomerEvidenceSelectionRequest,
  ) =>
    apiRequest<MissionChecklistEvidence[]>(
      `${root(missionId)}/checklist-executions/${encodeURIComponent(executionId)}/customer-selection`,
      { method: 'PUT', body },
    ),
  candidates: (missionId: string, page = 0, signal?: AbortSignal) =>
    apiRequest<EvidenceCandidate[]>(
      `${root(missionId)}/checklist-evidence/candidates`,
      { query: { page, size: 50 }, signal },
    ),
  attach: (
    missionId: string,
    executionId: string,
    mediaId: string,
    expectedVersion: number,
  ) =>
    apiRequest<MissionChecklistEvidence[]>(
      `${root(missionId)}/checklist-executions/${encodeURIComponent(executionId)}/evidence/${encodeURIComponent(mediaId)}`,
      { method: 'PUT', body: { expectedVersion } },
    ),
  batch: (
    missionId: string,
    mediaId: string,
    targets: { executionId: string; expectedVersion: number }[],
  ) =>
    apiRequest<MissionChecklistEvidence[]>(
      `${root(missionId)}/checklist-evidence/batch`,
      { method: 'POST', body: { mediaId, targets } },
    ),
  detach: (
    missionId: string,
    executionId: string,
    evidenceId: string,
    expectedVersion: number,
  ) =>
    apiRequest<void>(
      `${root(missionId)}/checklist-executions/${encodeURIComponent(executionId)}/evidence/${encodeURIComponent(evidenceId)}`,
      { method: 'DELETE', query: { expectedVersion } },
    ),
}
