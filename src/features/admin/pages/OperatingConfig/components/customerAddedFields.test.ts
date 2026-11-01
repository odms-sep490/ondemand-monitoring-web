import { describe, expect, it } from 'vitest'
import { newMediaRule } from '../../../lib/mediaPricingRules'
import {
  CUSTOMER_ADDED_FIELDS,
  customerAddedValue,
  withCustomerAddedValue,
} from './customerAddedFields'

const [base, images] = CUSTOMER_ADDED_FIELDS

describe('customerAddedFields', () => {
  it('reads null for a rule that does not exist and the stored number otherwise', () => {
    expect(customerAddedValue([], base)).toBeNull()
    const rules = [
      {
        ...newMediaRule('GENERIC_CUSTOMER_ADDED', 'CHECKLIST_BASE', []),
        fixedAmount: 200_000,
      },
    ]
    expect(customerAddedValue(rules, base)).toBe(200_000)
  })

  it('creates a missing rule only when a value is typed', () => {
    expect(withCustomerAddedValue([], base, null)).toBeNull()
    const created = withCustomerAddedValue([], images, 5)!
    expect(created).toHaveLength(1)
    expect(created[0]).toMatchObject({
      pricingProfile: 'GENERIC_CUSTOMER_ADDED',
      includedQuantity: 5,
      fixedAmount: 0,
    })
  })

  it('updates an existing rule in place', () => {
    const rules = [
      {
        ...newMediaRule('GENERIC_CUSTOMER_ADDED', 'CHECKLIST_BASE', []),
        fixedAmount: 1,
      },
    ]
    expect(withCustomerAddedValue(rules, base, 250_000)![0].fixedAmount).toBe(
      250_000,
    )
  })
})
