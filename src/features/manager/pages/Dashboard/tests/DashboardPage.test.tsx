import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../../../shared/api/httpClient'
import { managerApi } from '../../../api/dashboardApi'
import type {
  ManagerDashboardData,
  ManagerDashboardResponse,
} from '../../../types/dashboard'
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
  orderStatusDistribution: [
    { key: 'PENDING', count: 12 },
    { key: 'COMPLETED', count: 30 },
  ],
  serviceDistribution: [
    { serviceId: 'service-1', serviceName: 'Giám sát công trình', count: 18 },
  ],
  additionalServiceDistribution: [
    { key: 'NEEDS_MANAGER_REVIEW', count: 5 },
    { key: 'ADJUSTED_AND_APPROVED', count: 2 },
  ],
  priceAdjustmentSummary: { approvedAtSystemPrice: 6, adjustedByManager: 2 },
  missionStatusDistribution: [
    { key: 'SCHEDULED', count: 4 },
    { key: 'COMPLETED', count: 12 },
  ],
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
    expect(
      await screen.findByRole('heading', { name: 'Bảng điều khiển quản lý' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Dịch vụ bổ sung chờ duyệt giá'),
    ).toBeInTheDocument()
  })

  it('renders all KPI values and useful navigation', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    render(<DashboardPage />)
    await screen.findByRole('heading', { name: 'Bảng điều khiển quản lý' })
    expect(
      screen.getByRole('link', { name: /Chờ duyệt yêu cầu/ }),
    ).toHaveAttribute('href', '#portal/manager/orders')
    expect(
      screen.getByRole('link', { name: /Nhiệm vụ đang chạy.*8/ }),
    ).toHaveAttribute('href', '#portal/manager/missions')
    expect(
      screen.getByRole('link', { name: /Hoàn thành trong kỳ/ }),
    ).toHaveAttribute('href', '#portal/manager/missions')
    expect(screen.getByRole('link', { name: 'Duyệt giá' })).toHaveAttribute(
      'href',
      '#portal/manager/orders/order-1',
    )
    expect(
      screen.getByRole('link', { name: 'ORD-2026-00124' }),
    ).toHaveAttribute('href', '#portal/manager/orders/order-1')
    expect(
      screen
        .getAllByRole('link', { name: 'Xem tất cả' })
        .some((link) => link.getAttribute('href') === '#portal/manager/orders'),
    ).toBe(true)
  })

  it('reloads period analytics when the date-range preset changes', async () => {
    const getDashboard = vi
      .spyOn(managerApi, 'getDashboard')
      .mockResolvedValue(sampleData)
    render(<DashboardPage />)
    await screen.findByRole('heading', { name: 'Trạng thái đơn' })
    expect(getDashboard).toHaveBeenCalledWith('30D', expect.any(AbortSignal))
    fireEvent.click(screen.getByRole('button', { name: '7 ngày' }))
    await waitFor(() =>
      expect(getDashboard).toHaveBeenCalledWith('7D', expect.any(AbortSignal)),
    )
    expect(
      screen.getByRole('heading', { name: 'Nhiệm vụ theo thời gian' }),
    ).toBeInTheDocument()
  })

  it('renders null assignments safely and all operational sections', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    render(<DashboardPage />)
    await screen.findByRole('heading', { name: 'Bảng điều khiển quản lý' })
    expect(screen.getByText(/Chưa phân công/)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Tiến trình báo giá' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Đặt cọc cho ORD-2026-00124 đã thành công'),
    ).toBeInTheDocument()
  })

  it('places dashboard widgets in a balanced two-column grid', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    render(<DashboardPage />)
    await screen.findByRole('heading', { name: 'Bảng điều khiển quản lý' })

    const layout = document.querySelector('.mgr-dash-columns')
    expect(layout?.children).toHaveLength(7)
    expect(layout?.children[0]).toHaveClass('mgr-action-card')
    expect(layout?.children[1]).toHaveClass('mgr-mission-status-card')
    expect(layout?.children[2]).toHaveClass('mgr-mission-trend-card')
    expect(layout?.children[3]).toHaveClass('mgr-recent-orders-card')
    expect(layout?.children[4]).toHaveClass('mgr-pipeline-card')
    expect(layout?.children[5]).toHaveClass('mgr-activity-card')
    expect(layout?.children[6]).toHaveClass('mgr-analytics')
    expect(document.querySelector('.mgr-analytics')).toBeInTheDocument()
  })

  it('shows the Vietnamese label for an order under review', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue({
      ...sampleData,
      recentOrders: [
        { ...sampleData.recentOrders[0], status: 'UNDER_REVIEW' },
      ],
    })

    render(<DashboardPage />)
    await screen.findByRole('heading', { name: 'Bảng điều khiển quản lý' })

    expect(screen.getByText('Đang duyệt')).toBeInTheDocument()
  })

  it('shows a retryable error state', async () => {
    const getDashboard = vi
      .spyOn(managerApi, 'getDashboard')
      .mockRejectedValueOnce(
        new ApiError('Lỗi', {
          status: 500,
          method: 'GET',
          path: '/api/manager/dashboard',
        }),
      )
      .mockResolvedValueOnce(sampleData)
    render(<DashboardPage />)
    expect(
      await screen.findByText('Không thể tải dữ liệu bảng điều khiển.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(2))
    expect(
      await screen.findByRole('heading', { name: 'Bảng điều khiển quản lý' }),
    ).toBeInTheDocument()
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
      priceAdjustmentSummary: {
        approvedAtSystemPrice: 0,
        adjustedByManager: 0,
      },
      missionStatusDistribution: [],
      missionTrend: [],
    })
    render(<DashboardPage />)
    await screen.findByRole('heading', { name: 'Bảng điều khiển quản lý' })
    expect(screen.getByText('Không có việc nào cần xử lý.')).toBeInTheDocument()
    expect(screen.getByText('Không có nhiệm vụ đang chạy.')).toBeInTheDocument()
    expect(screen.getByText('Chưa có đơn gần đây.')).toBeInTheDocument()
    expect(document.querySelector('.mgr-orders-empty-state')).toHaveAttribute(
      'role',
      'status',
    )
    expect(
      document.querySelector('.mgr-recent-orders-card .ant-table'),
    ).toBeNull()
    expect(
      screen.getByText('Chưa có dữ liệu phân tích trong khoảng thời gian này.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Nhiệm vụ theo thời gian' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Chưa có nhiệm vụ trong kỳ này.')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Trạng thái đơn' }),
    ).not.toBeInTheDocument()
  })

  it('distinguishes omitted dashboard fields from real zero values', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue({
      pricingPipeline: {
        pricingReviewCount: 0,
        quoteReadyCount: 0,
        waitingCustomerCount: 0,
        waitingDepositCount: 0,
        depositPaidCount: 0,
      },
    } satisfies ManagerDashboardResponse)

    render(<DashboardPage />)
    await screen.findByRole('heading', { name: 'Bảng điều khiển quản lý' })

    expect(
      screen.getByRole('link', {
        name: 'Chờ duyệt yêu cầu: Chưa có dữ liệu',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Chờ báo giá: 0' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Số liệu yêu cầu chờ xem xét chưa sẵn sàng.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Chưa tải được danh sách việc cần làm.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Chưa tải được danh sách đơn hàng.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Chưa tải được hoạt động gần đây.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Chưa có dữ liệu báo giá.'),
    ).toBeInTheDocument()
    expect(document.querySelector('.mgr-chart-empty')).toHaveTextContent(
      'Chưa tải được dữ liệu phân tích.',
    )
    expect(document.querySelector('.mgr-analytics-empty')).toHaveTextContent(
      'Chưa tải được dữ liệu phân tích.',
    )
  })

  it('keeps one-order dashboards compact when missions and activity are empty', async () => {
    const customerName =
      'Công ty khảo sát địa hình và giám sát công trình miền Tây rất dài'
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue({
      ...sampleData,
      actionItems: [],
      recentOrders: [{ ...sampleData.recentOrders[0], customerName }],
      activeMissions: [],
      recentActivities: [],
      orderStatusDistribution: [{ key: 'PENDING', count: 1 }],
      serviceDistribution: [
        {
          serviceId: 'service-one',
          serviceName: 'Giám sát công trình',
          count: 1,
        },
      ],
      additionalServiceDistribution: [],
      missionStatusDistribution: [],
      missionTrend: [{ periodStart: '2026-10-22', completed: 1, failed: 0 }],
      priceAdjustmentSummary: {
        approvedAtSystemPrice: 0,
        adjustedByManager: 0,
      },
      pricingPipeline: {
        pricingReviewCount: 0,
        quoteReadyCount: 0,
        waitingCustomerCount: 0,
        waitingDepositCount: 0,
        depositPaidCount: 0,
      },
    })

    render(<DashboardPage />)

    expect(await screen.findByText(customerName)).toBeInTheDocument()
    expect(screen.getByText('Không có nhiệm vụ đang chạy.')).toBeInTheDocument()
    expect(document.querySelector('.mgr-activity-empty')).toHaveTextContent(
      'Chưa có hoạt động',
    )
    expect(document.querySelectorAll('.mgr-single-chart')).toHaveLength(2)
    expect(document.querySelector('.mgr-single-trend')).toBeInTheDocument()
    expect(document.querySelectorAll('.ant-table-row')).toHaveLength(1)
  })

  it('shows a running mission beside its order when activity is empty', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue({
      ...sampleData,
      recentActivities: [],
    })
    render(<DashboardPage />)

    expect(await screen.findByText('MIS-001')).toBeInTheDocument()
    expect(document.querySelector('.mgr-activity-empty')).toHaveTextContent(
      'Chưa có hoạt động',
    )
    expect(document.querySelectorAll('.ant-table-row')).toHaveLength(1)
  })

  it('caps recent lists while preserving long text when data is uneven', async () => {
    const longCustomerName =
      'Công ty TNHH tư vấn, khảo sát và giám sát xây dựng khu vực phía Tây'
    const longActionTitle =
      'Yêu cầu cần đối chiếu phạm vi khảo sát và lịch bay trước khi duyệt'
    const order = sampleData.recentOrders[0]
    const activity = sampleData.recentActivities[0]
    const recentOrders = Array.from({ length: 10 }, (_, index) => ({
      ...order,
      orderId: `order-${index + 1}`,
      orderCode: `ORD-2026-${String(index + 1).padStart(5, '0')}`,
      customerName: index === 0 ? longCustomerName : `Khách hàng ${index + 1}`,
    }))
    const recentActivities = Array.from({ length: 2 }, (_, index) => ({
      ...activity,
      id: `activity-${index + 1}`,
      description: `Hoạt động ${index + 1}`,
    }))

    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue({
      ...sampleData,
      actionItems: [{ ...sampleData.actionItems[0], title: longActionTitle }],
      recentOrders,
      recentActivities,
    })
    render(<DashboardPage />)

    expect(await screen.findByText(longCustomerName)).toBeInTheDocument()
    expect(screen.getByText(longActionTitle)).toBeInTheDocument()
    expect(document.querySelectorAll('.ant-table-row')).toHaveLength(6)
    expect(document.querySelectorAll('.mgr-activity-list > li')).toHaveLength(2)
  })

  it('caps long dashboard lists and lets managers expand all action items', async () => {
    const order = sampleData.recentOrders[0]
    const mission = sampleData.activeMissions[0]
    const activity = sampleData.recentActivities[0]
    const action = sampleData.actionItems[0]
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue({
      ...sampleData,
      actionItems: Array.from({ length: 12 }, (_, index) => ({
        ...action,
        id: `action-${index + 1}`,
        title: `Việc cần xử lý ${index + 1}`,
      })),
      recentOrders: Array.from({ length: 10 }, (_, index) => ({
        ...order,
        orderId: `order-${index + 1}`,
        orderCode: `ORD-${index + 1}`,
      })),
      activeMissions: Array.from({ length: 9 }, (_, index) => ({
        ...mission,
        missionId: `mission-${index + 1}`,
        missionCode: `MS-${index + 1}`,
      })),
      recentActivities: Array.from({ length: 12 }, (_, index) => ({
        ...activity,
        id: `activity-${index + 1}`,
        description: `Hoạt động ${index + 1}`,
      })),
    })

    render(<DashboardPage />)

    expect(await screen.findByText('Việc cần xử lý 1')).toBeInTheDocument()
    expect(
      document.querySelectorAll('.mgr-action-card .mgr-dash-row'),
    ).toHaveLength(6)
    expect(
      document.querySelectorAll(
        '.mgr-mission-status-card .mgr-mission-active-row',
      ),
    ).toHaveLength(2)
    expect(document.querySelectorAll('.ant-table-row')).toHaveLength(6)
    expect(document.querySelectorAll('.mgr-activity-list > li')).toHaveLength(8)

    fireEvent.click(
      screen.getByRole('button', { name: 'Xem tất cả 6 việc còn lại' }),
    )
    expect(
      document.querySelectorAll('.mgr-action-card .mgr-dash-row'),
    ).toHaveLength(12)
    expect(
      document.querySelector('.mgr-action-card .mgr-action-more'),
    ).toHaveAttribute('aria-expanded', 'true')
  })
})
