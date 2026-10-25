import { describe, expect, it } from 'vitest'
import {
  evidenceTypeFor,
  serializeChecklist,
  singleEvidenceCount,
  usesMedia,
  withEvidenceType,
  withSingleEvidenceCount,
  type ChecklistRow,
} from './types'

const row = (patch: Partial<ChecklistRow> = {}): ChecklistRow => ({
  key: 'r',
  sourceChecklistId: 'c1',
  version: 1,
  originalContent: 'Check roof',
  content: 'Check roof',
  selected: true,
  minimumEvidenceCount: 1,
  requiredEvidenceType: 'IMAGE',
  includedImageCount: 0,
  includedVideoCount: 0,
  requestedImageCount: 0,
  requestedVideoCount: 0,
  mandatory: false,
  ...patch,
})

describe('evidence type: image, video, or image and video', () => {
  it('derives the default type from the media allowance', () => {
    expect(evidenceTypeFor(10, 1)).toBe('IMAGE_AND_VIDEO')
    expect(evidenceTypeFor(5, 0)).toBe('IMAGE')
    expect(evidenceTypeFor(0, 2)).toBe('VIDEO')
    expect(evidenceTypeFor(0, 0)).toBe('IMAGE')
  })

  it('image or video keeps one minimum; a plain row sends the evidence requirement', () => {
    const plain = row({ minimumEvidenceCount: 3, requiredEvidenceType: 'VIDEO' })
    expect(singleEvidenceCount(plain)).toBe(3)
    expect(serializeChecklist([plain])[0]).toMatchObject({
      minimumEvidenceCount: 3,
      requiredEvidenceType: 'VIDEO',
    })
  })

  it('on a row with a media allowance the single minimum is the requested count of that type', () => {
    const media = row({
      includedImageCount: 5,
      requestedImageCount: 5,
      requiredEvidenceType: 'IMAGE',
    })
    expect(singleEvidenceCount(media)).toBe(5)
    expect(withSingleEvidenceCount(media, 8)).toMatchObject({
      requestedImageCount: 8,
      requestedVideoCount: 0,
    })
  })

  it('image and video needs separate counts and is sent as per-type counts', () => {
    const both = row({ ...withEvidenceType(row(), 'IMAGE_AND_VIDEO') })
    expect(both.requiredEvidenceType).toBe('IMAGE_AND_VIDEO')
    expect(both.requestedImageCount).toBeGreaterThanOrEqual(1)
    expect(both.requestedVideoCount).toBeGreaterThanOrEqual(1)
    expect(usesMedia(both)).toBe(true)
    const sent = serializeChecklist([
      { ...both, requestedImageCount: 4, requestedVideoCount: 2 },
    ])[0]
    expect(sent).toMatchObject({ requestedImageCount: 4, requestedVideoCount: 2 })
    expect(sent).not.toHaveProperty('requiredEvidenceType')
  })

  it('switching back to a single type on a plain row clears the per-type counts', () => {
    const both = row({
      requiredEvidenceType: 'IMAGE_AND_VIDEO',
      requestedImageCount: 3,
      requestedVideoCount: 2,
    })
    const patch = withEvidenceType(both, 'VIDEO')
    expect(patch).toMatchObject({
      requiredEvidenceType: 'VIDEO',
      requestedImageCount: 0,
      requestedVideoCount: 0,
    })
    expect(patch.minimumEvidenceCount).toBeGreaterThanOrEqual(1)
  })
})
