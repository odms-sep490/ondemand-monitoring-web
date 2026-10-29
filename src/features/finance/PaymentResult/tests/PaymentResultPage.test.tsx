import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { financeApi } from '../../api'
import { PaymentResultPage } from '../PaymentResultPage'
import type { Payment } from '../../types'

const pending: Payment = {
  id: 'payment-1',
  invoiceId: 'invoice-1',
  paymentCode: 123456,
  type: 'DEPOSIT',
  amount: 300_000,
  currency: 'VND',
  status: 'PENDING',
  provider: 'VNPAY',
  paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  transactionReference: '1760000000000123456',
  providerTransactionId: null,
  paidAt: null,
}

afterEach(() => {
  vi.restoreAllMocks()
  window.location.hash = ''
})

describe('PaymentResultPage VNPAY return', () => {
  it('reads vnp_TxnRef and trusts the polled backend status', async () => {
    window.location.hash =
      '#payment/result?transactionReference=1760000000000123456'
    const refreshPayment = vi
      .spyOn(financeApi, 'refreshPaymentByReference')
      .mockResolvedValue({
        ...pending,
        status: 'SUCCESS',
        providerTransactionId: '14587452',
        paidAt: '2026-10-06T08:00:00Z',
      })

    render(<PaymentResultPage />)

    await waitFor(() =>
      expect(refreshPayment).toHaveBeenCalledWith('1760000000000123456'),
    )
    expect(await screen.findByText('Thanh toán thành công')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Tiền đặt cọc đã được ghi nhận. Kế hoạch thực hiện đang được chuẩn bị.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/backend/i)).not.toBeInTheDocument()
    expect(screen.queryByText('SUCCESS')).not.toBeInTheDocument()
  })
})
