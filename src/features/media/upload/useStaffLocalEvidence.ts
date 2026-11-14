import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import type { MissionChecklistResponse } from '../../mission/types/checklistExecution'
import { operatorMediaApi } from '../api/operatorMediaApi'
import { withStaffLocalEvidence } from './staffEvidencePresentation'

/** One local lookup per Staff workspace, never one per checklist row. */
export function useStaffLocalEvidence(
  missionId: string,
  aliases: string[],
  checklist?: MissionChecklistResponse,
) {
  const scope = JSON.stringify([
    missionId,
    aliases,
    checklist?.executions.flatMap(
      (item) => item.evidence?.map((link) => link.mediaId) ?? [],
    ),
  ])
  const query = useApiQuery(async () => {
    if (
      !checklist ||
      checklist.missionId !== missionId ||
      !checklist.executions.some((item) => item.evidence?.length)
    )
      return { scope, items: [] }
    try {
      return { scope, items: await operatorMediaApi.list(missionId, aliases) }
    } catch {
      return { scope, items: [] }
    }
  }, [scope, checklist])
  const resolved = query.data?.scope === scope
  return {
    // Wait for the local lookup before mounting remote thumbnails.
    data: resolved
      ? withStaffLocalEvidence(checklist, query.data!.items, missionId, aliases)
      : undefined,
    loading: !resolved,
  }
}
