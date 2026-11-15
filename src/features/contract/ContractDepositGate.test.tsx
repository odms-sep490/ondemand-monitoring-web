import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { setLanguage } from '../../shared/i18n'
import { InvoiceSection } from '../finance/CustomerFinance/components/InvoiceSection'
import type { Invoice } from '../finance/types'

afterEach(() => setLanguage('vi'))
it('allows deposit after signed submission while the contract remains unconfirmed', () => {
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
  fireEvent.click(screen.getByRole('button', { name: /Thanh to.n .*c.c/i }))
  expect(pay).toHaveBeenCalledWith('deposit')
})
