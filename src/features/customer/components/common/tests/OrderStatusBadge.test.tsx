import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'

import { getLanguage, setLanguage } from '../../../../../shared/i18n'
import type { OrderStatus } from '../../../../../shared/types/domain'
import { ORDER_STATUS_TONE } from '../../../lib/orderStatus'
import { OrderStatusBadge } from '../OrderStatusBadge'

const TONE_CLASS = {
  green: 'ant-tag-success',
  yellow: 'ant-tag-warning',
  orange: 'ant-tag-warning',
  red: 'ant-tag-error',
  blue: 'ant-tag-processing',
  gray: 'ant-tag-default',
} as const

describe('OrderStatusBadge', () => {
  const initial = getLanguage()
  afterEach(() => act(() => setLanguage(initial)))

  it('renders the Vietnamese label with the mapped tone', () => {
    act(() => setLanguage('vi'))
    render(<OrderStatusBadge status="APPROVED" />)
    const badge = screen.getByText('Đã duyệt').closest('.mgr-status-tag')
    expect(badge?.className).toContain('ant-tag-processing')
  })

  it('switches to the English label', () => {
    act(() => setLanguage('en'))
    render(<OrderStatusBadge status="REJECTED" />)
    const badge = screen.getByText('Rejected').closest('.mgr-status-tag')
    expect(badge?.className).toContain('ant-tag-error')
  })

  it('maps every order status to its tone class', () => {
    act(() => setLanguage('en'))
    for (const status of Object.keys(ORDER_STATUS_TONE) as OrderStatus[]) {
      const { container, unmount } = render(<OrderStatusBadge status={status} />)
      expect(container.querySelector('.mgr-status-tag')?.className).toContain(
        TONE_CLASS[ORDER_STATUS_TONE[status]],
      )
      unmount()
    }
  })
})
