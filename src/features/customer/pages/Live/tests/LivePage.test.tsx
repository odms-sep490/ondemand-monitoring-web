import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { customerApi } from '../../../api/customerApi'
import { LivePage } from '../LivePage'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

describe('LivePage', () => {
  it('renders the Vietnamese title and the order from the BE', async () => {
    render(<LivePage orderId="cus-ord-001" />)
    expect(await screen.findByText('Giám sát trực tiếp')).toBeInTheDocument()
    expect(screen.getByText('Đang thực hiện', { selector: '.mgr-status-tag' })).toBeInTheDocument()
    expect(screen.getByText('Xem trực tiếp đang được phát triển')).toBeInTheDocument()
  })

  it('renders the English title when language is switched', async () => {
    render(<LivePage orderId="cus-ord-001" />)
    await screen.findByText('Giám sát trực tiếp')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Live monitoring')).toBeInTheDocument()
  })

  it('links back to the order', async () => {
    render(<LivePage orderId="cus-ord-001" />)
    expect(await screen.findByRole('link', { name: '← Quay lại đơn hàng' })).toHaveAttribute(
      'href',
      '#portal/customer/orders/cus-ord-001',
    )
  })

  it('shows an error with retry and recovers', async () => {
    vi.spyOn(customerApi, 'getOrderById').mockRejectedValueOnce(new Error('boom'))
    render(<LivePage orderId="cus-ord-001" />)
    expect(await screen.findByText('Không tải được đơn hàng')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Giám sát trực tiếp')).toBeInTheDocument()
  })
})
