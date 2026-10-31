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
