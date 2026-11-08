import type { MissionChecklistExecution } from '../types/checklistExecution'

type Progress = Pick<
  MissionChecklistExecution,
  | 'evidencePolicyVersion'
  | 'minimumEvidenceCount'
  | 'eligibleEvidenceCount'
  | 'minimumImageCount'
  | 'minimumVideoCount'
  | 'eligibleImageCount'
  | 'eligibleVideoCount'
>

/** Policy V3 needs the requested images AND the requested videos; a surplus of one never covers the other. */
export const isPerTypeEvidence = (item: Progress) =>
  item.evidencePolicyVersion === 3

/** Files still missing. For policy V3 the shortfalls of both media types are added, never netted against each other. */
export function evidenceShortfall(item: Progress): number {
  if (isPerTypeEvidence(item))
    return (
      Math.max(
        0,
        (item.minimumImageCount ?? 0) - (item.eligibleImageCount ?? 0),
      ) +
      Math.max(
        0,
        (item.minimumVideoCount ?? 0) - (item.eligibleVideoCount ?? 0),
      )
    )
  return Math.max(
    0,
    (item.minimumEvidenceCount ?? 0) - (item.eligibleEvidenceCount ?? 0),
  )
}

/** Count shown next to a checklist; omit media types with no count and no requirement. */
export function evidenceCountLabel(item: Progress): string {
  if (isPerTypeEvidence(item)) {
    const imageCount = item.eligibleImageCount ?? 0
    const minimumImages = item.minimumImageCount ?? 0
    const videoCount = item.eligibleVideoCount ?? 0
    const minimumVideos = item.minimumVideoCount ?? 0
    const counts = [
      imageCount !== 0 || minimumImages !== 0
        ? `ảnh ${imageCount}/${minimumImages}`
        : '',
      videoCount !== 0 || minimumVideos !== 0
        ? `video ${videoCount}/${minimumVideos}`
        : '',
    ].filter(Boolean)
    return counts.join(' · ')
  }
  const count = item.eligibleEvidenceCount ?? 0
  const minimum = item.minimumEvidenceCount ?? 0
  return count !== 0 || minimum !== 0 ? `${count}/${minimum}` : ''
}
