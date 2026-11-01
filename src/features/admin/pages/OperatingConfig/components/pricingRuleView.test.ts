import { describe, expect, it } from 'vitest'
import { newMediaRule } from '../../../lib/mediaPricingRules'
import {
  blankRule,
  calculationChanges,
  categoryChanges,
  isDimensionBlockRule,
  withoutRule,
} from './pricingRuleView'

describe('pricingRuleView', () => {
  it('builds a blank rule continuing the priority order', () => {
    expect(blankRule(2, 'New')).toMatchObject({
      ruleKey: 'NEW_RULE_3',
      priority: 2,
      category: 'AREA',
      calculationType: 'PER_BLOCK',
    })
  })

  it('keeps block fields only for block calculations', () => {
    const rule = {
      ...blankRule(0, 'x'),
      unitSize: 5,
      roundingMode: 'FLOOR' as const,
    }
    expect(calculationChanges(rule, 'FIXED')).toEqual({
      calculationType: 'FIXED',
      unitSize: null,
      roundingMode: null,
    })
    expect(calculationChanges(rule, 'TIERED_BLOCK')).toMatchObject({
      unitSize: 5,
      roundingMode: 'FLOOR',
    })
  })

  it('keeps rounding only for dimension categories', () => {
    const rule = blankRule(0, 'x')
    expect(categoryChanges(rule, 'PACKAGE').roundingMode).toBeNull()
    expect(categoryChanges(rule, 'DISTANCE').roundingMode).toBe('CEILING')
    expect(isDimensionBlockRule(rule)).toBe(true)
    expect(isDimensionBlockRule({ ...rule, category: 'PACKAGE' })).toBe(false)
  })

  it('renumbers priorities after removing a rule', () => {
    const rules = [0, 1, 2].map((i) => ({
      ...newMediaRule('DEFAULT', 'EXTRA_IMAGE', []),
      ruleKey: `K${i}`,
      priority: i,
    }))
    expect(withoutRule(rules, 1).map((r) => [r.ruleKey, r.priority])).toEqual([
      ['K0', 0],
      ['K2', 1],
    ])
  })
})
