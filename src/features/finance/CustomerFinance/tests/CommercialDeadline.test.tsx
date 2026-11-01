import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QuoteSection } from '../components/QuoteSection'
import type { CustomerQuote } from '../../types'

const quote: CustomerQuote = {
  id: 'q1',
  orderId: 'o1',
  version: 1,
  status: 'APPROVED',
  estimatedBaseAmount: 1_000_000,
  approvedAdditionalServiceAmount: 0,
  finalOrderAmount: 1_000_000,
  pricingFinalized: true,
  approvedAt: '2026-11-01T03:00:00Z',
  acceptedAt: null,
  items: [],
}

describe('commercial deadline presentation', () => {
  afterEach(() => vi.useRealTimers())

  it.each([3, 10])(
    'keeps the service list and cost summary structured with %i checklist items',
    (count) => {
      const items = Array.from({ length: count }, (_, index) => ({
        id: `item-${index + 1}`,
        orderChecklistItemId: `checklist-${index + 1}`,
        type: 'CHECKLIST' as const,
        description:
          index === 0
            ? 'Kiểm tra khu vực phía sau nhà xưởng có chiều dài mô tả rất dài để xác nhận nội dung vẫn xuống dòng an toàn'
            : `Hạng mục giám sát ${index + 1}`,
        quantity: 1,
        unitPrice: 250_000,
        amount: 250_000,
        displayOrder: index,
      }))
      const { container } = render(
        <QuoteSection
          quote={{ ...quote, items }}
          legalReady
          legalStatus="APPROVED"
          invoice={null}
          busy={false}
          accept={vi.fn()}
        />,
      )

      expect(container.querySelectorAll('.customer-quote-group')).toHaveLength(
        count,
      )
      expect(
        screen.getByRole('region', { name: 'Dịch vụ' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('region', { name: 'Tổng kết chi phí' }),
      ).toBeInTheDocument()
      expect(
        screen.getByText('Báo giá chưa có thời hạn chấp nhận'),
      ).toBeInTheDocument()
      expect(
        screen.getAllByText(
          'Kiểm tra khu vực phía sau nhà xưởng có chiều dài mô tả rất dài để xác nhận nội dung vẫn xuống dòng an toàn',
        ),
      ).toHaveLength(2)
    },
  )

  it('keeps multiple order-level add-ons inside one expandable price group', () => {
    const items = Array.from({ length: 3 }, (_, index) => ({
      id: `addon-${index + 1}`,
      orderChecklistItemId: null,
      type: 'ADDITIONAL' as const,
      description: `Dịch vụ bổ sung ${index + 1}`,
      quantity: 1,
      unitPrice: 100_000,
      amount: 100_000,
      displayOrder: index,
    }))
    const { container } = render(
      <QuoteSection
        quote={{ ...quote, items, approvedAdditionalServiceAmount: 300_000 }}
        legalReady
        legalStatus="APPROVED"
        invoice={null}
        busy={false}
        accept={vi.fn()}
      />,
    )

    expect(container.querySelectorAll('.customer-quote-group')).toHaveLength(1)
    expect(screen.getByText('Theo đơn hàng')).toBeInTheDocument()
    expect(screen.getByText('Dịch vụ bổ sung 3')).toBeInTheDocument()
  })

  it('disables stale acceptance and asks the backend to refresh when the countdown reaches zero', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-03T02:59:59Z'))
    const refresh = vi.fn()
    render(
      <QuoteSection
        quote={{ ...quote, expiresAt: '2026-11-03T03:00:00Z' }}
        legalReady
        legalStatus="APPROVED"
        invoice={null}
        busy={false}
        accept={vi.fn()}
        refreshExpired={refresh}
      />,
    )
    expect(screen.getByRole('button')).toBeEnabled()
    act(() => {
      vi.advanceTimersByTime(1_100)
    })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(
      screen.getByText(/Báo giá đã hết hạn|Quotation expired/),
    ).toBeInTheDocument()
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('shows and updates seconds while more than one hour remains', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-03T02:00:00Z'))
    render(
      <QuoteSection
        quote={{ ...quote, expiresAt: '2026-11-03T03:30:45Z' }}
        legalReady
        legalStatus="APPROVED"
        invoice={null}
        busy={false}
        accept={vi.fn()}
      />,
    )

    expect(screen.getByText('1 giờ 30 phút 45 giây')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(screen.getByText('1 giờ 30 phút 44 giây')).toBeInTheDocument()
  })

  it('stops showing the quote-acceptance countdown after the customer accepts', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-04T03:00:00Z'))
    const refresh = vi.fn()
    render(
      <QuoteSection
        quote={{
          ...quote,
          status: 'ACCEPTED_BY_CUSTOMER',
          acceptedAt: '2026-11-03T02:00:00Z',
          expiresAt: '2026-11-03T03:00:00Z',
        }}
        legalReady
        legalStatus="APPROVED"
        invoice={null}
        busy={false}
        accept={vi.fn()}
        refreshExpired={refresh}
      />,
    )

    expect(
      screen.queryByText(/Báo giá hết hạn sau|Quotation expires in/),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(/Báo giá đã hết hạn|Quotation expired/),
    ).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(refresh).not.toHaveBeenCalled()
  })
})
