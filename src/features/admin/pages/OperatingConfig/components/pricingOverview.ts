import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { CUSTOM_PROFILE, SHARED_PROFILE_NAME } from './pricingOverviewConstants'
import type { PricingRule } from '../../../types/pricing'
import type { pricingPolicyOverviewMessages } from './PricingPolicyOverview.messages'

export type OverviewCopy = (typeof pricingPolicyOverviewMessages)['vi']

/** The enabled customer-added rule of one component, if the policy has it. */
export const customerRule = (rules: PricingRule[], component: string) =>
  rules.find(
    (rule) =>
      rule.category === 'MEDIA' &&
      rule.enabled &&
      (rule.pricingProfile ?? '').toUpperCase() === CUSTOM_PROFILE &&
      rule.mediaComponent === component,
  )

/** Enabled shared tiers (DEFAULT profile) of one media component, lowest range first. */
export const sharedTiers = (
  rules: PricingRule[],
  component: 'EXTRA_IMAGE' | 'EXTRA_VIDEO',
) =>
  rules
    .filter(
      (rule) =>
        rule.category === 'MEDIA' &&
        rule.enabled &&
        rule.mediaComponent === component &&
        (rule.pricingProfile ?? '').toUpperCase() === SHARED_PROFILE_NAME,
    )
    .sort((a, b) => (a.minValue ?? 0) - (b.minValue ?? 0))

export const numberIn = (
  locale: string,
  value: number | null | undefined,
  suffix = '',
) => (value == null ? '—' : `${value.toLocaleString(locale)}${suffix}`)

/** One line of a tier list, e.g. "0–10 ảnh: 50.000 ₫ mỗi 10 ảnh". */
export function tierLine(rule: PricingRule, noun: string, t: OverviewCopy) {
  const from = rule.minValue ?? 0
  const range =
    rule.maxValue == null ? t.tierFrom(from) : `${from}–${rule.maxValue}`
  const block =
    rule.unitSize && rule.unitSize > 1
      ? t.perBlock(rule.unitSize, noun)
      : t.perUnit(noun)
  return t.tierLine(range, noun, formatVnd(rule.fixedAmount ?? 0), block)
}
