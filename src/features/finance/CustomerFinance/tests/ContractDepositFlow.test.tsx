import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { CustomerFinancePanel } from '../CustomerFinancePanel'
import { financeApi } from '../../api'
import { refundApi } from '../../refundApi'
import { env } from '../../../../config/env'
import { ApiError } from '../../../../shared/api/httpClient'
import { setLanguage } from '../../../../shared/i18n'
import type { Invoice } from '../../types'
const server = vi.hoisted(() => ({ submitted: false }))
vi.mock('../../../contract/OrderContractPanel', () => ({
  OrderContractPanel: (props: {
    onUpdated?: () => void
    onProceedToPayment?: () => void
  }) => (
    <div>
      <button
        onClick={() => {
          server.submitted = true
          props.onUpdated?.()
        }}
      >
        Send signed copy
      </button>
      <button onClick={props.onProceedToPayment}>Open payment</button>
    </div>
  ),
}))
const invoice: Invoice = {
  id: 'i',
  invoiceNumber: 'INV-1',
  orderId: 'o',
  quoteId: 'q',
  totalAmount: 1000,
  depositAmount: 300,
  paidAmount: 0,
  remainingAmount: 1000,
  status: 'ISSUED',
  depositStatus: 'WAITING_DEPOSIT',
  issuedAt: '2026-11-16T00:00:00Z',
  finalPaymentAllowed: false,
  contractRequired: true,
  contractConfirmedAt: null,
  contractSubmittedAt: null,
}
beforeEach(() => {
  setLanguage('vi')
  server.submitted = false
  vi.spyOn(financeApi, 'getQuote').mockRejectedValue(
    new ApiError('No quote', {
      status: 404,
      method: 'GET',
      path: '/api/quotes',
    }),
  )
  vi.spyOn(financeApi, 'getInvoice').mockImplementation(async () => ({
    ...invoice,
    contractSubmittedAt: server.submitted ? '2026-11-16T01:00:00Z' : null,
  }))
  vi.spyOn(
    financeApi,
    'getCustomerMissionPaymentAllocations',
  ).mockResolvedValue({
    invoiceId: 'i',
    allocationTargetAmount: 700,
    allocatedAmount: 0,
    allocationComplete: false,
    milestones: [],
  })
  vi.spyOn(refundApi, 'getCustomerOrderRefund').mockRejectedValue(
    new ApiError('No refund', {
      status: 404,
      method: 'GET',
      path: '/api/refund',
    }),
  )
})
afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})
it('refreshes invoice eligibility after signing and creates a deposit without manager confirmation', async () => {
  const changed = vi.fn()
  const create = vi.spyOn(financeApi, 'createDeposit').mockRejectedValue(
    new ApiError('Provider unavailable', {
      status: 503,
      code: 'PAYMENT_PROVIDER_ERROR',
      method: 'POST',
      path: '/api/deposit',
    }),
  )
  const props = { orderId: 'o', onStateChange: changed, onOpenPayment: vi.fn() }
  const view = render(<CustomerFinancePanel {...props} section="contract" />)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Send signed copy' }),
  )
  await waitFor(() =>
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        invoice: expect.objectContaining({
          contractSubmittedAt: '2026-11-16T01:00:00Z',
          contractConfirmedAt: null,
        }),
      }),
    ),
  )
  view.rerender(<CustomerFinancePanel {...props} section="payment" />)
  fireEvent.click(
    await screen.findByRole('button', { name: /Thanh to.n .*c.c/i }),
  )
  await waitFor(() => expect(create).toHaveBeenCalledExactlyOnceWith('i'))
  expect(
    screen.queryByText('Hoàn tất xác nhận hợp đồng để thanh toán tiền cọc.'),
  ).toBeNull()
})
it('does not show deposit checkout until a required signed copy has been submitted', async () => {
  const create = vi.spyOn(financeApi, 'createDeposit')
  render(
    <CustomerFinancePanel
      orderId="o"
      section="payment"
      onOpenContract={vi.fn()}
    />,
  )
  expect(
    await screen.findByText('Gửi bản hợp đồng đã ký để thanh toán tiền cọc.'),
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Thanh to.n .*c.c/i })).toBeNull()
  expect(create).not.toHaveBeenCalled()
})
it('keeps demo deposit payments aligned with the signed-submission rule', async () => {
  server.submitted = true
  vi.spyOn(env, 'testPaymentsEnabled', 'get').mockReturnValue(true)
  const pay = vi
    .spyOn(financeApi, 'completeTestDeposit')
    .mockResolvedValue({} as never)
  render(<CustomerFinancePanel orderId="o" section="payment" />)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Thanh toán nhanh (Test)' }),
  )
  await waitFor(() => expect(pay).toHaveBeenCalledExactlyOnceWith('i'))
})
it('shows paid but pending verification without offering a second deposit', async () => {
  vi.mocked(financeApi.getInvoice).mockResolvedValue({
    ...invoice,
    contractSubmittedAt: '2026-11-16T01:00:00Z',
    paidAmount: 300,
    remainingAmount: 700,
    status: 'PARTIALLY_PAID',
    depositStatus: 'DEPOSIT_PAID',
  })
  render(<CustomerFinancePanel orderId="o" section="payment" />)
  expect(
    await screen.findByText('Đã nhận cọc · Chờ xác minh hợp đồng'),
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Thanh to.n .*c.c/i })).toBeNull()
})
