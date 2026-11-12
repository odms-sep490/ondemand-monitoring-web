import type { EvidenceCandidate } from '../../mission/types/checklistExecution'
import type { LocalMedia } from '../api/operatorMediaApi'

/** Presentation only: keep backend identity, eligibility and review status intact. */
export function withStaffLocalPreviews(
  candidates: EvidenceCandidate[], localMedia: LocalMedia[], missionId: string,
): EvidenceCandidate[] {
  return candidates.map((candidate) => {
    const local = localMedia.find((item) => item.missionId === missionId &&
      item.backendMediaId === candidate.mediaId && item.localAvailable !== false &&
      item.uploadChannel !== 'STAFF_FILE' && item.mediaType === candidate.mediaType)
    if (!local?.localPreviewUrl) return candidate
    return { ...candidate, localPreviewUrl: local.localPreviewUrl,
      localThumbnailUrl: local.localThumbnailUrl }
  })
}
