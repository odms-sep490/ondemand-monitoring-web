import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { OrderDetailPage } from '../OrderDetailPage'
import { ApiError } from '../../../../../shared/api/httpClient'
import { deliveryApi } from '../../../../delivery/api'
import { financeApi } from '../../../../finance/api'
import type { CustomerQuote, Invoice } from '../../../../finance/types'

const payableQuote: CustomerQuote = {
  id: 'quote-live',
  orderId: 'cus-ord-003',
  version: 1,
  status: 'ACCEPTED_BY_CUSTOMER',
  estimatedBaseAmount: 5_000_000,
  approvedAdditionalServiceAmount: 0,
  finalOrderAmount: 5_000_000,
  pricingFinalized: true,
  approvedAt: '2026-11-01T08:00:00Z',
  acceptedAt: '2026-11-01T09:00:00Z',
  items: [],
}

const payableInvoice: Invoice = {
  id: 'invoice-live',
  invoiceNumber: 'INV-LIVE',
  orderId: 'cus-ord-003',
  quoteId: 'quote-live',
  totalAmount: 5_000_000,
  depositAmount: 1_500_000,
  paidAmount: 1_500_000,
  remainingAmount: 3_500_000,
  status: 'PARTIALLY_PAID',
  depositStatus: 'DEPOSIT_PAID',
  issuedAt: '2026-11-01T08:00:00Z',
  finalPaymentAllowed: true,
  finalPaymentExpiresAt: '2026-11-10T08:00:00Z',
}

beforeEach(() => {
  resetMockDb()
  setLanguage('vi')
  // The mock transport has no per-mission delivery list; an order without missions falls back to the single panel.
  vi.spyOn(deliveryApi, 'missionDeliveries').mockResolvedValue([])
})
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

describe('OrderDetailPage', () => {
  it('renders the Vietnamese order-info heading from GET /api/orders/{id}', async () => {
    render(<OrderDetailPage orderId="cus-ord-003" />)
    expect(await screen.findByText('Chi tiết đơn hàng')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: /Tuần tra an ninh khu vực.*Sala/ }),
    ).toBeInTheDocument()
  })

  it('shows the public order code instead of the internal id', async () => {
    render(<OrderDetailPage orderId="cus-ord-003" />)
    await screen.findByText('Chi tiết đơn hàng')

    expect(screen.getByText('ORD-2609-0149')).toBeInTheDocument()
    expect(screen.queryByText('cus-ord-003')).not.toBeInTheDocument()
  })

  it('renders the English order-info heading when language is switched', async () => {
    render(<OrderDetailPage orderId="cus-ord-003" />)
    await screen.findByText('Chi tiết đơn hàng')
    act(() => setLanguage('en'))
    expect(
      await screen.findByRole('heading', { name: 'Order details' }),
    ).toBeInTheDocument()
  })

  it('shows the status with OrderStatusBadge', async () => {
    render(<OrderDetailPage orderId="cus-ord-006" />)
    expect(
      await screen.findByText('Nhiệm vụ đã thực hiện xong', {
        selector: '.mgr-status-tag',
      }),
    ).toBeInTheDocument()
  })

  it('opens completed orders on delivered results before the map and overview', async () => {
    vi.spyOn(deliveryApi, 'get').mockRejectedValueOnce(
      new ApiError('Not found', {
        status: 404,
        method: 'GET',
        path: '/api/orders/cus-ord-006/delivery',
      }),
    )
    render(<OrderDetailPage orderId="cus-ord-006" />)

    expect(
      await screen.findByRole('tab', { name: 'Kết quả bàn giao' }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(
      await screen.findByText('Kết quả giám sát của bạn'),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Đơn hàng chưa có thông tin bàn giao kết quả.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Tổng quan dịch vụ và vị trí' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Trạng thái và bước tiếp theo' }),
    ).not.toBeInTheDocument()
  })

  it('shows the rejection reason from the BE for a rejected order', async () => {
    render(<OrderDetailPage orderId="cus-ord-007" />)
    expect(await screen.findByText('Đơn bị từ chối')).toBeInTheDocument()
    expect(
      screen.getByText(/vùng kiểm soát không lưu sân bay TSN/),
    ).toBeInTheDocument()
  })

  it('offers no cancel action once the order is approved', async () => {
    render(<OrderDetailPage orderId="cus-ord-005" />)
    await screen.findByText('Chi tiết đơn hàng')
    expect(
      screen.queryByRole('button', { name: 'Huỷ đơn hàng' }),
    ).not.toBeInTheDocument()
  })

  it('separates quote review from contract and deposit payment', async () => {
    vi.spyOn(financeApi, 'getQuote').mockResolvedValue(payableQuote)
    vi.spyOn(financeApi, 'getInvoice').mockResolvedValue(payableInvoice)
    render(<OrderDetailPage orderId="cus-ord-003" />)
    fireEvent.click(await screen.findByRole('tab', { name: 'Duyệt & báo giá' }))
    await waitFor(() =>
      expect(
        document.querySelector('.customer-quote-body'),
      ).toBeVisible(),
    )
    expect(document.querySelector('.customer-quote-payment-content')).toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: 'Hợp đồng' }))
    expect(await screen.findByText('Đơn hàng này không yêu cầu hợp đồng.')).toBeVisible()
    expect(document.querySelector('.customer-invoice-summary')).toBeNull()
    expect(document.querySelector('.customer-quote-body')).toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: 'Thanh toán' }))
    await waitFor(() =>
      expect(
        document.querySelector('.customer-invoice-standalone'),
      ).toBeVisible(),
    )
    expect(document.querySelector('.customer-quote-body')).toBeNull()
    expect(screen.getByRole('region', { name: 'Hóa đơn INV-LIVE' })).toBeVisible()
  })

  it('shows a red finance-tab dot until the customer opens the newly approved quote', async () => {
    // The final-payment dot was removed (payments are now per mission); the quote-approval dot remains.
    vi.spyOn(financeApi, 'getQuote').mockResolvedValue({
      ...payableQuote,
      status: 'APPROVED',
      acceptedAt: null,
    })
    vi.spyOn(financeApi, 'getInvoice').mockResolvedValue(payableInvoice)
    render(<OrderDetailPage orderId="cus-ord-003" />)

    const financeTab = await screen.findByRole('tab', {
      name: 'Duyệt & báo giá',
    })
    await waitFor(() =>
      expect(financeTab.querySelector('.ant-badge-dot')).toBeInTheDocument(),
    )

    fireEvent.click(financeTab)
    await waitFor(() =>
      expect(
        financeTab.querySelector('.ant-badge-dot'),
      ).not.toBeInTheDocument(),
    )
  })

  it('shows the order code once, in the header, with a copy button', async () => {
    render(<OrderDetailPage orderId="cus-ord-003" />)
    const info = (await screen.findByText('Chi tiết đơn hàng')).closest(
      'section, .ant-card',
    ) as HTMLElement
    expect(screen.getAllByText('ORD-2609-0149')).toHaveLength(1)
    const code = screen.getByText('ORD-2609-0149')
    expect(code.closest('.od-meta')).not.toBeNull()
    expect(info.contains(code)).toBe(false)
    expect(
      screen.getByRole('button', { name: 'Sao chép mã đơn' }),
    ).toBeInTheDocument()
  })

  it('no longer lists an order-code field in the info card', async () => {
    render(<OrderDetailPage orderId="cus-ord-003" />)
    const info = (await screen.findByText('Chi tiết đơn hàng')).closest(
      'section, .ant-card',
    ) as HTMLElement
    expect(within(info).queryByText('Mã đơn')).not.toBeInTheDocument()
    expect(
      within(info).queryByRole('button', { name: 'Sao chép mã đơn' }),
    ).not.toBeInTheDocument()
  })

  it('shows the localized status in the help hint instead of the raw enum', async () => {
    render(<OrderDetailPage orderId="cus-ord-003" />)
    await screen.findByText('Chi tiết đơn hàng')
    fireEvent.click(await screen.findByRole('tab', { name: 'Hỗ trợ' }))
    const hint = await screen.findByText(
      /Câu hỏi thường gặp gợi ý cho trạng thái/,
    )
    expect(hint).not.toHaveTextContent('PENDING')
    expect(hint).toHaveTextContent(/\(.+\)/)
  })

  it('keeps the removed order progress panel off the detail page', async () => {
    render(<OrderDetailPage orderId="cus-ord-003" />)
    await screen.findByText('Chi tiết đơn hàng')
    expect(screen.queryByText('Tiến trình đơn hàng')).not.toBeInTheDocument()
  })

  it('shows an error with retry when the order is missing', async () => {
    render(<OrderDetailPage orderId="does-not-exist" />)
    expect(
      await screen.findByText('Không tải được đơn hàng'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })
})
