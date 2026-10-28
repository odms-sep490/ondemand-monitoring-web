import { act } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../../../shared/api/httpClient'
import { setLanguage } from '../../../../../shared/i18n'
import { ordersApi } from '../../../api/ordersApi'
import type { OrderCreateResponse } from '../../../types/orders'
import { OrderQueuePage } from '../OrderQueuePage'
import { financeApi } from '../../../../finance/api'
import type { Invoice } from '../../../../finance/types'
import { planningApi } from '../../../api/planningApi'
import type { MissionResponse } from '../../../types/missions'

const rows: OrderCreateResponse[] = [
  {
    id: 'ord-2609-0157',
    orderCode: 'ORD-2609-0157',
    customerId: 'cust-le-quoc-bao',
    customerName: 'Lê Quốc Bảo',
    title: 'Tuần tra bãi container ngoài giờ',
    serviceId: 'svc-tuan-tra-an-ninh-khu-vuc',
    serviceName: 'Tuần tra an ninh khu vực',
    description: 'Tuần tra an ninh khu vực cảng Cát Lái',
    address: 'Cảng Cát Lái, P. Cát Lái, TP. Thủ Đức',
    longitude: 106.7952,
    latitude: 10.7686,
    coverageArea: null,
    preferredDateFrom: '2026-09-25T13:00:00+07:00',
    preferredDateTo: '2026-09-25T17:00:00+07:00',
    preferredTimeId: 'time-afternoon',
    preferredTimeName: 'Chiều',
    orderStatus: 'PENDING',
    rejectReason: null,
    reviewById: null,
    reviewByName: null,
    reviewAt: null,
    deliverables: [],
    createdAt: '2026-09-19T08:32:00+07:00',
    updatedAt: '2026-09-19T08:32:00+07:00',
  },
  {
    id: 'ord-2609-0160',
    orderCode: 'ORD-2609-0160',
    customerId: 'cust-vo-thanh-tung',
    customerName: 'Võ Thanh Tùng',
    title: 'Tuần tra an ninh khu vực',
    serviceId: 'svc-tuan-tra-an-ninh-khu-vuc',
    serviceName: 'Tuần tra an ninh khu vực',
    description: 'Tuần tra an ninh khu vực',
    address: 'Sóng Thần, Dĩ An',
    longitude: 106.75,
    latitude: 10.9,
    coverageArea: null,
    preferredDateFrom: '2026-09-24T07:00:00+07:00',
    preferredDateTo: '2026-09-24T11:00:00+07:00',
    preferredTimeId: 'time-morning',
    preferredTimeName: 'Sáng',
    orderStatus: 'PENDING',
    rejectReason: null,
    reviewById: null,
    reviewByName: null,
    reviewAt: null,
    deliverables: [],
    createdAt: '2026-09-18T19:32:00+07:00',
    updatedAt: '2026-09-18T19:32:00+07:00',
  },
]

afterEach(() => {
  vi.restoreAllMocks()
})

beforeEach(() => {
  vi.spyOn(ordersApi, 'getApproved').mockResolvedValue([])
  vi.spyOn(financeApi, 'getManagerInvoice').mockRejectedValue(new Error('No invoice'))
  vi.spyOn(planningApi, 'getOrderMissions').mockResolvedValue([])
})

describe('QueuePage', () => {
  it('shows a deposited approved order in the planning queue', async () => {
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue([])
    vi.mocked(ordersApi.getApproved).mockResolvedValue([{ ...rows[0], orderStatus: 'APPROVED' }])
    vi.mocked(financeApi.getManagerInvoice).mockResolvedValue({ paidAmount: 1_000_000, depositAmount: 1_000_000 } as Invoice)
    render(<OrderQueuePage />)
    expect(await screen.findByRole('button', { name: /Chờ lập kế hoạch/ })).toBeInTheDocument()
    expect(screen.getByText('Đã nhận cọc')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lập kế hoạch' })).toHaveAttribute('href', '#portal/manager/orders/ord-2609-0157')
    expect(screen.queryByText('Không còn đơn chờ duyệt')).not.toBeInTheDocument()
  })

  it('does not put an order back in the planning queue after a mission was created', async () => {
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue([])
    vi.mocked(ordersApi.getApproved).mockResolvedValue([{ ...rows[0], orderStatus: 'APPROVED' }])
    vi.mocked(financeApi.getManagerInvoice).mockResolvedValue({ paidAmount: 1_000_000, depositAmount: 1_000_000 } as Invoice)
    vi.mocked(planningApi.getOrderMissions).mockResolvedValue([
      { id: 'mission-1', status: 'WAITING_CREW_CONFIRMATION' } as MissionResponse,
    ])

    render(<OrderQueuePage />)

    expect(await screen.findByText('Không còn đơn chờ duyệt')).toBeInTheDocument()
    expect(screen.getByText('0 đơn chờ duyệt · 0 đơn chờ lập kế hoạch')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Lập kế hoạch' })).not.toBeInTheDocument()
  })

  it('allows planning again when every previous mission was cancelled', async () => {
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue([])
    vi.mocked(ordersApi.getApproved).mockResolvedValue([{ ...rows[0], orderStatus: 'APPROVED' }])
    vi.mocked(financeApi.getManagerInvoice).mockResolvedValue({ paidAmount: 1_000_000, depositAmount: 1_000_000 } as Invoice)
    vi.mocked(planningApi.getOrderMissions).mockResolvedValue([
      { id: 'mission-cancelled', status: 'CANCELLED' } as MissionResponse,
    ])

    render(<OrderQueuePage />)

    expect(await screen.findByRole('link', { name: 'Lập kế hoạch' })).toBeInTheDocument()
  })

  it('shows loading, then the queue rows', async () => {
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue(rows)
    render(<OrderQueuePage />)

    await waitFor(() => screen.getByText('Hàng đợi duyệt đơn'))
    expect(screen.getByText('ORD-2609-0157')).toBeInTheDocument()
    expect(screen.getByText('ORD-2609-0160')).toBeInTheDocument()
    expect(screen.getByText('2 đơn chờ duyệt · 0 đơn chờ lập kế hoạch')).toBeInTheDocument()
  })

  it('shows the error state and retries', async () => {
    const getQueue = vi
      .spyOn(ordersApi, 'getQueue')
      .mockRejectedValueOnce(
        new ApiError('lỗi', { status: 500, method: 'GET', path: '/orders' }),
      )
      .mockResolvedValueOnce(rows)

    render(<OrderQueuePage />)
    await waitFor(() => screen.getByText('Không tải được hàng đợi'))
    expect(getQueue).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => screen.getByText('ORD-2609-0157'))
    expect(getQueue).toHaveBeenCalledTimes(2)
  })

  it('shows the empty state when there are no PENDING orders', async () => {
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue([])
    render(<OrderQueuePage />)
    await waitFor(() => screen.getByText('Không còn đơn chờ duyệt'))
    expect(
      screen.getAllByRole('link', { name: 'Xem nhiệm vụ đã tạo' })[0],
    ).toHaveAttribute('href', '#portal/manager/missions')
  })

  it('renders the English title and summary when language is switched', async () => {
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue(rows)
    render(<OrderQueuePage />)
    await waitFor(() => screen.getByText('Hàng đợi duyệt đơn'))

    act(() => setLanguage('en'))
    expect(screen.getByText('Order review queue')).toBeInTheDocument()
    expect(screen.getByText('2 pending review · 0 ready for planning')).toBeInTheDocument()
  })

  it('keeps every order reachable under "Tất cả đơn hàng" with a status filter', async () => {
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue([])
    vi.mocked(planningApi.getOrderMissions).mockImplementation(async (id: string) =>
      id === 'o-running' ? ([{ status: 'RESOURCE_ASSIGNING' }] as MissionResponse[]) : [],
    )
    vi.spyOn(ordersApi, 'getManaged').mockResolvedValue([
      { ...rows[0], id: 'o-running', orderCode: 'ORD-RUN', orderStatus: 'APPROVED' },
      { ...rows[0], id: 'o-approved', orderCode: 'ORD-A', orderStatus: 'APPROVED' },
      { ...rows[0], id: 'o-done', orderCode: 'ORD-DONE', orderStatus: 'COMPLETED' },
    ])
    render(<OrderQueuePage />)
    fireEvent.click(await screen.findByRole('button', { name: /Tất cả đơn/ }))
    await waitFor(() => screen.getByText('ORD-A'))
    expect(screen.getByText('ORD-DONE')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Đang thực hiện' }))
    expect(screen.getByText('ORD-RUN')).toBeInTheDocument()
    expect(screen.queryByText('ORD-A')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn tất' }))
    expect(screen.queryByText('ORD-RUN')).toBeNull()
    expect(screen.getByText('ORD-DONE')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Xem' })[0]).toHaveAttribute(
      'href',
      '#portal/manager/orders/o-done/results',
    )
  })
})
