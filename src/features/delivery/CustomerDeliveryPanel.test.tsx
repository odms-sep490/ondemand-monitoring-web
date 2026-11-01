import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLanguage } from '../../shared/i18n'
import { deliveryApi } from './api'
import { CustomerDeliveryPanel } from './CustomerDeliveryPanel'
import type { Delivery } from './types'

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

beforeEach(() => {
  setLanguage('vi')
  vi.spyOn(deliveryApi, 'get').mockResolvedValue(pending)
  vi.spyOn(deliveryApi, 'previews').mockResolvedValue(pending)
})

afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})

describe('Customer delivery payment placement', () => {
  it('keeps result acceptance available without a payment prompt', async () => {
    const review = { ...pending, deliveryStatus: 'CUSTOMER_REVIEW' as const }
    vi.mocked(deliveryApi.get).mockResolvedValue(review)
    vi.mocked(deliveryApi.previews).mockResolvedValue(review)
    render(<CustomerDeliveryPanel orderId="o1" />)

    expect(await screen.findByRole('button', { name: 'Chấp nhận kết quả' }))
      .toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /thanh toán|VNPAY/i }))
      .not.toBeInTheDocument()
  })

  it('does not offer final payment after result review', async () => {
    setLanguage('en')
    render(<CustomerDeliveryPanel orderId="o1" />)
    expect(await screen.findByText('Results accepted')).toBeInTheDocument()
    expect(screen.queryByText(/payment/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pay|VNPAY/i })).not.toBeInTheDocument()
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
