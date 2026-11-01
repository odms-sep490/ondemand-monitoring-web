import { formatVnd } from '../../../../../shared/lib/formatVnd'
import type { PricingRule } from '../../../types/pricing'
import type { pricingDraftEditorMessages } from './PricingDraftEditor.messages'

export type RuleCopy = (typeof pricingDraftEditorMessages)['vi']

export const RULE_CATEGORIES: PricingRule['category'][] = [
  'PACKAGE',
  'DISTANCE',
  'AREA',
  'ALTITUDE',
  'CHECKLIST',
  'OUTPUT',
  'RESOURCE',
  'TERRAIN',
  'CONDITION',
  'PERMIT',
  'DISCOUNT',
  'MANAGER_ADJUSTMENT',
]

export const CALCULATION_TYPES: PricingRule['calculationType'][] = [
  'FIXED',
  'PERCENT_OF_BASE',
  'PER_UNIT',
  'PER_BLOCK',
  'TIERED_BLOCK',
  'MULTIPLIER',
  'RESOURCE_BASED',
  'ACTUAL_COST',
  'MANUAL_QUOTE',
]

export const isBlockType = (type: PricingRule['calculationType']) =>
  type === 'PER_BLOCK' || type === 'TIERED_BLOCK'

export function isDimensionBlockRule(rule: PricingRule) {
  return (
    ['AREA', 'DISTANCE', 'ALTITUDE'].includes(rule.category) &&
    isBlockType(rule.calculationType)
  )
}

export function blankRule(priority: number, description: string): PricingRule {
  return {
    category: 'AREA',
    calculationType: 'PER_BLOCK',
    ruleKey: `NEW_RULE_${priority + 1}`,
    description,
    minValue: 0,
    maxValue: null,
    fixedAmount: 0,
    baseAmount: null,
    percentage: null,
    unitSize: 1,
    multiplier: null,
    priority,
    enabled: true,
    roundingMode: 'CEILING',
  }
}

export function dimensionUnit(category: PricingRule['category'], t: RuleCopy) {
  if (category === 'AREA') return t.unitArea
  if (category === 'DISTANCE') return t.unitDistance
  if (category === 'ALTITUDE') return t.unitAltitude
  return t.unitGeneric
}

export function roundingLabel(
  rounding: PricingRule['roundingMode'],
  t: RuleCopy,
) {
  if (rounding === 'FLOOR') return t.roundDown
  if (rounding === 'HALF_UP') return t.roundNearest
  return t.roundUp
}

export function ruleRange(rule: PricingRule, t: RuleCopy) {
  if (rule.minValue == null && rule.maxValue == null) return ''
  const unit = dimensionUnit(rule.category, t)
  if (rule.maxValue == null) return t.rangeFrom(rule.minValue ?? 0, unit)
  return `${rule.minValue ?? 0}–${rule.maxValue} ${unit}`
}

export function rulePrice(rule: PricingRule, t: RuleCopy) {
  if (isBlockType(rule.calculationType))
    return t.perBlock(
      formatVnd(rule.fixedAmount ?? 0),
      rule.unitSize ?? 1,
      dimensionUnit(rule.category, t),
    )
  if (rule.calculationType === 'PERCENT_OF_BASE')
    return t.percentOfBase(rule.percentage ?? 0)
  if (rule.calculationType === 'MULTIPLIER')
    return t.multiplierValue(rule.multiplier ?? 0)
  if (rule.calculationType === 'MANUAL_QUOTE') return t.manualQuote
  return formatVnd(rule.fixedAmount ?? rule.baseAmount ?? 0)
}

export function categorySummary(rules: PricingRule[], t: RuleCopy) {
  const preview = rules.slice(0, 2).map((rule) => {
    const range = ruleRange(rule, t)
    return `${range ? `${range}: ` : ''}${rulePrice(rule, t)}`
  })
  const remaining = rules.length - preview.length
  return `${preview.join(' · ')}${remaining > 0 ? t.andMore(remaining) : ''}`
}

/** The fields to change when the admin switches the category of a rule. */
export function categoryChanges(
  rule: PricingRule,
  category: PricingRule['category'],
): Partial<PricingRule> {
  return {
    category,
    roundingMode: ['AREA', 'DISTANCE', 'ALTITUDE'].includes(category)
      ? (rule.roundingMode ?? 'CEILING')
      : null,
  }
}

/** The fields to change when the admin switches how a rule is calculated. */
export function calculationChanges(
  rule: PricingRule,
  calculationType: PricingRule['calculationType'],
): Partial<PricingRule> {
  const block = isBlockType(calculationType)
  return {
    calculationType,
    unitSize: block ? (rule.unitSize ?? 1) : null,
    roundingMode: block ? (rule.roundingMode ?? 'CEILING') : null,
  }
}

/** Removes a rule and renumbers the priorities of the rest. */
export function withoutRule(rules: PricingRule[], index: number) {
  return rules
    .filter((_, i) => i !== index)
    .map((rule, priority) => ({ ...rule, priority }))
}
