import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResourceLifecyclePage } from '../ResourceLifecyclePage'
import { resourceLifecycleApi } from '../api'

describe('ResourceLifecyclePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(resourceLifecycleApi, 'getOverview').mockResolvedValue({
      totalDevices: 2,
      healthyDevices: 1,
      warningDevices: 0,
      blockedDevices: 1,
      unknownHealthDevices: 0,
      totalStaff: 3,
      warningStaff: 0,
      blockedStaff: 0,
      openAlerts: 1,
      activeMaintenanceCycles: 1,
      activePolicies: 1,
      batteryCapabilityNote: 'Chưa hỗ trợ theo dõi từng viên pin riêng biệt.',
    })
    vi.spyOn(resourceLifecycleApi, 'listDrones').mockResolvedValue([
      {
        deviceId: 'drone-1',
        deviceName: 'Drone Alpha',
        serialNumber: 'SN-001',
        modelId: 'model-1',
        modelName: 'Matrice 300 RTK',
        operationalStatus: 'MAINTENANCE',
        maintenanceStatus: 'MAINTENANCE_REQUIRED',
        lifetimeActualSeconds: 183600,
        lifetimeEstimatedSeconds: 0,
        sinceMaintenanceSeconds: 183600,
        sinceMaintenanceCycles: 14,
        lifetimeCycles: 14,
        measuredDistanceMeters: 15000,
        remainingSeconds: 0,
        remainingCycles: 86,
        remainingDays: 80,
        utilizationPercent: 102,
        activePolicyId: 'pol-1',
        activePolicyName: '50h Policy',
        activePolicyRevision: 1,
        usageSource: 'VERIFIED_MANUAL',
        blocked: true,
        openTicketId: 'ticket-1',
        openCycleId: 'cycle-1',
        lastMaintenanceAt: null,
        reasons: ['FLIGHT_HOURS_DUE', 'OPEN_MAINTENANCE_CYCLE'],
        batteryTrackingStatus: 'Chưa hỗ trợ theo dõi từng viên pin riêng biệt.',
      },
    ])
    vi.spyOn(resourceLifecycleApi, 'listStaff').mockResolvedValue([])
    vi.spyOn(resourceLifecycleApi, 'listUsage').mockResolvedValue([])
    vi.spyOn(resourceLifecycleApi, 'listPolicies').mockResolvedValue([])
    vi.spyOn(resourceLifecycleApi, 'listMaintenanceCycles').mockResolvedValue([])
    vi.spyOn(resourceLifecycleApi, 'listAlerts').mockResolvedValue([])
    vi.spyOn(resourceLifecycleApi, 'getScheduleForecasts').mockResolvedValue([])
    vi.spyOn(resourceLifecycleApi, 'listAudits').mockResolvedValue([])
  })

  it('renders overview KPI cards, tabs, and fleet charts without PX4 notice', async () => {
    render(<ResourceLifecyclePage />)

    await waitFor(() => {
      expect(screen.getByText('Quản lý nguồn lực & bảo trì')).toBeTruthy()
    })
    expect(screen.getByText('Vòng đời Drone')).toBeTruthy()
    expect(screen.getByText('Chính sách bảo trì')).toBeTruthy()
    expect(screen.getByText('Cảnh báo & Dự báo')).toBeTruthy()
    expect(
      await screen.findByText('Phân bố sức khỏe đội Drone'),
    ).toBeTruthy()
    expect(
      screen.getByText('Giờ hoạt động theo từng Drone (giờ)'),
    ).toBeTruthy()
    expect(screen.queryByText(/PX4\/Gazebo/i)).toBeNull()
  })
})
