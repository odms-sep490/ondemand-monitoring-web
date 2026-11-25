import { expect, it } from 'vitest'
import { applyChecklistSelection } from './applyChecklistSelection'
import type { ChecklistRow } from './types'
const row: ChecklistRow = {
  key: 'catalog',
  sourceChecklistId: 'c',
  version: 2,
  content: 'Roof',
  originalContent: 'Roof',
  selected: true,
  minimumEvidenceCount: 1,
  requiredEvidenceType: 'IMAGE',
  includedImageCount: 4,
  includedVideoCount: 0,
  requestedImageCount: 4,
  requestedVideoCount: 0,
  mandatory: false,
  packageItem: true,
}
it('restores custom content, explicit evidence policy and media without merging different custom rows', () => {
  const result = applyChecklistSelection(
    [row],
    [
      {
        sourceChecklistId: 'c',
        expectedChecklistVersion: 2,
        requestedImageCount: 20,
        requestedVideoCount: 0,
      },
      {
        contentOverride: 'Custom A',
        minimumEvidenceCount: 3,
        requiredEvidenceType: 'VIDEO',
      },
      {
        contentOverride: 'Custom B',
        requestedImageCount: 2,
        requestedVideoCount: 1,
      },
    ],
  )
  expect(result).toHaveLength(3)
  expect(result[0].requestedImageCount).toBe(20)
  expect(result[1].content).toBe('Custom A')
  expect(result[1].minimumEvidenceCount).toBe(3)
  expect(result[1].requiredEvidenceType).toBe('VIDEO')
  expect(result[2].content).toBe('Custom B')
  expect(result[2].requestedVideoCount).toBe(1)
})
it('rejects stale catalog versions before changing editor data', () => {
  expect(() =>
    applyChecklistSelection(
      [row],
      [{ sourceChecklistId: 'c', expectedChecklistVersion: 1 }],
    ),
  ).toThrow()
  expect(row.requestedImageCount).toBe(4)
})
