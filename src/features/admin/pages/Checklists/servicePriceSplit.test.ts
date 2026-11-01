import { describe, expect, it } from 'vitest'
import type { ChecklistPriceBreakdown } from '../../../../shared/api/checklistPricingApi'
import { isWithinAllowance, splitWorkAndMedia } from './servicePriceSplit'

const line = (component: string, amount: number) => ({
  component,
  category: 'X',
  description: component,
  quantity: 1,
  unitPrice: amount,
  amount,
  tierFrom: null,
  tierTo: null,
  blockSize: null,
  rounding: null,
})

const row = (patch: Partial<ChecklistPriceBreakdown> = {}) =>
  ({
    lines: [],
    requestedImageCount: 0,
    requestedVideoCount: 0,
    extraImageCount: 0,
    extraVideoCount: 0,
    ...patch,
  }) as ChecklistPriceBreakdown

describe('servicePriceSplit', () => {
  it('puts media lines in media and everything else in work', () => {
    const result = splitWorkAndMedia(
      row({
        lines: [
          line('BASE', 800),
          line('INCLUDED_IMAGE', 200),
          line('EXTRA_VIDEO', 150),
        ],
      }),
    )
    expect(result).toEqual({ work: 800, media: 350 })
  })

  it('detects media requested within the allowance', () => {
    expect(isWithinAllowance(row({ requestedImageCount: 3 }))).toBe(true)
    expect(
      isWithinAllowance(row({ requestedImageCount: 3, extraImageCount: 1 })),
    ).toBe(false)
    expect(isWithinAllowance(row())).toBe(false)
  })
})
