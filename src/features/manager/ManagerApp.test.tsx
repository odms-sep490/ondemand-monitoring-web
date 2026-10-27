import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authSession } from '../auth/api/authApi'
import { managerApi } from './api/dashboardApi'
import { ordersApi } from './api/ordersApi'
import { ManagerApp } from './ManagerApp'
import type { OrderMissionBrief } from './types/orders'
import type { ManagerDashboardResponse } from './types/dashboard'

const sampleData: ManagerDashboardResponse = {
  summary: {
    totalOrders: 10,
    totalQuoteValue: 0,
    pendingOrderCount: 6,
    pendingAdditionalChecklistCount: 0,
    waitingDepositCount: 0,
    activeMissionCount: 1,
    attentionRequiredCount: 0,
  },
  orderStatusDistribution: [],
  serviceDistribution: [],
  additionalServiceDistribution: [],
  priceAdjustmentSummary: { approvedAtSystemPrice: 0, adjustedByManager: 0 },
  missionStatusDistribution: [],
  missionTrend: [],
  actionItems: [],
  recentOrders: [],
  pricingPipeline: {
    pricingReviewCount: 0,
    quoteReadyCount: 0,
    waitingCustomerCount: 0,
    waitingDepositCount: 0,
    depositPaidCount: 0,
  },
  missionOverview: {
    scheduledCount: 0,
    readyCount: 0,
    inFlightCount: 0,
    returningCount: 0,
    completedTodayCount: 0,
    issueCount: 0,
  },
  activeMissions: [],
  recentActivities: [],
  generatedAt: '2026-10-22T00:00:00Z',
}

beforeEach(() => {
  localStorage.setItem('fieldwise.accessToken', 'mock-staff-token')
  localStorage.setItem(
    'fieldwise.user',
    JSON.stringify({
      id: '1',
      fullName: 'Lê Thị Thanh Hằng',
      email: 'hang.le@odms.vn',
      role: 'MANAGER',
    }),
  )
  window.location.hash = ''
})

afterEach(() => {
  authSession.clear()
  window.location.hash = ''
  vi.restoreAllMocks()
})

describe('ManagerApp', () => {
  it('renders the Dashboard (MNG-01) for #portal/manager', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    window.location.hash = '#portal/manager'
    render(<ManagerApp />)

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Bảng điều khiển quản lý' })).toBeInTheDocument(),
    )
  })

  it('feeds the pending-orders nav badge from summary.pendingOrderCount', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    window.location.hash = '#portal/manager'
    render(<ManagerApp />)

    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: /Đơn hàng/ }),
      ).toHaveTextContent('6')
    })
  })

  it('renders the real QueuePage (MNG-02) for #portal/manager/orders', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue([])
    window.location.hash = '#portal/manager/orders'
    render(<ManagerApp />)

    await waitFor(() =>
      expect(screen.getByText('Hàng đợi duyệt đơn')).toBeInTheDocument(),
    )
  })

  it('renders the real CreateMissionPage (MNG-04) for #portal/manager/orders/:id/mission', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    const brief: OrderMissionBrief = {
      id: 'ord-2609-0153',
      code: 'ORD-2609-0153',
      serviceName: 'Kiểm tra nhiệt mái nhà xưởng KCN Hiệp Phước',
      customerFullName: 'Trần Thị Thu Hà',
      preferredDate: '24/09',
      preferredTimeName: 'Sáng',
      addressText: 'KCN Hiệp Phước, Nhà Bè',
      center: { lat: 10.6402, lon: 106.74 },
      radiusM: 300,
      mediaRequirements: [],
    }
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    window.location.hash = '#portal/manager/orders/ord-2609-0153/mission'
    render(<ManagerApp />)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo nhiệm vụ' }),
      ).toBeInTheDocument(),
    )
  })

  it('renders the mission-scoped assignment page (MNG-05) for #portal/manager/missions/:id/dispatch', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    const { missionsApi } = await import('./api/missionsApi')
    vi.spyOn(missionsApi, 'getMissionResponse').mockReturnValue(
      new Promise(() => undefined),
    )
    window.location.hash = '#portal/manager/missions/msn-2609-0153-1/dispatch'
    render(<ManagerApp />)

    await waitFor(() =>
      expect(screen.getByText('Đang tải phân công…')).toBeInTheDocument(),
    )
  })

  it('shows a not-found state with a link back to Dashboard for unknown routes', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    window.location.hash = '#portal/manager/unknown-thing'
    render(<ManagerApp />)

    await waitFor(() =>
      expect(screen.getByText('Không tìm thấy màn hình')).toBeInTheDocument(),
    )
    expect(screen.getByRole('link', { name: 'Về bảng điều khiển' })).toHaveAttribute(
      'href',
      '#portal/manager',
    )
  })
})
