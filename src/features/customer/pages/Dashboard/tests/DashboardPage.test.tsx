import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { customerApi } from '../../../api/customerApi'
import { customerMissionHistoryApi } from '../../../api/customerMissionHistoryApi'
import { DashboardPage } from '../DashboardPage'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

const stat = (label: string) =>
  screen.getByText(label, { selector: '.mgr-stat-label' }).closest('.mgr-stat') as HTMLElement

const card = (title: string) => screen.getByText(title).closest('.ant-card') as HTMLElement

/** Body rows of the antd table inside a card (header row excluded). */
const tableRows = (el: HTMLElement) => el.querySelectorAll('tbody tr.ant-table-row')

describe('DashboardPage', () => {
  it('renders the Vietnamese title', async () => {
    render(<DashboardPage />)
    expect(await screen.findByText('Tổng quan')).toBeInTheDocument()
  })

  it('renders the English title when language is switched', async () => {
    render(<DashboardPage />)
    await screen.findByText('Tổng quan')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Overview')).toBeInTheDocument()
  })

  it('computes the KPIs from /api/orders/mine', async () => {
    render(<DashboardPage />)
    await screen.findByText('Tổng số đơn')
    expect(within(stat('Tổng số đơn')).getByText('9')).toBeInTheDocument()
    // Legacy draft/submitted statuses map to the BE status PENDING.
    expect(within(stat('Chờ duyệt')).getByText('3')).toBeInTheDocument()
    expect(within(stat('Đang thực hiện')).getByText('1')).toBeInTheDocument()
    expect(within(stat('Hoàn thành')).getByText('1')).toBeInTheDocument()
  })

  it('lists the 5 most recent orders with status badges and a by-status breakdown', async () => {
    render(<DashboardPage />)
    await screen.findByText('Đơn hàng gần đây')
    const recent = card('Đơn hàng gần đây')
    expect(tableRows(recent)).toHaveLength(5)
    expect(within(recent).getByText('Cần thanh toán cọc')).toBeInTheDocument()
    const breakdown = card('Đơn hàng theo trạng thái')
    expect(within(breakdown).getAllByRole('listitem')).toHaveLength(6)
  })

  it('lists recent missions from the mission history', async () => {
    render(<DashboardPage />)
    await screen.findByText('Nhiệm vụ gần đây')
    const missions = card('Nhiệm vụ gần đây')
    expect(await within(missions).findByText('MSN-2609-0131-1', { exact: false })).toBeInTheDocument()
    expect(tableRows(missions)).toHaveLength(3)
  })

  it('shows the empty state when there are no orders', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockResolvedValue([])
    render(<DashboardPage />)
    expect(await screen.findByText('Chưa có đơn hàng nào')).toBeInTheDocument()
    expect(within(stat('Tổng số đơn')).getByText('0')).toBeInTheDocument()
  })

  it('shows an order error with retry and recovers', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockRejectedValueOnce(new Error('boom'))
    render(<DashboardPage />)
    expect(await screen.findByText('Không tải được số liệu đơn hàng')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Tổng số đơn')).toBeInTheDocument()
  })

  it('keeps the orders visible when only the missions fail, with its own retry', async () => {
    vi.spyOn(customerMissionHistoryApi, 'list').mockRejectedValueOnce(new Error('boom'))
    render(<DashboardPage />)
    expect(await screen.findByText('Không tải được nhiệm vụ gần đây')).toBeInTheDocument()
    expect(screen.getByText('Tổng số đơn')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('MSN-2609-0131-1', { exact: false })).toBeInTheDocument()
  })
})
