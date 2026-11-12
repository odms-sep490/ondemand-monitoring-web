import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { act } from '@testing-library/react'
import { setLanguage } from '../../../../shared/i18n'
import { ApiError } from '../../../../shared/api/httpClient'
import { financeApi } from '../../api'
import { CustomerFinancePanel } from '../CustomerFinancePanel'
import type { CustomerQuote, Invoice, Payment } from '../../types'

const quote: CustomerQuote = {
  id: 'quote-1',
  orderId: 'order-1',
  version: 1,
  status: 'APPROVED',
  estimatedBaseAmount: 5_000_000,
  approvedAdditionalServiceAmount: 0,
  finalOrderAmount: 5_000_000,
  pricingFinalized: true,
  approvedAt: '2026-10-06T08:00:00Z',
  acceptedAt: null,
  items: [],
}

const invoice: Invoice = {
  id: 'invoice-1',
  invoiceNumber: 'INV-1',
  orderId: 'order-1',
  quoteId: 'quote-1',
  totalAmount: 5_000_000,
  depositAmount: 1_500_000,
  paidAmount: 0,
  remainingAmount: 5_000_000,
  status: 'ISSUED',
  depositStatus: 'WAITING_DEPOSIT',
  issuedAt: '2026-10-06T08:00:00Z',
  finalPaymentAllowed: false,
}

const pendingDeposit: Payment = {
  id: 'payment-1',
  invoiceId: 'invoice-1',
  paymentCode: 123456,
  type: 'DEPOSIT',
  amount: 1_500_000,
  currency: 'VND',
  status: 'PENDING',
  provider: 'VNPAY',
  paymentUrl: null,
  transactionReference: '1760000000000123456',
  providerTransactionId: null,
  paidAt: null,
}

const noMissionPayments = {
  invoiceId: 'invoice-1',
  allocationTargetAmount: 3_500_000,
  allocatedAmount: 0,
  allocationComplete: false,
  milestones: [],
}

beforeEach(() => {
  vi.spyOn(financeApi, 'getCustomerMissionPaymentAllocations').mockResolvedValue(noMissionPayments)
})

afterEach(() => {
  vi.restoreAllMocks()
  act(() => setLanguage('vi'))
})

describe('CustomerFinancePanel', () => {
  it.each([
    'CHECKLIST_GUIDANCE_INCOMPLETE',
    'STALE_GUIDANCE_SNAPSHOT',
    'QUOTE_GUIDANCE_SNAPSHOT_STALE',
  ])(
    'asks the Manager to reissue when getQuote rejects with %s',
    async (code) => {
      vi.spyOn(financeApi, 'getQuote').mockRejectedValue(
        new ApiError('Guidance rejected', {
          code,
          status: 409,
          method: 'GET',
          path: '/',
        }),
      )
      vi.spyOn(financeApi, 'getInvoice').mockRejectedValue(
        new ApiError('Not found', { status: 404, method: 'GET', path: '/' }),
      )
      render(<CustomerFinancePanel orderId="order-1" />)
      expect(
        await screen.findByText(
          code === 'CHECKLIST_GUIDANCE_INCOMPLETE'
            ? /yêu cầu quản lý bổ sung hướng dẫn/
            : /yêu cầu quản lý cập nhật và phát hành lại/,
        ),
      ).toBeInTheDocument()
      act(() => setLanguage('en'))
      expect(
        await screen.findByText(
          code === 'CHECKLIST_GUIDANCE_INCOMPLETE'
            ? /Manager to complete the guidance and reissue/
            : /Ask the Manager to update and reissue/,
        ),
      ).toBeInTheDocument()
    },
  )

  it('does not offer a one-time final payment after the deposit', async () => {
    vi.spyOn(financeApi, 'getQuote').mockResolvedValue(quote)
    vi.spyOn(financeApi, 'getInvoice')
      .mockResolvedValueOnce({
        ...invoice,
        paidAmount: invoice.depositAmount,
        remainingAmount: 3_500_000,
        status: 'PARTIALLY_PAID',
        finalPaymentAllowed: true,
      })
      .mockResolvedValueOnce({
        ...invoice,
        paidAmount: invoice.totalAmount,
        remainingAmount: 0,
        status: 'PAID',
        finalPaymentAllowed: false,
      })
    render(<CustomerFinancePanel orderId="order-1" />)
    expect(
      await screen.findByText(
        'Các khoản thanh toán theo nhiệm vụ sẽ xuất hiện riêng sau khi từng nhiệm vụ được bàn giao.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /thanh toán phần còn lại/i })).not.toBeInTheDocument()
  })

  it('shows a handed-over Mission amount, payment history, and an independent retry action', async () => {
    vi.spyOn(financeApi, 'getQuote').mockResolvedValue(quote)
    vi.spyOn(financeApi, 'getInvoice').mockResolvedValue({
      ...invoice,
      paidAmount: invoice.depositAmount,
      remainingAmount: 3_500_000,
      status: 'PARTIALLY_PAID',
    })
    vi.spyOn(financeApi, 'getCustomerMissionPaymentAllocations').mockResolvedValue({
      invoiceId: 'invoice-1',
      allocationTargetAmount: 3_500_000,
      allocatedAmount: 3_500_000,
      allocationComplete: true,
      milestones: [{
        id: 'milestone-1',
        missionId: 'mission-1',
        missionCode: 'MS-101',
        scopeLabel: 'Khu vực nhà xưởng',
        amount: 1_000_000,
        currency: 'VND',
        status: 'UNPAID',
        handedOverAt: '2026-11-11T08:00:00Z',
        paymentExpiresAt: null,
        payments: [{
          ...pendingDeposit,
          id: 'payment-failed',
          type: 'MISSION_PAYMENT',
          missionPaymentMilestoneId: 'milestone-1',
          amount: 1_000_000,
          status: 'FAILED',
          transactionReference: 'MISSION-RETRY-1',
        }],
      }],
    })
    const createPayment = vi.spyOn(financeApi, 'createMissionPayment').mockResolvedValue({
      ...pendingDeposit,
      type: 'MISSION_PAYMENT',
      missionPaymentMilestoneId: 'milestone-1',
      paymentUrl: null,
    })

    render(<CustomerFinancePanel orderId="order-1" />)

    expect(await screen.findByText('Khu vực nhà xưởng')).toBeInTheDocument()
    expect(screen.getByText('MS-101')).toBeInTheDocument()
    expect(screen.getByText('MISSION-RETRY-1')).toBeInTheDocument()
    const retry = await screen.findByRole('button', { name: 'Thử thanh toán lại' })
    fireEvent.click(retry)
    await waitFor(() => expect(createPayment).toHaveBeenCalledWith('milestone-1'))
  })

  it('explains when the order has no quote or payment records yet', async () => {
    vi.spyOn(financeApi, 'getQuote').mockRejectedValue(
      new ApiError('Not found', {
        status: 404,
        method: 'GET',
        path: '/api/orders/order-1/quote',
      }),
    )
    vi.spyOn(financeApi, 'getInvoice').mockRejectedValue(
      new ApiError('Not found', {
        status: 404,
        method: 'GET',
        path: '/api/orders/order-1/invoice',
      }),
    )

    render(<CustomerFinancePanel orderId="order-1" />)

    expect(
      await screen.findByText(
        'Đơn hàng chưa có báo giá hoặc thông tin thanh toán.',
      ),
    ).toBeInTheDocument()
  })

  it('completes a deposit immediately with the development test button', async () => {
    act(() => setLanguage('en'))
    vi.spyOn(financeApi, 'getQuote').mockResolvedValue(quote)
    vi.spyOn(financeApi, 'getInvoice')
      .mockResolvedValueOnce(invoice)
      .mockResolvedValueOnce({
        ...invoice,
        paidAmount: invoice.depositAmount,
        remainingAmount: invoice.totalAmount - invoice.depositAmount,
        status: 'PARTIALLY_PAID',
      })
    const complete = vi
      .spyOn(financeApi, 'completeTestDeposit')
      .mockResolvedValue({
        ...pendingDeposit,
        status: 'SUCCESS',
        paidAt: '2026-10-19T08:00:00Z',
      })

    render(<CustomerFinancePanel orderId="order-1" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Quick payment (Test)' }),
    )

    await waitFor(() => expect(complete).toHaveBeenCalledWith('invoice-1'))
    expect(
      await screen.findByText('Mission preparation in progress'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Pay the remaining balance' }),
    ).not.toBeInTheDocument()
  })

  it('lets the customer accept an approved quote and start the deposit payment', async () => {
    vi.spyOn(financeApi, 'getQuote')
      .mockResolvedValueOnce(quote)
      .mockResolvedValue({
        ...quote,
        status: 'ACCEPTED_BY_CUSTOMER',
        acceptedAt: '2026-11-01T08:00:00Z',
      })
    vi.spyOn(financeApi, 'getInvoice')
      .mockRejectedValueOnce(
        new ApiError('Not found', {
          status: 404,
          method: 'GET',
          path: '/api/orders/order-1/invoice',
        }),
      )
      .mockResolvedValue(invoice)
    vi.spyOn(financeApi, 'acceptQuote').mockResolvedValue(invoice)
    const createDeposit = vi
      .spyOn(financeApi, 'createDeposit')
      .mockResolvedValue(pendingDeposit)

    const { container } = render(<CustomerFinancePanel orderId="order-1" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Chấp nhận báo giá' }),
    )

    const depositButton = await screen.findByRole('button', {
      name: 'Thanh toán đặt cọc',
    })
    expect(await screen.findByText('Đã chấp nhận báo giá')).toBeInTheDocument()
    expect(
      container.querySelector('.customer-quote-actions .customer-invoice'),
    ).toBeInTheDocument()
    expect(
      container.querySelector('.customer-quote-body > .customer-invoice'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/Tiền cọc 30% cần thanh toán: 1\.500\.000/),
    ).toBeInTheDocument()
    fireEvent.click(depositButton)

    await waitFor(() => expect(createDeposit).toHaveBeenCalledWith('invoice-1'))
    expect(
      await screen.findByText(
        'Cổng thanh toán chưa trả về đường dẫn thanh toán.',
      ),
    ).toBeInTheDocument()
  })
})
