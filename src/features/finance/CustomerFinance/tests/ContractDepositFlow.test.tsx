import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { CustomerFinancePanel } from '../CustomerFinancePanel'
import { financeApi } from '../../api'
import { refundApi } from '../../refundApi'
import { env } from '../../../../config/env'
import { ApiError } from '../../../../shared/api/httpClient'
import { setLanguage } from '../../../../shared/i18n'
import type { Invoice } from '../../types'
const server = vi.hoisted(() => ({ submitted: false, confirmed: false }))
vi.mock('../../../contract/OrderContractPanel', () => ({
  OrderContractPanel: (props: {
    onUpdated?: () => void
    onConfirmed?: () => void
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
      <button
        onClick={() => {
          server.confirmed = true
          props.onConfirmed?.()
        }}
      >
        Refresh confirmed contract
      </button>
      {props.onProceedToPayment && (
        <button onClick={props.onProceedToPayment}>Go to payment</button>
      )}
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
  server.confirmed = false
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
    contractConfirmedAt: server.confirmed ? '2026-11-16T02:00:00Z' : null,
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
it('keeps deposit locked after upload and refreshes eligibility when the manager confirms', async () => {
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
  expect(screen.queryByRole('button', { name: /Thanh to.n .*c.c/i })).toBeNull()
  expect(create).not.toHaveBeenCalled()

  view.rerender(<CustomerFinancePanel {...props} section="contract" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Refresh confirmed contract' }))
  await waitFor(() =>
    expect(changed).toHaveBeenLastCalledWith(
      expect.objectContaining({
        invoice: expect.objectContaining({
          contractConfirmedAt: '2026-11-16T02:00:00Z',
        }),
      }),
    ),
  )
  view.rerender(<CustomerFinancePanel {...props} section="payment" />)
  fireEvent.click(
    await screen.findByRole('button', { name: /Thanh to.n .*c.c/i }),
  )
  await waitFor(() => expect(create).toHaveBeenCalledExactlyOnceWith('i'))
})
it('does not show deposit checkout before a required contract is submitted', async () => {
  const create = vi.spyOn(financeApi, 'createDeposit')
  render(
    <CustomerFinancePanel
      orderId="o"
      section="payment"
      onOpenContract={vi.fn()}
    />,
  )
  expect(
    await screen.findByText('Chờ quản lý xác nhận hợp đồng trước khi thanh toán tiền cọc.'),
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Thanh to.n .*c.c/i })).toBeNull()
  expect(create).not.toHaveBeenCalled()
})
it('blocks demo deposit before confirmation and allows it afterwards', async () => {
  server.submitted = true
  vi.spyOn(env, 'testPaymentsEnabled', 'get').mockReturnValue(true)
  const pay = vi
    .spyOn(financeApi, 'completeTestDeposit')
    .mockResolvedValue({} as never)
  const view = render(
    <CustomerFinancePanel orderId="o" section="payment" onOpenContract={vi.fn()} />,
  )
  expect(
    await screen.findByText('Chờ quản lý xác nhận hợp đồng trước khi thanh toán tiền cọc.'),
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Thanh toán nhanh (Test)' })).toBeNull()
  expect(pay).not.toHaveBeenCalled()

  server.confirmed = true
  view.rerender(<CustomerFinancePanel key="confirmed" orderId="o" section="payment" />)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Thanh toán nhanh (Test)' }),
  )
  await waitFor(() => expect(pay).toHaveBeenCalledExactlyOnceWith('i'))
})
it('shows an existing paid deposit pending verification without offering a second deposit', async () => {
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

it.each([
  { status: 'PAID', depositStatus: 'DEPOSIT_PAID', paidAmount: 1000 },
  { status: 'PARTIALLY_PAID', depositStatus: 'DEPOSIT_PAID', paidAmount: 300 },
  { status: 'PARTIALLY_PAID', depositStatus: undefined, paidAmount: 300 },
] satisfies Partial<Invoice>[])(
  'hides the contract payment shortcut once the deposit is covered ($status)',
  async (payment) => {
    vi.mocked(financeApi.getInvoice).mockResolvedValue({
      ...invoice,
      contractConfirmedAt: '2026-11-16T02:00:00Z',
      ...payment,
    })
    render(<CustomerFinancePanel orderId="o" section="contract" onOpenPayment={vi.fn()} />)
    await screen.findByRole('button', { name: 'Refresh confirmed contract' })
    expect(screen.queryByRole('button', { name: 'Go to payment' })).toBeNull()
  },
)

it('keeps the contract payment shortcut for a confirmed invoice with an outstanding deposit', async () => {
  server.confirmed = true
  const open = vi.fn()
  render(<CustomerFinancePanel orderId="o" section="contract" onOpenPayment={open} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Go to payment' }))
  expect(open).toHaveBeenCalledOnce()
})
