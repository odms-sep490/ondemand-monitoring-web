import { describe, expect, it } from 'vitest'

import type { PricingChecklistItem } from '../types'
import { approvedPrices, emptyDraft, isManagerPriced } from './pricingHelpers'

const additionalBaseChecklist: PricingChecklistItem = {
  id: 'base-checklist-item',
  sourceChecklistId: 'base-checklist',
  content: 'Roof inspection',
  displayOrder: 1,
  sourceType: 'CUSTOMER_SELECTED',
  reviewStatus: 'ADDITIONAL',
  managerNote: null,
  managerQuoteRequired: false,
  pricingSnapshotVersion: 2,
  managerQuotedPrice: null,
}

describe('Manager pricing for Base Checklist snapshots', () => {
  it('uses the system price for a newly selected Base Checklist without a Manager override', () => {
    expect(isManagerPriced(additionalBaseChecklist)).toBe(false)
    expect(
      approvedPrices(
        [additionalBaseChecklist],
        { ...emptyDraft, prices: { [additionalBaseChecklist.id]: '9999999' } },
        [{ orderChecklistItemId: additionalBaseChecklist.id, amount: 450_000 }],
      ),
    ).toEqual({})
  })

  it('keeps Manager pricing for customer-authored work', () => {
    expect(
      isManagerPriced({
        ...additionalBaseChecklist,
        sourceChecklistId: null,
        sourceType: 'CUSTOMER_CUSTOM',
        pricingSnapshotVersion: 1,
        managerQuoteRequired: true,
      }),
    ).toBe(true)
  })
})
