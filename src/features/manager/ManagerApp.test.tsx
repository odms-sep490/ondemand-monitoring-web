import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authSession } from '../auth/api/authApi'
import { managerApi } from './api/dashboardApi'
import { ordersApi } from './api/ordersApi'
import { ManagerApp } from './ManagerApp'
import type { OrderMissionBrief } from './types/orders'
import type { ManagerDashboardResponse } from './types/dashboard'

const sampleData: ManagerDashboardResponse = {
  kpis: {
    pendingOrders: { count: 6, detail: '2 quá 24h' },
    missionsToday: { count: 5, detail: '3 đã xong' },
    missionsInFlight: { count: 1, detail: '' },
    dronesReady: { ready: 5, total: 9, detail: '1 bảo trì' },
    actionItems: { count: 4, detail: '2 upload · 2 lỗi media' },
  },
  missionStatusByDay: [],
  droneStatusBreakdown: [],
  actionItems: [
    {
      id: 'ai-4',
      type: 'MAINTENANCE_TICKET',
      ticketId: 'MT-1',
      code: 'MT-1',
      title: 'DRN-07: rung bất thường',
      subtitle: 'CRITICAL',
      openedAtIso: '2026-09-13T14:32:00+07:00',
    },
  ],
  flyingMission: null,
  navCounts: {
    pendingOrders: 6,
    openMaintenanceTickets: 3,
    mediaNeedsAction: 6,
  },
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
      expect(screen.getByText('Dashboard điều hành')).toBeInTheDocument(),
    )
  })

  it('feeds the nav badges from navCounts, not from actionItems', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    window.location.hash = '#portal/manager'
    render(<ManagerApp />)

    await waitFor(() => {
      // sampleData.actionItems only has 1 MAINTENANCE_TICKET row, but the
      // badge must reflect navCounts.openMaintenanceTickets (3), not that
      // undercounted list length.
      expect(screen.getByRole('link', { name: /Bảo trì/ })).toHaveTextContent(
        '3',
      )
      expect(
        screen.getByRole('link', { name: /Đơn hàng/ }),
      ).toHaveTextContent('6')
      expect(
        screen.getByRole('link', { name: /Media và giao kết quả/ }),
      ).toHaveTextContent('6')
    })
  })

  it('renders the real MediaPage (MNG-11) for #portal/manager/media', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    window.location.hash = '#portal/manager/media'
    render(<ManagerApp />)

    await waitFor(() =>
      expect(
        screen.getAllByText('Media và giao kết quả').length,
      ).toBeGreaterThan(0),
    )
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
      nearestBase: 'Trạm Nhà Bè',
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

  it('renders the real DispatchPage (MNG-05) for #portal/manager/missions/:id/dispatch', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    const { missionsApi } = await import('./api/missionsApi')
    vi.spyOn(missionsApi, 'getMission').mockResolvedValue({
      id: 'msn-2609-0153-1',
      orderId: 'ord-2609-0153',
      orderCode: 'ORD-2609-0153',
      missionCode: 'MSN-2609-0153-1',
      status: 'CREATED',
      attemptNumber: 1,
      droneId: null,
      operatorId: null,
      droneAssignmentId: null,
      operatorAssignmentId: null,
      scheduledStartAt: null,
      scheduledEndAt: null,
      addressText: null,
      centerLat: null,
      centerLon: null,
      radiusM: null,
      requiredSensor: null,
      nearestBase: null,
      mediaRequirements: [],
      flightPlan: null,
      waypoints: [],
    })
    vi.spyOn(missionsApi, 'getResourceSuggestions').mockResolvedValue({
      feasible: true,
      missionCode: 'MSN-2609-0153-1',
      attemptNumber: 1,
      scheduledStart: '',
      scheduledEnd: '',
      addressText: null,
      centerLat: null,
      centerLon: null,
      radiusM: null,
      mediaSummary: null,
      requiredDurationLabel: null,
      requiredSensor: null,
      nearestBase: null,
      eligibleDroneCount: 0,
      eligibleOperatorCount: 0,
      topDrones: [],
      topOperators: [],
      rejected: { drones: [], operators: [] },
      explanation: '',
      timeline: { date: '', windowStart: '', windowEnd: '', resources: [] },
      alternatives: [],
    })
    window.location.hash = '#portal/manager/missions/msn-2609-0153-1/dispatch'
    render(<ManagerApp />)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Phân công nguồn lực' }),
      ).toBeInTheDocument(),
    )
  })

  it('shows a not-found state with a link back to Dashboard for unknown routes', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    window.location.hash = '#portal/manager/unknown-thing'
    render(<ManagerApp />)

    await waitFor(() =>
      expect(screen.getByText('Không tìm thấy màn hình')).toBeInTheDocument(),
    )
    expect(screen.getByRole('link', { name: 'Về Dashboard' })).toHaveAttribute(
      'href',
      '#portal/manager',
    )
  })
})
