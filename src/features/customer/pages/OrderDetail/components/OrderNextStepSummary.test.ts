import { describe, expect, it } from 'vitest'

import { getMissionLabel, getPaymentLabel } from './OrderNextStepSummary'
import type { MissionCopy, PaymentCopy } from './OrderNextStepSummary'
import type { CustomerMissionSummary } from '../../../api/customerMissionReportApi'

const paymentCopy: PaymentCopy = {
  paymentUnavailable: 'Unavailable',
  paymentPaid: 'Paid',
  paymentPartial: (amount) => `Partial: ${amount}`,
  paymentDue: (amount) => `Due: ${amount}`,
  paymentOverdue: (amount) => `Overdue: ${amount}`,
  paymentCancelled: 'Invoice cancelled',
  paymentRefunded: 'Refunded',
}

const missionCopy: MissionCopy = {
  missionUnavailable: 'No mission status',
  missionLoading: 'Loading mission status',
  missionError: 'Could not load mission status',
  missionStatusUnknown: 'Unknown mission status',
  missionSummary: (count, statuses) => `${count} missions · ${statuses}`,
}

const mission = (
  id: string,
  status: CustomerMissionSummary['status'],
  replacesMissionId: string | null = null,
): CustomerMissionSummary => ({
  missionId: id,
  orderId: 'order-1',
  missionCode: id,
  scopeLabel: null,
  status,
  scheduledStartAt: null,
  scheduledEndAt: null,
  replacesMissionId,
  reportAvailable: false,
})

describe('OrderNextStepSummary status mapping', () => {
  it('uses the mission status from delivery and does not infer it from the order', () => {
    expect(getMissionLabel(null, [], false, false, 'vi', missionCopy)).toBe(
      'No mission status',
    )
    expect(
      getMissionLabel(
        { missionStatus: 'COMPLETED' },
        [],
        false,
        false,
        'en',
        missionCopy,
      ),
    ).toBe('Completed')
    expect(
      getMissionLabel(
        { missionStatus: 'FAILED' },
        [],
        false,
        false,
        'en',
        missionCopy,
      ),
    ).toBe('Failed')
    expect(
      getMissionLabel(
        { missionStatus: 'UNKNOWN_STATE' },
        [],
        false,
        false,
        'en',
        missionCopy,
      ),
    ).toBe('Unknown mission status')
  })

  it('uses real Mission summaries when delivery has no Mission status', () => {
    expect(
      getMissionLabel(
        null,
        [mission('m1', 'COMPLETED')],
        false,
        false,
        'en',
        missionCopy,
      ),
    ).toBe('Completed')
    expect(
      getMissionLabel(
        null,
        [mission('old', 'CANCELLED'), mission('new', 'COMPLETED', 'old')],
        false,
        false,
        'en',
        missionCopy,
      ),
    ).toBe('Completed')
    expect(
      getMissionLabel(
        null,
        [mission('m1', 'COMPLETED'), mission('m2', 'IN_PROGRESS')],
        false,
        false,
        'en',
        missionCopy,
      ),
    ).toBe('2 missions · Completed, In progress')
    expect(getMissionLabel(null, [], true, false, 'en', missionCopy)).toBe(
      'Loading mission status',
    )
    expect(getMissionLabel(null, [], false, true, 'en', missionCopy)).toBe(
      'Could not load mission status',
    )
  })

  it('respects invoice states instead of inferring payment from a zero balance', () => {
    const amounts = { totalAmount: 1000, paidAmount: 1000, remainingAmount: 0 }
    expect(
      getPaymentLabel({ ...amounts, invoiceStatus: 'PAID' }, paymentCopy),
    ).toBe('Paid')
    expect(
      getPaymentLabel({ ...amounts, invoiceStatus: 'CANCELLED' }, paymentCopy),
    ).toBe('Invoice cancelled')
    expect(
      getPaymentLabel({ ...amounts, invoiceStatus: 'REFUNDED' }, paymentCopy),
    ).toBe('Refunded')
    expect(
      getPaymentLabel({ ...amounts, invoiceStatus: 'ISSUED' }, paymentCopy),
    ).toBe('Unavailable')
  })

  it('shows remaining balance only for supported partial, issued and overdue invoices', () => {
    const amounts = { totalAmount: 1000, paidAmount: 300, remainingAmount: 700 }
    expect(
      getPaymentLabel(
        { ...amounts, invoiceStatus: 'PARTIALLY_PAID' },
        paymentCopy,
      ),
    ).toContain('Partial:')
    expect(
      getPaymentLabel({ ...amounts, invoiceStatus: 'ISSUED' }, paymentCopy),
    ).toContain('Due:')
    expect(
      getPaymentLabel({ ...amounts, invoiceStatus: 'OVERDUE' }, paymentCopy),
    ).toContain('Overdue:')
    expect(
      getPaymentLabel({ ...amounts, invoiceStatus: 'UNKNOWN' }, paymentCopy),
    ).toBe('Unavailable')
  })
})
