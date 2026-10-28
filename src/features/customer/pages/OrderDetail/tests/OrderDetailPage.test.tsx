import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { OrderDetailPage } from '../OrderDetailPage'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

describe('OrderDetailPage', () => {
  it('renders the Vietnamese order-info heading from GET /api/orders/{id}', async () => {
    render(<OrderDetailPage orderId="cus-ord-003" />)
    expect(await screen.findByText('Chi tiết đơn hàng')).toBeInTheDocument()
    expect(screen.getByText('Tuần tra an ninh công trường Sala Riverside')).toBeInTheDocument()
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
    expect(await screen.findByText('Order details')).toBeInTheDocument()
  })

  it('shows the status with OrderStatusBadge', async () => {
    render(<OrderDetailPage orderId="cus-ord-006" />)
    expect(await screen.findByText('Hoàn thành', { selector: '.mgr-status-tag' })).toBeInTheDocument()
  })

  it('shows the rejection reason from the BE for a rejected order', async () => {
    render(<OrderDetailPage orderId="cus-ord-007" />)
    expect(await screen.findByText('Đơn bị từ chối')).toBeInTheDocument()
    expect(screen.getByText(/vùng kiểm soát không lưu sân bay TSN/)).toBeInTheDocument()
  })

  it('offers no cancel action once the order is approved', async () => {
    render(<OrderDetailPage orderId="cus-ord-005" />)
    await screen.findByText('Chi tiết đơn hàng')
    expect(screen.queryByRole('button', { name: 'Huỷ đơn hàng' })).not.toBeInTheDocument()
  })

  it('shows the order code once, in the header, with a copy button', async () => {
    render(<OrderDetailPage orderId="cus-ord-003" />)
    const info = (await screen.findByText('Chi tiết đơn hàng')).closest('section, .ant-card') as HTMLElement
    expect(screen.getAllByText('ORD-2609-0149')).toHaveLength(1)
    const code = screen.getByText('ORD-2609-0149')
    expect(code.closest('.od-meta')).not.toBeNull()
    expect(info.contains(code)).toBe(false)
    expect(screen.getByRole('button', { name: 'Sao chép mã đơn' })).toBeInTheDocument()
  })

  it('no longer lists an order-code field in the info card', async () => {
    render(<OrderDetailPage orderId="cus-ord-003" />)
    const info = (await screen.findByText('Chi tiết đơn hàng')).closest('section, .ant-card') as HTMLElement
    expect(within(info).queryByText('Mã đơn')).not.toBeInTheDocument()
    expect(within(info).queryByRole('button', { name: 'Sao chép mã đơn' })).not.toBeInTheDocument()
  })

  it('shows the localized status in the help hint instead of the raw enum', async () => {
    render(<OrderDetailPage orderId="cus-ord-003" />)
    await screen.findByText('Chi tiết đơn hàng')
    const hint = await screen.findByText(/Câu hỏi thường gặp gợi ý cho trạng thái/)
    expect(hint).not.toHaveTextContent('PENDING')
    expect(hint).toHaveTextContent(/\(.+\)/)
  })

  it('shows the full progress flow for a pending order with the approval step as current', async () => {
    render(<OrderDetailPage orderId="cus-ord-003" />)
    const heading = await screen.findByText('Tiến trình đơn hàng')
    const list = within(heading.closest('section, .ant-card') as HTMLElement).getByRole('list')
    const steps = within(list).getAllByRole('listitem')
    expect(steps).toHaveLength(7)
    expect(within(steps[0]).getByText('Gửi yêu cầu')).toBeInTheDocument()
    expect(within(steps[1]).getByText('Duyệt đơn')).toBeInTheDocument()
    expect(steps[1]).toHaveAttribute('aria-current', 'step')
    expect(within(steps[1]).getByText('Đang chờ duyệt')).toBeInTheDocument()
    expect(steps.filter((step) => step.hasAttribute('aria-current'))).toHaveLength(1)
    expect(within(steps[2]).getByText('Xác nhận báo giá')).toBeInTheDocument()
    expect(within(steps[3]).getByText('Thanh toán tiền cọc')).toBeInTheDocument()
    expect(steps[6]).toHaveClass('is-upcoming')
  })

  it('ends a rejected order at a failed step with no upcoming steps', async () => {
    render(<OrderDetailPage orderId="cus-ord-007" />)
    const heading = await screen.findByText('Tiến trình đơn hàng')
    const steps = within(within(heading.closest('section, .ant-card') as HTMLElement).getByRole('list')).getAllByRole('listitem')
    expect(steps).toHaveLength(2)
    expect(steps[1]).toHaveClass('is-failed')
    expect(within(steps[1]).getByText('Bị từ chối')).toBeInTheDocument()
    expect(steps.some((step) => step.classList.contains('is-upcoming'))).toBe(false)
    expect(steps.some((step) => step.hasAttribute('aria-current'))).toBe(false)
  })

  it('shows an error with retry when the order is missing', async () => {
    render(<OrderDetailPage orderId="does-not-exist" />)
    expect(await screen.findByText('Không tải được đơn hàng')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })
})
