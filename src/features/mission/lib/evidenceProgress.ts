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

/** Count shown next to a checklist: `3 / 5` for older policies, `ảnh 2/3 · video 0/1` for V3. */
export function evidenceCountLabel(item: Progress): string {
  if (isPerTypeEvidence(item))
    return (
      `ảnh ${item.eligibleImageCount ?? 0}/${item.minimumImageCount ?? 0}` +
      ` · video ${item.eligibleVideoCount ?? 0}/${item.minimumVideoCount ?? 0}`
    )
  return `${item.eligibleEvidenceCount ?? 0}/${item.minimumEvidenceCount ?? 0}`
}
