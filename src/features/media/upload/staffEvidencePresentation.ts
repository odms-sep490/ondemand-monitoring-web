import type { MissionChecklistResponse } from '../../mission/types/checklistExecution'
import type { LocalMedia } from '../api/operatorMediaApi'

/** Presentation only: keep backend identity, eligibility and review status intact. */
export function withStaffLocalPreviews<
  T extends { mediaId: string; mediaType: string },
>(
  candidates: T[],
  localMedia: LocalMedia[],
  missionId: string,
  missionAliases: string[] = [],
): T[] {
  const scope = new Set([missionId, ...missionAliases])
  return candidates.map((candidate) => {
    const local = localMedia.find(
      (item) =>
        scope.has(item.missionId) &&
        item.status !== 'REMOVED' &&
        item.backendMediaId === candidate.mediaId &&
        item.localAvailable !== false &&
        item.uploadChannel !== 'STAFF_FILE' &&
        item.mediaType === candidate.mediaType,
    )
    if (!local?.localPreviewUrl) return candidate
    return {
      ...candidate,
      localPreviewUrl: local.localPreviewUrl,
      localThumbnailUrl: local.localThumbnailUrl,
    }
  })
}

export function withStaffLocalEvidence(
  checklist: MissionChecklistResponse | undefined,
  localMedia: LocalMedia[],
  missionId: string,
  missionAliases: string[] = [],
): MissionChecklistResponse | undefined {
  if (!checklist || checklist.missionId !== missionId) return undefined
  return {
    ...checklist,
    executions: checklist.executions.map((item) => ({
      ...item,
      evidence: item.evidence
        ? withStaffLocalPreviews(
            item.evidence,
            localMedia,
            missionId,
            missionAliases,
          )
        : item.evidence,
    })),
  }
}
