import { describe, expect, it } from 'vitest'
import {
  emptyEvidenceForm,
  evidenceToForm,
  validateEvidenceForm,
} from './checklistPricing'

describe('validateEvidenceForm', () => {
  it('accepts empty evidence counts and omits an unset video duration', () => {
    expect(validateEvidenceForm(emptyEvidenceForm())).toEqual({
      ok: true,
      value: { includedImageCount: 0, includedVideoCount: 0 },
    })
  })

  it('keeps configured counts and duration', () => {
    expect(
      validateEvidenceForm({
        includedImageCount: '10',
        includedVideoCount: '1',
        standardVideoDurationSeconds: '30',
      }),
    ).toEqual({
      ok: true,
      value: {
        includedImageCount: 10,
        includedVideoCount: 1,
        standardVideoDurationSeconds: 30,
      },
    })
  })

  it.each([
    ['includedImageCount', '501'],
    ['includedVideoCount', '-2'],
    ['includedVideoCount', '1.5'],
    ['standardVideoDurationSeconds', '0'],
    ['standardVideoDurationSeconds', '7201'],
  ] as const)('rejects %s = %j', (field, value) => {
    const result = validateEvidenceForm({
      ...emptyEvidenceForm(),
      [field]: value,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[field]).toBe('invalid')
  })

  it('round-trips stored evidence fields', () => {
    expect(
      evidenceToForm({
        includedImageCount: 2,
        includedVideoCount: 0,
        standardVideoDurationSeconds: null,
      }),
    ).toEqual({
      includedImageCount: '2',
      includedVideoCount: '0',
      standardVideoDurationSeconds: '',
    })
  })
})
