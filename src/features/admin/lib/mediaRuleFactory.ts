import type { MediaPricingComponent, PricingRule } from '../types/pricing'
import {
  CUSTOM_PROFILE,
  LEGACY_CUSTOM_PROFILE,
  isMediaRule,
} from './mediaRuleBasics'

export function newMediaRule(
  profile: string,
  component: MediaPricingComponent,
  existing: PricingRule[],
  checklistDefinitionId?: string | null,
  checklistDefinitionName?: string | null,
): PricingRule {
  const normalized = profile.trim().toUpperCase()
  const tier = component === 'EXTRA_IMAGE' || component === 'EXTRA_VIDEO'
  const siblings = existing.filter(
    (rule) =>
      isMediaRule(rule) &&
      rule.pricingProfile === normalized &&
      (rule.checklistDefinitionId ?? null) ===
        (checklistDefinitionId ?? null) &&
      rule.mediaComponent === component,
  )
  // Continue the schedule where the last bounded tier ends.
  const from = tier
    ? Math.max(
        0,
        ...siblings.map((rule) => rule.maxValue ?? rule.minValue ?? 0),
      )
    : null
  let sequence = siblings.length + 1
  const targetKey = checklistDefinitionId
    ? `CHECKLIST_${checklistDefinitionId}`
    : normalized
  let ruleKey = `${targetKey}:${component}:${sequence}`
  while (existing.some((rule) => rule.ruleKey === ruleKey))
    ruleKey = `${normalized}:${component}:${++sequence}`
  return {
    category: 'MEDIA',
    calculationType: tier ? 'PER_BLOCK' : 'FIXED',
    ruleKey,
    description: `${normalized} · ${component}`,
    minValue: from,
    maxValue: null,
    fixedAmount: 0,
    baseAmount: null,
    percentage: null,
    unitSize: tier ? 1 : null,
    multiplier: null,
    priority: existing.length,
    enabled: true,
    pricingProfile: normalized,
    checklistDefinitionId: checklistDefinitionId ?? null,
    checklistDefinitionName: checklistDefinitionName ?? null,
    mediaComponent: component,
    includedQuantity: null,
    roundingMode: tier ? 'CEILING' : null,
  }
}

const CUSTOMER_ADDED_COMPONENTS: MediaPricingComponent[] = [
  'CHECKLIST_BASE',
  'INCLUDED_IMAGE',
  'INCLUDED_VIDEO',
  'INCLUDED_AREA',
  'EXTRA_AREA',
]

/**
 * Customer-added prices used to be stored under the CUSTOM profile. A draft keeps a single set: the legacy rule becomes the
 * GENERIC_CUSTOMER_ADDED one, or is dropped when that one already exists. Returns the same array when nothing changes.
 */
export function migrateLegacyCustomerAdded(
  rules: PricingRule[],
): PricingRule[] {
  const profile = (rule: PricingRule) =>
    (rule.pricingProfile ?? '').toUpperCase()
  const global = (rule: PricingRule) =>
    isMediaRule(rule) && !rule.checklistDefinitionId
  const legacy = (rule: PricingRule) =>
    global(rule) &&
    profile(rule) === LEGACY_CUSTOM_PROFILE &&
    CUSTOMER_ADDED_COMPONENTS.includes(
      rule.mediaComponent as MediaPricingComponent,
    )
  if (!rules.some(legacy)) return rules
  const covered = (component: MediaPricingComponent | null | undefined) =>
    rules.some(
      (rule) =>
        global(rule) &&
        profile(rule) === CUSTOM_PROFILE &&
        rule.mediaComponent === component,
    )
  return rules.flatMap((rule) => {
    if (!legacy(rule)) return [rule]
    if (covered(rule.mediaComponent)) return []
    return [
      {
        ...rule,
        pricingProfile: CUSTOM_PROFILE,
        ruleKey: rule.ruleKey.replace(/^CUSTOM:/i, `${CUSTOM_PROFILE}:`),
        description: rule.description.replace(/^CUSTOM/i, CUSTOM_PROFILE),
      },
    ]
  })
}
