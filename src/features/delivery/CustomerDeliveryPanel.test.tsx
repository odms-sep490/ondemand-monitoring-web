import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../shared/i18n'
import { CustomerDeliveryPanel } from './CustomerDeliveryPanel'
import { deliveryApi } from './api'
import type { Delivery } from './types'

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

afterEach(() => vi.restoreAllMocks())

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
