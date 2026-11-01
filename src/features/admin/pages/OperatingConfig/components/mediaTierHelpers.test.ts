import { describe, expect, it } from 'vitest'
import { newMediaRule } from '../../../lib/mediaPricingRules'
import { isShared, sharedTiersOf } from './mediaTierHelpers'

describe('sharedMediaTiers', () => {
  it('lists only the DEFAULT-profile tiers without a checklist, lowest range first', () => {
    const low = { ...newMediaRule('DEFAULT', 'EXTRA_IMAGE', []), minValue: 0 }
    const high = { ...low, ruleKey: 'b', minValue: 10 }
    const perChecklist = newMediaRule('DEFAULT', 'EXTRA_IMAGE', [], 'c1', 'C')
    const other = newMediaRule('STANDARD', 'EXTRA_IMAGE', [])
    const rules = [high, perChecklist, other, low]
    expect(isShared(perChecklist, 'EXTRA_IMAGE')).toBe(false)
    expect(isShared(other, 'EXTRA_IMAGE')).toBe(false)
    expect(sharedTiersOf(rules, 'EXTRA_IMAGE').map((e) => e.index)).toEqual([
      3, 0,
    ])
    expect(sharedTiersOf(rules, 'EXTRA_VIDEO')).toEqual([])
  })
})
