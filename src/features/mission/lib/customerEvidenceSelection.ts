import type {
  MissionChecklistExecution,
  MissionChecklistResponse,
} from '../types/checklistExecution'

/** Count only selected evidence that the server considers eligible for final approval. */
export function customerSelectionProgress(
  item: MissionChecklistExecution,
  ids: readonly string[],
) {
  const evidence = (item.evidence ?? []).filter(
    (link) => ids.includes(link.evidenceId) && link.eligibleForFinalApproval,
  )
  const images = evidence.filter((link) => link.mediaType === 'IMAGE').length
  const videos = evidence.filter((link) => link.mediaType === 'VIDEO').length
  const total = images + videos
  const minimum = item.minimumEvidenceCount ?? 0
  if (item.evidencePolicyVersion === 3) {
    const minImages = item.minimumImageCount ?? 0
    const minVideos = item.minimumVideoCount ?? 0
    return {
      valid:
        evidence.length === ids.length &&
        images >= minImages &&
        videos >= minVideos,
      surplus: images > minImages || videos > minVideos,
    }
  }
  const type = item.requiredEvidenceType ?? 'IMAGE_OR_VIDEO'
  const matching = type === 'IMAGE' ? images : type === 'VIDEO' ? videos : total
  return {
    valid:
      evidence.length === ids.length &&
      matching >= minimum &&
      (type !== 'IMAGE_AND_VIDEO' || (images > 0 && videos > 0)),
    surplus: total > Math.max(minimum, type === 'IMAGE_AND_VIDEO' ? 2 : 0),
  }
}

export function checklistReadyForInspection(
  checklist: MissionChecklistResponse,
): boolean {
  if (checklist.readyForFinalApproval !== undefined)
    return checklist.readyForFinalApproval
  // Fail closed when older responses lack the authoritative final readiness flag.
  return (
    checklist.readyForSubmission === true &&
    checklist.executions.length > 0 &&
    checklist.executions.every(
      (item) =>
        item.readyForFinalApproval ??
        (item.executionStatus === 'COMPLETED' &&
          item.assessmentStatus === 'COMPLIANT' &&
          customerSelectionProgress(
            item,
            (item.evidence ?? [])
              .filter((link) => link.selectedForCustomer)
              .map((link) => link.evidenceId),
          ).valid),
    )
  )
}
