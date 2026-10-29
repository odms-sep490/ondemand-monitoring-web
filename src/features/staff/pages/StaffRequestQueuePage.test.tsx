import { act } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { StaffRequestQueuePage } from './StaffRequestQueuePage'

vi.mock('../../customer/api/orderApi', () => ({
  orderApi: {
    getPendingOrders: vi.fn().mockResolvedValue([]),
    approveOrder: vi.fn(),
  },
}))

describe('StaffRequestQueuePage', () => {
  it('renders the Vietnamese title and empty state', async () => {
    render(<StaffRequestQueuePage />)
    expect(
      await screen.findByText('Không có đơn nào trong hàng chờ.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Xem lại các yêu cầu giám sát mới gửi và duyệt để tạo nhiệm vụ.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Đơn chờ duyệt')).toBeInTheDocument()
  })

  it('renders the English title and empty state when language is switched', async () => {
    render(<StaffRequestQueuePage />)
    await screen.findByText('Không có đơn nào trong hàng chờ.')
    act(() => setLanguage('en'))
    expect(
      screen.getByText('No pending orders in the queue.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Review incoming monitoring requests and approve them to create missions.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Pending Orders')).toBeInTheDocument()
  })
})
