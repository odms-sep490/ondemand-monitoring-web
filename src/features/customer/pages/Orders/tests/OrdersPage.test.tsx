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
import { customerApi } from '../../../api/customerApi'
import type { OrderCreateResponse } from '../../../api/orderApi'
import { OrdersPage } from '../OrdersPage'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

const makeOrder = (n: number): OrderCreateResponse => ({
  id: `ord-${n}`,
  customerId: 'c',
  title: `Order number ${n}`,
  orderStatus: 'PENDING',
  createdAt: `2026-09-${String(n).padStart(2, '0')}T00:00:00Z`,
})

const rowsOf = () =>
  within(screen.getByRole('table')).getAllByRole('row').slice(1)

describe('OrdersPage', () => {
  it('renders the Vietnamese title and BE orders from /api/orders/mine', async () => {
    render(<OrdersPage />)
    expect(screen.getByText('Đơn của tôi')).toBeInTheDocument()
    expect(
      await screen.findByText('Kiểm tra tiến độ nhà xưởng KCN Hiệp Phước'),
    ).toBeInTheDocument()
    expect(rowsOf()).toHaveLength(9)
  })

  it('renders the English title when language is switched', async () => {
    render(<OrdersPage />)
    await screen.findByRole('table')
    act(() => setLanguage('en'))
    expect(screen.getByText('My orders')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Completed' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: 'Preferred schedule' }),
    ).toBeInTheDocument()
  })

  it('shows the status with OrderStatusBadge', async () => {
    render(<OrdersPage />)
    await screen.findByRole('table')
    expect(
      within(screen.getByRole('table')).getByText('Bị từ chối'),
    ).toBeInTheDocument()
  })

  it('calls out the required customer action for an approved order', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockResolvedValue([
      { ...makeOrder(1), orderStatus: 'APPROVED', depositSatisfied: false },
    ])
    render(<OrdersPage />)
    expect(await screen.findByText('Đã duyệt')).toBeInTheDocument()
    expect(screen.getByText('Cần xác nhận & thanh toán')).toBeInTheDocument()
  })

  it('shows the paid state instead of a payment warning after the deposit is received', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockResolvedValue([
      { ...makeOrder(1), orderStatus: 'APPROVED', depositSatisfied: true },
    ])
    render(<OrdersPage />)
    expect(await screen.findByText('Đã thanh toán cọc')).toBeInTheDocument()
    expect(
      screen.queryByText('Cần xác nhận & thanh toán'),
    ).not.toBeInTheDocument()
  })

  it('shows a direct action and filter for orders waiting for customer information', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockResolvedValue([
      { ...makeOrder(1), orderStatus: 'NEEDS_INFO' },
    ])
    render(<OrdersPage />)
    expect(await screen.findByText('Cần bổ sung thông tin')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bổ sung ngay' })).toHaveAttribute(
      'href',
      '#portal/customer/orders/ord-1',
    )
    expect(
      screen.getByRole('button', { name: 'Cần bổ sung thông tin' }),
    ).toBeInTheDocument()
  })

  it('sends the status filter to the BE', async () => {
    const spy = vi.spyOn(customerApi, 'listMyOrders')
    render(<OrdersPage />)
    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành' }))
    await waitFor(() => expect(rowsOf()).toHaveLength(1))
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'COMPLETED' }),
    )
    expect(screen.getByRole('button', { name: 'Hoàn thành' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('searches client-side and shows a filtered empty state that can be cleared', async () => {
    render(<OrdersPage />)
    await screen.findByRole('table')
    const search = screen.getByRole('searchbox', { name: 'Tìm đơn hàng' })
    fireEvent.change(search, { target: { value: 'cát lái' } })
    expect(rowsOf()).toHaveLength(1)
    fireEvent.change(search, { target: { value: 'không có đơn nào như vậy' } })
    expect(
      screen.getByText('Không có đơn nào khớp bộ lọc hiện tại.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xoá bộ lọc' }))
    expect(await screen.findAllByRole('row')).toHaveLength(10)
  })

  it('pages client-side, 10 orders per page', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => makeOrder(i + 1)),
    )
    render(<OrdersPage />)
    await screen.findByRole('table')
    expect(rowsOf()).toHaveLength(10)
    expect(screen.getByText('Trang 1 / 3')).toBeInTheDocument()
    expect(screen.getByText('Tổng 25 đơn')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sau' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sau' }))
    expect(screen.getByText('Trang 3 / 3')).toBeInTheDocument()
    expect(rowsOf()).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Sau' })).toBeDisabled()
  })

  it('shows the empty state with a create link when there are no orders', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockResolvedValue([])
    render(<OrdersPage />)
    expect(
      await screen.findByText('Bạn chưa gửi yêu cầu giám sát nào.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Tạo yêu cầu giám sát' }),
    ).toHaveAttribute('href', '#portal/customer/orders/new')
  })

  it('keeps accessible names with decorative icons and a searchbox', async () => {
    render(<OrdersPage />)
    await screen.findByRole('table')
    const create = screen.getByRole('link', { name: 'Tạo yêu cầu' })
    expect(create.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    const views = within(screen.getByRole('table')).getAllByRole('link', {
      name: 'Xem chi tiết',
    })
    expect(views).toHaveLength(9)
    views.forEach((link) =>
      expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true'),
    )
    expect(
      screen.getByRole('searchbox', { name: 'Tìm đơn hàng' }),
    ).toBeInTheDocument()
  })

  it('shows summary stats for the seeded orders and counts on chips without changing their names', async () => {
    render(<OrdersPage />)
    await screen.findByRole('table')
    const stats = await waitFor(() => {
      const el = document.querySelector('.ord-stats')
      expect(el).not.toBeNull()
      return el as HTMLElement
    })
    expect(
      within(stats).getByText('Tổng số đơn').nextElementSibling,
    ).toHaveTextContent('9')
    expect(stats.querySelectorAll('.ui-stat')).toHaveLength(4)
    expect(
      screen
        .getByRole('button', { name: 'Hoàn thành' })
        .querySelector('.ord-chip-count'),
    ).toHaveAttribute('aria-hidden', 'true')
    expect(
      screen
        .getByRole('button', { name: 'Tất cả' })
        .querySelector('.ord-chip-count'),
    ).toHaveTextContent('9')
  })

  it('hides the pager nav on a single page and shows it with several pages', async () => {
    render(<OrdersPage />)
    await screen.findByRole('table')
    expect(screen.getByText('Tổng 9 đơn')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Sau' }),
    ).not.toBeInTheDocument()
  })

  it('shows a no-match title when a search finds nothing', async () => {
    render(<OrdersPage />)
    await screen.findByRole('table')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm đơn hàng' }), {
      target: { value: 'không có đơn nào như vậy' },
    })
    expect(screen.getByText('Không tìm thấy đơn phù hợp')).toBeInTheDocument()
    expect(screen.queryByText('Chưa có đơn hàng')).not.toBeInTheDocument()
  })

  it('shows the pager nav with 25 orders', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => makeOrder(i + 1)),
    )
    render(<OrdersPage />)
    await screen.findByRole('table')
    expect(screen.getByRole('button', { name: 'Trước' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Sau' })).toBeEnabled()
  })

  it('shows an error with retry and recovers', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockRejectedValueOnce(
      new Error('boom'),
    )
    render(<OrdersPage />)
    expect(
      await screen.findByText('Không tải được danh sách đơn'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })
})
