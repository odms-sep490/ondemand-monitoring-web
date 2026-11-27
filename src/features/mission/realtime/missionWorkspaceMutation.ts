import { apiRequest } from '../../../shared/api/httpClient'
import {
  notifyMissionWorkspaceChanged,
  type WorkspaceComponent,
} from './missionWorkspaceUpdates'

export async function missionWorkspaceMutation<T>(
  missionId: string,
  components: readonly WorkspaceComponent[],
  path: string,
  options: Parameters<typeof apiRequest>[1],
): Promise<T> {
  const result = await apiRequest<T>(path, options)
  notifyMissionWorkspaceChanged(missionId, components)
  return result
}
