import { describe, expect, it } from 'vitest'
import {
  migrateLegacyCustomerAdded,
  newMediaRule,
  validateMediaRules,
  type MediaRuleIssue,
} from './mediaPricingRules'
import type { MediaPricingComponent, PricingRule } from '../types/pricing'

const tier = (
  from: number,
  to: number | null,
  patch: Partial<PricingRule> = {},
): PricingRule => ({
  ...newMediaRule('STANDARD', 'EXTRA_IMAGE', []),
  ruleKey: `T${from}`,
  minValue: from,
  maxValue: to,
  unitSize: 10,
  fixedAmount: 50_000,
  ...patch,
})
const issues = (rules: PricingRule[]): MediaRuleIssue[] =>
  validateMediaRules(rules).map((problem) => problem.issue)

describe('validateMediaRules', () => {
  it('accepts two contiguous tiers with an open-ended last tier', () => {
    expect(
      issues([tier(0, 10), tier(10, null, { fixedAmount: 40_000 })]),
    ).toEqual([])
  })
  it('accepts one flat tier for every extra block', () => {
    expect(issues([tier(0, null, { fixedAmount: 40_000 })])).toEqual([])
  })
  it('rejects overlapping tiers', () => {
    expect(issues([tier(0, 10), tier(5, null)])).toContain('OVERLAP')
  })
  it('rejects gaps and schedules that do not start at zero', () => {
    expect(issues([tier(0, 10), tier(20, null)])).toContain('GAP')
    expect(issues([tier(5, null)])).toContain('GAP')
  })
  it('only the last tier may be open ended', () => {
    expect(issues([tier(0, null), tier(10, null)])).toContain('OPEN_ENDED')
  })
  it('rejects empty ranges, bad block sizes and negative or fractional prices', () => {
    expect(issues([tier(10, 10)])).toContain('RANGE')
    expect(issues([tier(0, null, { unitSize: 0 })])).toContain('BLOCK_SIZE')
    expect(issues([tier(0, null, { unitSize: 1.5 })])).toContain('BLOCK_SIZE')
    expect(issues([tier(0, null, { fixedAmount: -1 })])).toContain('NEGATIVE')
    expect(issues([tier(0, null, { fixedAmount: 10.5 })])).toContain('PRICE')
  })
  it('keeps profiles and components separate', () => {
    const premium = tier(0, null, { pricingProfile: 'PREMIUM', ruleKey: 'P' })
    const video = tier(0, null, { mediaComponent: 'EXTRA_VIDEO', ruleKey: 'V' })
    expect(issues([tier(0, null), premium, video])).toEqual([])
  })
  it('ignores disabled tiers when checking the schedule', () => {
    expect(issues([tier(0, null), tier(5, null, { enabled: false })])).toEqual(
      [],
    )
  })
  it('requires a valid profile and an allowance only for the custom profile', () => {
    expect(
      issues([tier(0, null, { pricingProfile: 'bad profile' })]),
    ).toContain('PROFILE')
    const allowance = (profile: string) =>
      ({
        ...newMediaRule(profile, 'INCLUDED_IMAGE', []),
        includedQuantity: 5,
      }) as PricingRule
    expect(issues([allowance('GENERIC_CUSTOMER_ADDED')])).toEqual([])
    expect(issues([allowance('STANDARD')])).toContain('ALLOWANCE')
  })
  it('ignores rules of other categories', () => {
    const other = { ...tier(0, null), category: 'OUTPUT' } as PricingRule
    expect(validateMediaRules([other])).toEqual([])
  })
})

describe('newMediaRule', () => {
  it('continues a schedule where the previous bounded tier ends and keeps keys unique', () => {
    const first = tier(0, 10, { ruleKey: 'STANDARD:EXTRA_IMAGE:1' })
    const next = newMediaRule('standard', 'EXTRA_IMAGE', [first])
    expect(next.minValue).toBe(10)
    expect(next.pricingProfile).toBe('STANDARD')
    expect(next.roundingMode).toBe('CEILING')
    expect(next.ruleKey).not.toBe(first.ruleKey)
  })
  it('creates flat included-media rules without a range', () => {
    const rule = newMediaRule('standard', 'INCLUDED_VIDEO', [])
    expect(rule.minValue).toBeNull()
    expect(rule.unitSize).toBeNull()
    expect(rule.calculationType).toBe('FIXED')
  })
})

describe('migrateLegacyCustomerAdded', () => {
  const legacy = (component: MediaPricingComponent, extra = {}) => ({
    ...newMediaRule('CUSTOM', component, []),
    ruleKey: `CUSTOM:${component}`,
    ...extra,
  })

  it('moves legacy CUSTOM customer-added rules to GENERIC_CUSTOMER_ADDED', () => {
    const out = migrateLegacyCustomerAdded([
      legacy('CHECKLIST_BASE', { fixedAmount: 200_000 }),
      legacy('INCLUDED_AREA', { includedQuantity: 15 }),
    ])
    expect(out.map((r) => r.pricingProfile)).toEqual([
      'GENERIC_CUSTOMER_ADDED',
      'GENERIC_CUSTOMER_ADDED',
    ])
    expect(out[0].ruleKey).toBe('GENERIC_CUSTOMER_ADDED:CHECKLIST_BASE')
    expect(out[0].fixedAmount).toBe(200_000)
    expect(out[1].includedQuantity).toBe(15)
  })

  it('drops a legacy rule when the generic one exists and leaves other rules alone', () => {
    const generic = {
      ...newMediaRule('GENERIC_CUSTOMER_ADDED', 'CHECKLIST_BASE', []),
      fixedAmount: 300_000,
    }
    const tier = newMediaRule('DEFAULT', 'EXTRA_IMAGE', [])
    const out = migrateLegacyCustomerAdded([
      legacy('CHECKLIST_BASE'),
      generic,
      tier,
    ])
    expect(out).toEqual([generic, tier])
  })

  it('returns the same array when there is nothing to migrate', () => {
    const rules = [newMediaRule('DEFAULT', 'EXTRA_IMAGE', [])]
    expect(migrateLegacyCustomerAdded(rules)).toBe(rules)
  })
})
