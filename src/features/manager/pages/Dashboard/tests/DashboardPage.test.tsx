import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../../../shared/api/httpClient'
import { managerApi } from '../../../api/dashboardApi'
import type { ManagerDashboardData } from '../../../types/dashboard'
import { DashboardPage } from '../DashboardPage'

const sampleData: ManagerDashboardData = {
  summary: {
    totalOrders: 42,
    totalQuoteValue: 185500000,
    pendingOrderCount: 12,
    pendingAdditionalChecklistCount: 5,
    waitingDepositCount: 4,
    activeMissionCount: 8,
    attentionRequiredCount: 3,
  },
  orderStatusDistribution: [{ key: 'PENDING', count: 12 }, { key: 'COMPLETED', count: 30 }],
  serviceDistribution: [{ serviceId: 'service-1', serviceName: 'Giám sát công trình', count: 18 }],
  additionalServiceDistribution: [{ key: 'NEEDS_MANAGER_REVIEW', count: 5 }, { key: 'ADJUSTED_AND_APPROVED', count: 2 }],
  priceAdjustmentSummary: { approvedAtSystemPrice: 6, adjustedByManager: 2 },
  missionStatusDistribution: [{ key: 'SCHEDULED', count: 4 }, { key: 'COMPLETED', count: 12 }],
  missionTrend: [{ periodStart: '2026-10-22', completed: 3, failed: 1 }],
  actionItems: [
    {
      id: 'checklist-1',
      type: 'ADDITIONAL_CHECKLIST_PRICING',
      priority: 'MEDIUM',
      orderId: 'order-1',
      orderCode: 'ORD-2026-00124',
      missionId: null,
      checklistItemId: 'item-1',
      title: 'Dịch vụ bổ sung chờ duyệt giá',
      description: 'Kiểm tra mái phía sau',
      status: 'NEEDS_MANAGER_REVIEW',
      systemCalculatedAmount: 800000,
      createdAt: '2026-10-22T02:00:00Z',
      actionType: 'REVIEW_PRICING',
    },
  ],
  recentOrders: [
    {
      orderId: 'order-1',
      orderCode: 'ORD-2026-00124',
      customerName: 'Nguyễn A',
      serviceName: 'Giám sát công trình',
      createdAt: '2026-10-22T01:00:00Z',
      status: 'PENDING',
      additionalChecklistCount: 2,
      pendingAdditionalChecklistCount: 1,
      pricingState: 'NEEDS_MANAGER_REVIEW',
    },
  ],
  pricingPipeline: {
    pricingReviewCount: 5,
    quoteReadyCount: 3,
    waitingCustomerCount: 7,
    waitingDepositCount: 4,
    depositPaidCount: 9,
  },
  missionOverview: {
    scheduledCount: 4,
    readyCount: 2,
    inFlightCount: 1,
    returningCount: 1,
    completedTodayCount: 3,
    issueCount: 1,
  },
  activeMissions: [
    {
      missionId: 'mission-1',
      missionCode: 'MIS-001',
      orderId: 'order-1',
      orderCode: 'ORD-2026-00124',
      operatorName: null,
      droneName: null,
      status: 'SCHEDULED',
      scheduledStartAt: '2026-10-22T05:00:00Z',
      attentionRequired: true,
    },
  ],
  recentActivities: [
    {
      id: 'activity-1',
      type: 'PAYMENT_SUCCESS',
      orderId: 'order-1',
      orderCode: 'ORD-2026-00124',
      missionId: null,
      description: 'Đặt cọc cho ORD-2026-00124 đã thành công',
      occurredAt: '2026-10-22T03:00:00Z',
    },
  ],
  generatedAt: '2026-10-22T03:30:00Z',
}

afterEach(() => vi.restoreAllMocks())

describe('DashboardPage', () => {
  it('shows a skeleton before rendering actionable data', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    render(<DashboardPage />)
    expect(screen.getByText('Đang tải bảng điều khiển…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Bảng điều khiển quản lý' })).toBeInTheDocument()
    expect(screen.getByText('Dịch vụ bổ sung chờ duyệt giá')).toBeInTheDocument()
  })

  it('renders all KPI values and useful navigation', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    render(<DashboardPage />)
    await screen.findByRole('heading', { name: 'Bảng điều khiển quản lý' })
    expect(screen.getByRole('link', { name: /Chờ duyệt yêu cầu/ })).toHaveAttribute('href', '#portal/manager/orders')
    expect(screen.getByRole('link', { name: /Nhiệm vụ đang chạy.*8/ })).toHaveAttribute('href', '#portal/manager/missions')
    expect(screen.getByRole('link', { name: /Hoàn thành trong kỳ/ })).toHaveAttribute('href', '#portal/manager/missions')
    expect(screen.getByRole('link', { name: 'Duyệt giá' })).toHaveAttribute('href', '#portal/manager/orders/order-1')
    expect(screen.getByRole('link', { name: 'ORD-2026-00124' })).toHaveAttribute('href', '#portal/manager/orders/order-1')
    expect(screen.getAllByRole('link', { name: 'Xem tất cả' })[1]).toHaveAttribute('href', '#portal/manager/orders')
  })

  it('reloads period analytics when the date-range preset changes', async () => {
    const getDashboard = vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    render(<DashboardPage />)
    await screen.findByRole('heading', { name: 'Trạng thái đơn' })
    expect(getDashboard).toHaveBeenCalledWith('30D', expect.any(AbortSignal))
    fireEvent.click(screen.getByRole('button', { name: '7 ngày' }))
    await waitFor(() => expect(getDashboard).toHaveBeenCalledWith('7D', expect.any(AbortSignal)))
    expect(screen.getByRole('heading', { name: 'Nhiệm vụ theo thời gian' })).toBeInTheDocument()
  })

  it('renders null assignments safely and all operational sections', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    render(<DashboardPage />)
    await screen.findByRole('heading', { name: 'Bảng điều khiển quản lý' })
    expect(screen.getByText(/Chưa phân công/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tiến trình báo giá' })).toBeInTheDocument()
    expect(screen.getByText('Đặt cọc cho ORD-2026-00124 đã thành công')).toBeInTheDocument()
  })

  it('shows a retryable error state', async () => {
    const getDashboard = vi.spyOn(managerApi, 'getDashboard')
      .mockRejectedValueOnce(new ApiError('Lỗi', { status: 500, method: 'GET', path: '/api/manager/dashboard' }))
      .mockResolvedValueOnce(sampleData)
    render(<DashboardPage />)
    expect(await screen.findByText('Không thể tải dữ liệu bảng điều khiển.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole('heading', { name: 'Bảng điều khiển quản lý' })).toBeInTheDocument()
  })

  it('renders professional empty states', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue({
      ...sampleData,
      actionItems: [],
      recentOrders: [],
      activeMissions: [],
      recentActivities: [],
      orderStatusDistribution: [],
      serviceDistribution: [],
      additionalServiceDistribution: [],
      missionStatusDistribution: [],
      missionTrend: [],
    })
    render(<DashboardPage />)
    await screen.findByRole('heading', { name: 'Bảng điều khiển quản lý' })
    expect(screen.getByText('Không có việc nào cần xử lý.')).toBeInTheDocument()
    expect(screen.getByText('Không có nhiệm vụ đang chạy.')).toBeInTheDocument()
    expect(screen.getByText('Chưa có đơn gần đây.')).toBeInTheDocument()
    expect(screen.getByText('Chưa có đơn trong kỳ này.')).toBeInTheDocument()
    expect(screen.getByText('Chưa có nhiệm vụ trong kỳ này.')).toBeInTheDocument()
  })
})
