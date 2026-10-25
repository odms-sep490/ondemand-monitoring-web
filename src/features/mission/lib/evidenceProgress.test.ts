import { describe, expect, it } from 'vitest'
import { evidenceCountLabel, evidenceShortfall } from './evidenceProgress'

describe('evidenceProgress', () => {
  it('keeps the single total for policies V0-V2', () => {
    const item = {
      evidencePolicyVersion: 2,
      minimumEvidenceCount: 3,
      eligibleEvidenceCount: 1,
    }
    expect(evidenceShortfall(item)).toBe(2)
    expect(evidenceCountLabel(item)).toBe('1/3')
  })

  it('V3 adds the shortfall of each media type instead of netting them', () => {
    const item = {
      evidencePolicyVersion: 3,
      minimumEvidenceCount: 4,
      minimumImageCount: 3,
      minimumVideoCount: 1,
      eligibleEvidenceCount: 5,
      eligibleImageCount: 5,
      eligibleVideoCount: 0,
    }
    // five images exist, but the required video is still missing
    expect(evidenceShortfall(item)).toBe(1)
    expect(evidenceCountLabel(item)).toBe('ảnh 5/3 · video 0/1')
  })

  it('V3 is complete only when both thresholds are met', () => {
    expect(
      evidenceShortfall({
        evidencePolicyVersion: 3,
        minimumImageCount: 2,
        minimumVideoCount: 1,
        eligibleImageCount: 2,
        eligibleVideoCount: 1,
      }),
    ).toBe(0)
  })
})
