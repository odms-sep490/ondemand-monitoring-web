import { missionWorkspaceMutation } from '../realtime/missionWorkspaceMutation'
import { apiRequest } from '../../../shared/api/httpClient'
import type {
  ChecklistExecutionUpdateRequest,
  MissionChecklistExecution,
  MissionChecklistResponse,
} from '../types/checklistExecution'

const path = (missionId: string) =>
  `/api/missions/${encodeURIComponent(missionId)}/checklist-executions`

export const checklistExecutionApi = {
  getMissionChecklistExecutions: (missionId: string, signal?: AbortSignal) =>
    apiRequest<MissionChecklistResponse>(path(missionId), { signal }),
  updateMissionChecklistExecution: (
    missionId: string,
    executionId: string,
    body: ChecklistExecutionUpdateRequest,
  ) =>
    missionWorkspaceMutation<MissionChecklistExecution>(
      missionId,
      ['checklist'],
      `${path(missionId)}/${encodeURIComponent(executionId)}`,
      { method: 'PATCH', body },
    ),
}
