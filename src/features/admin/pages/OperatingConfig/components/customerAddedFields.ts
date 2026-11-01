import { CUSTOM_PROFILE, newMediaRule } from '../../../lib/mediaPricingRules'
import type { MediaPricingComponent, PricingRule } from '../../../types/pricing'

export type CustomerAddedField = {
  key: string
  component: MediaPricingComponent
  /** Whether the number lives in the price or in the rule's included quantity. */
  target: 'price' | 'allowance'
  label:
    | 'basePrice'
    | 'includedImages'
    | 'includedVideos'
    | 'includedArea'
    | 'extraArea'
  step: number
}

export const CUSTOMER_ADDED_FIELDS: CustomerAddedField[] = [
  {
    key: 'base',
    component: 'CHECKLIST_BASE',
    target: 'price',
    label: 'basePrice',
    step: 1000,
  },
  {
    key: 'images',
    component: 'INCLUDED_IMAGE',
    target: 'allowance',
    label: 'includedImages',
    step: 1,
  },
  {
    key: 'videos',
    component: 'INCLUDED_VIDEO',
    target: 'allowance',
    label: 'includedVideos',
    step: 1,
  },
  {
    key: 'area',
    component: 'INCLUDED_AREA',
    target: 'allowance',
    label: 'includedArea',
    step: 1,
  },
  {
    key: 'rate',
    component: 'EXTRA_AREA',
    target: 'price',
    label: 'extraArea',
    step: 1000,
  },
]

export const isCustomerAddedRule = (rule: PricingRule) =>
  rule.category === 'MEDIA' &&
  (rule.pricingProfile ?? '').toUpperCase() === CUSTOM_PROFILE &&
  CUSTOMER_ADDED_FIELDS.some((field) => field.component === rule.mediaComponent)

const find = (rules: PricingRule[], component: MediaPricingComponent) =>
  rules.findIndex(
    (rule) =>
      rule.category === 'MEDIA' &&
      (rule.pricingProfile ?? '').toUpperCase() === CUSTOM_PROFILE &&
      rule.mediaComponent === component &&
      !rule.checklistDefinitionId,
  )

/** The stored number of a field, or null when the rule has not been configured yet. */
export function customerAddedValue(
  rules: PricingRule[],
  field: CustomerAddedField,
): number | null {
  const index = find(rules, field.component)
  if (index < 0) return null
  const rule = rules[index]
  return (
    (field.target === 'price' ? rule.fixedAmount : rule.includedQuantity) ??
    null
  )
}

/**
 * The rules after typing `value` into a field: the rule is changed in place, or created when it does not exist yet.
 * Returns null when nothing should change (an empty value for a rule that does not exist).
 */
export function withCustomerAddedValue(
  rules: PricingRule[],
  field: CustomerAddedField,
  value: number | null,
): PricingRule[] | null {
  const index = find(rules, field.component)
  if (index < 0) {
    if (value == null) return null
    const created = newMediaRule(CUSTOM_PROFILE, field.component, rules)
    return [
      ...rules,
      field.target === 'price'
        ? { ...created, fixedAmount: value }
        : { ...created, fixedAmount: 0, includedQuantity: value },
    ]
  }
  return rules.map((rule, i) =>
    i !== index
      ? rule
      : field.target === 'price'
        ? { ...rule, fixedAmount: value }
        : { ...rule, includedQuantity: value },
  )
}
