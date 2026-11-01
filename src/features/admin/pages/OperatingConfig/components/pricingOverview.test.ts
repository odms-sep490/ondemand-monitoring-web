import { describe, expect, it } from 'vitest'
import { newMediaRule } from '../../../lib/mediaPricingRules'
import { customerRule, numberIn, sharedTiers } from './pricingOverview'

describe('pricingOverview', () => {
  it('formats numbers with the given locale and shows a dash when missing', () => {
    expect(numberIn('vi-VN', 1234, '%')).toBe('1.234%')
    expect(numberIn('en-US', 1234)).toBe('1,234')
    expect(numberIn('vi-VN', null)).toBe('—')
  })

  it('picks enabled shared tiers lowest range first and ignores other profiles', () => {
    const a = { ...newMediaRule('DEFAULT', 'EXTRA_IMAGE', []), minValue: 10 }
    const b = { ...a, minValue: 0 }
    const off = { ...a, minValue: 20, enabled: false }
    const other = newMediaRule('STANDARD', 'EXTRA_IMAGE', [])
    expect(
      sharedTiers([a, off, other, b], 'EXTRA_IMAGE').map((r) => r.minValue),
    ).toEqual([0, 10])
  })

  it('finds the enabled customer-added rule of a component', () => {
    const rule = newMediaRule('GENERIC_CUSTOMER_ADDED', 'CHECKLIST_BASE', [])
    expect(customerRule([rule], 'CHECKLIST_BASE')).toBe(rule)
    expect(
      customerRule([{ ...rule, enabled: false }], 'CHECKLIST_BASE'),
    ).toBeUndefined()
  })
})
