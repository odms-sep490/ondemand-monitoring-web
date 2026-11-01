import type { PricingRule } from '../types/pricing'
import {
  CUSTOM_PROFILE,
  LEGACY_CUSTOM_PROFILE,
  isMediaRule,
  isTier,
} from './mediaRuleBasics'

export * from './mediaRuleBasics'
export { migrateLegacyCustomerAdded, newMediaRule } from './mediaRuleFactory'

const PROFILE = /^[A-Z0-9_]{1,60}$/

export type MediaRuleIssue =
  | 'PROFILE'
  | 'COMPONENT'
  | 'PRICE'
  | 'NEGATIVE'
  | 'BLOCK_SIZE'
  | 'RANGE'
  | 'OVERLAP'
  | 'GAP'
  | 'OPEN_ENDED'
  | 'ALLOWANCE'

export type MediaRuleProblem = { index: number; issue: MediaRuleIssue }

const whole = (value: number | null | undefined) =>
  value == null || Number.isInteger(value)

/**
 * Same rules the backend enforces on save, so the Admin sees the problem next to the row.
 * `index` points into the full rules array. Disabled tiers are not part of a price schedule.
 */
export function validateMediaRules(rules: PricingRule[]): MediaRuleProblem[] {
  const problems: MediaRuleProblem[] = []
  const groups = new Map<string, number[]>()
  rules.forEach((rule, index) => {
    if (!isMediaRule(rule)) return
    const add = (issue: MediaRuleIssue) => problems.push({ index, issue })
    if (
      !rule.pricingProfile ||
      !PROFILE.test(rule.pricingProfile.toUpperCase())
    )
      add('PROFILE')
    if (!rule.mediaComponent) add('COMPONENT')
    if (rule.fixedAmount == null || !whole(rule.fixedAmount)) add('PRICE')
    else if (rule.fixedAmount < 0) add('NEGATIVE')
    if (isTier(rule)) {
      if (
        rule.unitSize == null ||
        rule.unitSize < 1 ||
        !Number.isInteger(rule.unitSize)
      )
        add('BLOCK_SIZE')
      const min = rule.minValue ?? 0
      if (min < 0) add('NEGATIVE')
      if (rule.maxValue != null && rule.maxValue <= min) add('RANGE')
      if (rule.enabled)
        groups.set(
          `${rule.checklistDefinitionId ?? '*'}:${rule.pricingProfile}:${rule.mediaComponent}`,
          [
            ...(groups.get(
              `${rule.checklistDefinitionId ?? '*'}:${rule.pricingProfile}:${rule.mediaComponent}`,
            ) ?? []),
            index,
          ],
        )
    }
    if (
      rule.includedQuantity != null &&
      (rule.includedQuantity < 0 ||
        rule.includedQuantity > 500 ||
        !Number.isInteger(rule.includedQuantity) ||
        ![CUSTOM_PROFILE, LEGACY_CUSTOM_PROFILE].includes(
          (rule.pricingProfile ?? '').toUpperCase(),
        ) ||
        (rule.mediaComponent !== 'INCLUDED_IMAGE' &&
          rule.mediaComponent !== 'INCLUDED_VIDEO' &&
          rule.mediaComponent !== 'INCLUDED_AREA'))
    )
      add('ALLOWANCE')
  })
  for (const indexes of groups.values()) {
    const ordered = [...indexes].sort(
      (a, b) => (rules[a].minValue ?? 0) - (rules[b].minValue ?? 0),
    )
    let cursor = 0
    ordered.forEach((index, position) => {
      const rule = rules[index]
      const min = rule.minValue ?? 0
      if (min < cursor) problems.push({ index, issue: 'OVERLAP' })
      else if (min > cursor) problems.push({ index, issue: 'GAP' })
      if (rule.maxValue == null) {
        if (position !== ordered.length - 1)
          problems.push({ index, issue: 'OPEN_ENDED' })
      } else cursor = rule.maxValue
    })
  }
  return problems
}
