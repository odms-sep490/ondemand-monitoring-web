import { describe, expect, it } from 'vitest'
import { emptyPricingForm } from '../../lib/checklistPricing'
import type { OverrideForm } from '../../lib/serviceOverrides'
import {
  collectChecklistForm,
  initialContent,
  listToLocalized,
  localizedToList,
  toLines,
  type ContentForm,
} from './checklistForm'

const content = (patch: Partial<ContentForm> = {}): ContentForm => ({
  ...initialContent(),
  content: { vi: 'Kiểm tra mái', en: 'Roof check' },
  ...patch,
})
const overrides: OverrideForm = {
  basePrice: '',
  images: '',
  videos: '',
  profile: '',
  required: false,
}
const run = (c: ContentForm, fromService = false) =>
  collectChecklistForm({
    content: c,
    pricing: { ...emptyPricingForm(), basePrice: '100000' },
    overrides,
    fromService,
  })

describe('checklistForm', () => {
  it('splits text into trimmed non-empty lines', () => {
    expect(toLines(' a \r\n\n b\n')).toEqual(['a', 'b'])
  })

  it('sends the content page back when the content is empty or too long', () => {
    expect(run(content({ content: { vi: '  ', en: '  ' } }))).toMatchObject({
      ok: false,
      page: 'content',
      error: 'required',
    })
    expect(
      run(content({ content: { vi: 'Chỉ tiếng Việt', en: ' ' } })),
    ).toMatchObject({ ok: false, error: 'required' })
    expect(
      run(content({ content: { vi: 'x'.repeat(300), en: 'y'.repeat(300) } })),
    ).toMatchObject({ ok: false, error: 'required' })
  })

  it('rejects guidance over the limits', () => {
    expect(
      run(
        content({
          steps: { vi: Array(31).fill('step').join('\n'), en: '' },
        }),
      ),
    ).toMatchObject({ ok: false, page: 'content', error: 'guidanceInvalid' })
  })

  it('reports invalid pricing on the pricing page with the offending fields', () => {
    const result = collectChecklistForm({
      content: content(),
      pricing: { ...emptyPricingForm(), basePrice: '-1' },
      overrides,
      fromService: false,
    })
    expect(result).toMatchObject({
      ok: false,
      page: 'pricing',
      error: 'invalidPricing',
      pricingErrors: { basePrice: 'invalid' },
    })
  })

  it('collects the definition without the pricing profile and skips overrides outside a service', () => {
    const result = run(
      content({
        steps: { vi: 'một\nhai', en: 'one\ntwo' },
        description: { vi: 'Mô tả', en: 'Desc' },
      }),
    )
    expect(result).toMatchObject({
      ok: true,
      text: '{"vi":"Kiểm tra mái","en":"Roof check"}',
      override: null,
    })
    if (!result.ok) return
    expect(result.definition).not.toHaveProperty('pricingProfile')
    expect(result.definition).toMatchObject({
      basePrice: 100_000,
      executionSteps: ['{"vi":"một","en":"one"}', '{"vi":"hai","en":"two"}'],
      description: '{"vi":"Mô tả","en":"Desc"}',
    })
  })

  it('inherits an override that only repeats the checklist value', () => {
    const result = collectChecklistForm({
      content: content(),
      pricing: { ...emptyPricingForm(), basePrice: '100000' },
      overrides: { ...overrides, basePrice: '100000', images: '7' },
      fromService: true,
    })
    expect(result).toMatchObject({
      ok: true,
      override: {
        basePriceOverride: null,
        includedImageCountOverride: 7,
      },
    })
  })

  it('round-trips bilingual and legacy list items', () => {
    const form = listToLocalized(['{"vi":"a","en":"b"}', 'plain'])
    expect(form).toEqual({ vi: 'a\nplain', en: 'b\nplain' })
    expect(localizedToList(form)).toEqual([
      '{"vi":"a","en":"b"}',
      '{"vi":"plain","en":"plain"}',
    ])
    expect(localizedToList({ vi: 'x', en: '' })).toEqual(['{"vi":"x","en":""}'])
  })

  it('does not encode an empty description', () => {
    const result = run(content())
    expect(result).toMatchObject({ ok: true, definition: { description: '' } })
  })
})
