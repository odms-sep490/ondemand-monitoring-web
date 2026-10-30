import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLanguage } from '../../shared/i18n'
import { ApiError } from '../../shared/api/httpClient'
import { financeApi } from '../finance/api'
import { deliveryApi } from './api'
import { CustomerDeliveryPanel } from './CustomerDeliveryPanel'
import type { Delivery } from './types'
import type { Invoice, Payment } from '../finance/types'
import { env } from '../../config/env'

const initialTestPayments = env.testPaymentsEnabled

const pending: Delivery = {
  orderId: 'o1',
  deliveryStatus: 'FINAL_PAYMENT_PENDING',
  missionStatus: 'COMPLETED',
  orderStatus: 'PROCESSING',
  invoiceStatus: 'PARTIALLY_PAID',
  totalAmount: 1000,
  paidAmount: 300,
  remainingAmount: 700,
  deliveryNotes: null,
  previewReleasedAt: '2026-10-30T03:00:00Z',
  customerAcceptedAt: '2026-10-30T03:01:00Z',
  revisionRequestedAt: null,
  revisionReason: null,
  revisionCount: 0,
  finalPaymentConfirmedAt: null,
  originalsReleasedAt: null,
  assets: [],
}

const delivery: Delivery = {
  orderId: 'order-1',
  deliveryStatus: 'PROCESSING',
  missionStatus: 'IN_PROGRESS',
  orderStatus: 'COMPLETED',
  invoiceStatus: 'ISSUED',
  totalAmount: 1000,
  paidAmount: 0,
  remainingAmount: 1000,
  deliveryNotes: null,
  previewReleasedAt: null,
  customerAcceptedAt: null,
  revisionRequestedAt: null,
  revisionReason: null,
  revisionCount: 0,
  finalPaymentConfirmedAt: null,
  originalsReleasedAt: null,
  assets: [],
}

const invoice: Invoice = {
  id: 'i1',
  invoiceNumber: 'INV-1',
  orderId: 'o1',
  quoteId: 'q1',
  totalAmount: 1000,
  depositAmount: 300,
  paidAmount: 300,
  remainingAmount: 700,
  status: 'PARTIALLY_PAID',
  issuedAt: '2026-10-30T03:00:00Z',
  finalPaymentAllowed: true,
}

const payment: Payment = {
  id: 'p1',
  invoiceId: 'i1',
  paymentCode: 123,
  type: 'FINAL_PAYMENT',
  amount: 700,
  currency: 'VND',
  status: 'SUCCESS',
  provider: 'VNPAY',
  paymentUrl: null,
  transactionReference: '123',
  providerTransactionId: 'TEST-123',
  paidAt: '2026-10-30T03:02:00Z',
}

beforeEach(() => {
  Object.defineProperty(env, 'testPaymentsEnabled', {
    value: true,
    configurable: true,
  })
  setLanguage('vi')
  vi.spyOn(deliveryApi, 'get').mockResolvedValue(pending)
  vi.spyOn(deliveryApi, 'previews').mockResolvedValue(pending)
  vi.spyOn(financeApi, 'getInvoice').mockResolvedValue(invoice)
})

afterEach(() => {
  vi.restoreAllMocks()
  Object.defineProperty(env, 'testPaymentsEnabled', {
    value: initialTestPayments,
    configurable: true,
  })
  setLanguage('vi')
})

describe('Customer delivery final test payment', () => {
  it('pays the remaining balance without opening VNPAY and refreshes delivery', async () => {
    const confirmed = {
      ...pending,
      deliveryStatus: 'PAYMENT_CONFIRMED' as const,
      paidAmount: 1000,
      remainingAmount: 0,
      invoiceStatus: 'PAID',
    }
    const realPayment = vi.spyOn(financeApi, 'createFinalPayment')
    const complete = vi
      .spyOn(financeApi, 'completeTestFinal')
      .mockImplementation(async () => {
        vi.mocked(deliveryApi.get).mockResolvedValue(confirmed)
        vi.mocked(deliveryApi.previews).mockResolvedValue(confirmed)
        return payment
      })
    render(<CustomerDeliveryPanel orderId="o1" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Thanh toán nhanh (Test)' }),
    )
    await waitFor(() => expect(complete).toHaveBeenCalledExactlyOnceWith('i1'))
    expect(
      await screen.findByText('Thanh toán đã được xác nhận'),
    ).toBeInTheDocument()
    expect(realPayment).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'Thanh toán nhanh (Test)' }),
    ).not.toBeInTheDocument()
  })

  it('keeps the action available for retry after an API failure', async () => {
    const complete = vi
      .spyOn(financeApi, 'completeTestFinal')
      .mockRejectedValue(
        new ApiError('Unavailable', {
          status: 503,
          method: 'POST',
          path: '/api/invoices/i1/payments/test-final',
        }),
      )
    render(<CustomerDeliveryPanel orderId="o1" />)
    const button = await screen.findByRole('button', {
      name: 'Thanh toán nhanh (Test)',
    })
    fireEvent.click(button)
    await waitFor(() => expect(complete).toHaveBeenCalledOnce())
    await waitFor(() => expect(button).toBeEnabled())
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('hides the test action when disabled while keeping normal payment available', async () => {
    Object.defineProperty(env, 'testPaymentsEnabled', {
      value: false,
      configurable: true,
    })
    render(<CustomerDeliveryPanel orderId="o1" />)
    expect(
      await screen.findByRole('button', { name: 'Thanh toán qua VNPAY' }),
    ).toBeEnabled()
    expect(
      screen.queryByRole('button', { name: 'Thanh toán nhanh (Test)' }),
    ).not.toBeInTheDocument()
  })

  it('does not offer payment before customer acceptance', async () => {
    const review = { ...pending, deliveryStatus: 'CUSTOMER_REVIEW' as const }
    vi.mocked(deliveryApi.get).mockResolvedValue(review)
    vi.mocked(deliveryApi.previews).mockResolvedValue(review)
    render(<CustomerDeliveryPanel orderId="o1" />)
    await screen.findByRole('button', { name: 'Chấp nhận kết quả' })
    expect(
      screen.queryByRole('button', { name: 'Thanh toán nhanh (Test)' }),
    ).not.toBeInTheDocument()
  })
})

describe('CustomerDeliveryPanel', () => {
  it('shows a retryable error and recovers to a clear empty-assets state', async () => {
    setLanguage('vi')
    const getDelivery = vi
      .spyOn(deliveryApi, 'get')
      .mockRejectedValueOnce(new Error('Mất kết nối'))
      .mockResolvedValue(delivery)

    render(<CustomerDeliveryPanel orderId="order-1" />)

    expect(await screen.findByText('Mất kết nối')).toBeInTheDocument()
    screen.getByRole('button', { name: 'Thử lại' }).click()

    expect(
      await screen.findByText('Chưa có tệp kết quả được gửi ở bước này.'),
    ).toBeInTheDocument()
    expect(getDelivery).toHaveBeenCalledTimes(2)
  })
})
