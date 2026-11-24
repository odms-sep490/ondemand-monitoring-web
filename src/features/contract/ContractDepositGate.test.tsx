import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { setLanguage } from '../../shared/i18n'
import { InvoiceSection } from '../finance/CustomerFinance/components/InvoiceSection'
import type { Invoice } from '../finance/types'

afterEach(() => setLanguage('vi'))
it('opens deposit only after the manager confirms the signed contract', () => {
  const invoice: Invoice = {
    id: 'invoice',
    invoiceNumber: 'INV-1',
    orderId: 'order',
    quoteId: 'quote',
    totalAmount: 1000,
    depositAmount: 300,
    paidAmount: 0,
    remainingAmount: 1000,
    status: 'ISSUED',
    depositStatus: 'WAITING_DEPOSIT',
    issuedAt: '2026-11-14T04:00:00Z',
    finalPaymentAllowed: false,
    contractRequired: true,
    contractConfirmedAt: null,
  }
  const pay = vi.fn().mockResolvedValue(undefined)
  const props = {
    invoice,
    legalReady: true,
    busy: false,
    pay,
    completeTestDeposit: vi.fn().mockResolvedValue(undefined),
    testPaymentLabel: 'Test deposit',
  }
  const { rerender } = render(<InvoiceSection {...props} />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  expect(pay).not.toHaveBeenCalled()
  rerender(
    <InvoiceSection
      {...props}
      invoice={{ ...invoice, contractSubmittedAt: '2026-11-14T05:00:00Z' }}
    />,
  )
  expect(screen.queryByRole('button', { name: /Thanh to.n .*c.c/i })).toBeNull()
  expect(pay).not.toHaveBeenCalled()
  rerender(
    <InvoiceSection
      {...props}
      invoice={{
        ...invoice,
        contractSubmittedAt: '2026-11-14T05:00:00Z',
        contractConfirmedAt: '2026-11-14T06:00:00Z',
      }}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: /Thanh to.n .*c.c/i }))
  expect(pay).toHaveBeenCalledWith('deposit')
})

it.each(['CANCELLED', 'REFUNDED', 'OVERDUE'] as const)('does not reopen %s invoices even after contract confirmation', status => {
  const pay = vi.fn()
  render(<InvoiceSection invoice={{ id: 'i', invoiceNumber: 'I', orderId: 'o', quoteId: 'q', totalAmount: 1000, depositAmount: 300, paidAmount: 0, remainingAmount: 1000, status, issuedAt: '2026-11-16T00:00:00Z', finalPaymentAllowed: false, contractRequired: true, contractSubmittedAt: '2026-11-16T01:00:00Z', contractConfirmedAt: '2026-11-16T02:00:00Z' }} legalReady busy={false} pay={pay} completeTestDeposit={vi.fn()} testPaymentLabel="Test" />)
  expect(screen.queryByRole('button', { name: /Thanh to.n .*c.c/i })).toBeNull()
  expect(pay).not.toHaveBeenCalled()
})
