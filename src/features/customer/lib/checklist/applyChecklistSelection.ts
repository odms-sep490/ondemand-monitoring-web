import {
  evidenceTypeFor,
  type ChecklistInput,
  type ChecklistRow,
} from './types'

/** Rehydrates the real editor, including customer-authored work and explicit evidence policies. */
export function applyChecklistSelection(
  rows: ChecklistRow[],
  selection: ChecklistInput[],
): ChecklistRow[] {
  const catalog = rows
    .filter((row) => row.sourceChecklistId !== null)
    .map((row) => {
      const input = selection.find(
        (item) => item.sourceChecklistId === row.sourceChecklistId,
      )
      if (!input) return { ...row, selected: row.mandatory }
      if (input.expectedChecklistVersion !== row.version)
        throw new Error('Nội dung giám sát đã thay đổi. Hãy tải lại catalog.')
      return patch(row, input)
    })
  const custom = selection
    .filter((item) => !item.sourceChecklistId)
    .map((input, index) => {
      const existing = rows.find(
        (row) =>
          row.sourceChecklistId === null &&
          row.content === input.contentOverride,
      )
      const row: ChecklistRow = existing ?? {
        key: `agent-custom-${index}`,
        sourceChecklistId: null,
        version: null,
        originalContent: '',
        content: input.contentOverride ?? '',
        selected: true,
        minimumEvidenceCount: 1,
        requiredEvidenceType: 'IMAGE_OR_VIDEO',
        includedImageCount: 0,
        includedVideoCount: 0,
        requestedImageCount: 0,
        requestedVideoCount: 0,
        mandatory: false,
        packageItem: false,
      }
      return patch(row, input)
    })
  return [...catalog, ...custom]
}
function patch(row: ChecklistRow, input: ChecklistInput): ChecklistRow {
  const images = input.requestedImageCount ?? row.includedImageCount
  const videos = input.requestedVideoCount ?? row.includedVideoCount
  return {
    ...row,
    selected: true,
    content: input.contentOverride ?? row.content,
    minimumEvidenceCount:
      input.minimumEvidenceCount ?? row.minimumEvidenceCount,
    requestedImageCount: images,
    requestedVideoCount: videos,
    requiredEvidenceType:
      input.requiredEvidenceType ?? evidenceTypeFor(images, videos),
  }
}
