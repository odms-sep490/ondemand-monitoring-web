import { describe, expect, it } from 'vitest'
import { guardrailChanges, guardrailsValid } from './guardrailRules'
import type { PricingPolicy } from '../../../types/pricing'

describe('pricingGuardrails', () => {
  it('derives the price floor ratio from the maximum discount and clamps it to 0-100', () => {
    expect(guardrailChanges.maxDiscount(20)).toEqual({
      managerMaxDiscountPercent: 20,
      minimumPriceRatio: 0.8,
    })
    expect(guardrailChanges.maxDiscount(150).managerMaxDiscountPercent).toBe(
      100,
    )
    expect(guardrailChanges.maxDiscount(-5).minimumPriceRatio).toBe(1)
  })

  it('refuses a high-risk threshold above the maximum discount', () => {
    const base = { managerMaxDiscountPercent: 10 } as PricingPolicy
    expect(guardrailsValid({ ...base, highRiskDiscountPercent: 5 })).toBe(true)
    expect(guardrailsValid({ ...base, highRiskDiscountPercent: 30 })).toBe(
      false,
    )
  })
})
