import type { PricingPolicy } from '../../../types/pricing'

/** The lowest price a Manager may reach is the system price less the maximum discount, so the ratio follows it. */
export const guardrailChanges = {
  maxDiscount(value: number): Partial<PricingPolicy> {
    const percent = Math.min(100, Math.max(0, value))
    return {
      managerMaxDiscountPercent: percent,
      minimumPriceRatio: Math.round((100 - percent) * 100) / 10000,
    }
  },
}

/** A high-risk threshold above the maximum discount could never be reached. */
export const guardrailsValid = (policy: PricingPolicy) =>
  policy.highRiskDiscountPercent <= policy.managerMaxDiscountPercent
