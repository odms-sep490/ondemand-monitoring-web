import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { customerMissionHistoryApi } from '../../../api/customerMissionHistoryApi'
import { customerHref, parseCustomerRoute } from '../../../routes'
import { MissionHistoryPage } from '../MissionHistoryPage'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

const page = (over = {}) => ({
  items: [],
  page: 0,
  totalItems: 0,
  totalPages: 0,
  first: true,
  last: true,
  ...over,
})

describe('MissionHistoryPage', () => {
  it('supports the history list and detail routes', () => {
    expect(parseCustomerRoute(customerHref({ screen: 'missionHistory' }))).toEqual({
      screen: 'missionHistory',
    })
    expect(
      parseCustomerRoute(customerHref({ screen: 'missionHistoryDetail', missionId: 'mission' })),
    ).toEqual({ screen: 'missionHistoryDetail', missionId: 'mission' })
  })

  it('renders the Vietnamese and English titles', async () => {
    render(<MissionHistoryPage />)
    expect(await screen.findByText('Lịch sử lần bay')).toBeInTheDocument()
    act(() => setLanguage('en'))
    expect(await screen.findByText('Mission history')).toBeInTheDocument()
  })

  it('lists the BE missions with status badges and links to the detail page', async () => {
    render(<MissionHistoryPage />)
    const row = (await screen.findByText('MSN-2609-0131-1')).closest('tr') as HTMLElement
    expect(within(row).getByText('Hoàn thành', { selector: '.mgr-status-tag' })).toBeInTheDocument()
    expect(within(row).getByRole('link', { name: 'Xem chi tiết và kết quả' })).toHaveAttribute(
      'href',
      '#portal/customer/mission-history/msn-006-1',
    )
    expect(screen.getByText('Thất bại', { selector: '.mgr-status-tag' })).toBeInTheDocument()
    expect(screen.getByText('3 lần bay')).toBeInTheDocument()
  })

  it('pages through the history', async () => {
    const mission = {
      id: 'm-x',
      missionCode: 'MSN-X',
      orderId: 'o',
      orderTitle: 'Order X',
      address: null,
      status: 'COMPLETED' as const,
      scheduledStartAt: null,
      startedAt: null,
      completedAt: null,
      description: null,
    }
    const list = vi.spyOn(customerMissionHistoryApi, 'list')
    list.mockResolvedValueOnce(page({ items: [mission], totalItems: 30, totalPages: 2, last: false }))
    list.mockResolvedValueOnce(
      page({ items: [{ ...mission, id: 'm-y', missionCode: 'MSN-Y' }], page: 1, totalItems: 30, totalPages: 2, first: false }),
    )
    render(<MissionHistoryPage />)
    await screen.findByText('MSN-X')
    expect(screen.getByText('Trang 1 / 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    expect(await screen.findByText('MSN-Y')).toBeInTheDocument()
    expect(list).toHaveBeenLastCalledWith(1, expect.any(AbortSignal))
  })

  it('shows the empty state', async () => {
    vi.spyOn(customerMissionHistoryApi, 'list').mockResolvedValue(page())
    render(<MissionHistoryPage />)
    expect(await screen.findByText('Chưa có lần bay nào')).toBeInTheDocument()
  })

  it('retries a failed history request', async () => {
    vi.spyOn(customerMissionHistoryApi, 'list').mockRejectedValueOnce(new Error('Offline'))
    render(<MissionHistoryPage />)
    expect(await screen.findByText('Không tải được lịch sử lần bay')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('MSN-2609-0131-1')).toBeInTheDocument()
  })
})
