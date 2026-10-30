import { describe, expect, it } from 'vitest'

import type { OrderDetailView } from '../../../lib/orders/types'
import { getDisplayTitle } from './OrderHeader'

describe('getDisplayTitle', () => {
  it('builds a title from real order fields when the provided title is one character', () => {
    const order = {
      title: 'f',
      serviceName: 'Giám sát công trình',
      address: 'Khu công nghiệp',
      code: 'ORD-123',
    } as OrderDetailView

    expect(getDisplayTitle(order, 'Chi tiết đơn hàng')).toBe(
      'Giám sát công trình · Khu công nghiệp · #ORD-123',
    )
  })

  it('keeps meaningful short titles and falls back to localized copy when context is absent', () => {
    expect(
      getDisplayTitle({ title: 'AI' } as OrderDetailView, 'Order details'),
    ).toBe('AI')
    expect(
      getDisplayTitle({ title: '!' } as OrderDetailView, 'Order details'),
    ).toBe('Order details')
  })
})
