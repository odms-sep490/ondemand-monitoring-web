import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { missionsApi } from '../../../api/missionsApi'
import { ordersApi } from '../../../api/ordersApi'
import { checklistExecutionApi } from '../../../../mission/api/checklistExecutionApi'
import { MissionDetailPage } from '../MissionDetailPage'
import type {
  MissionResponse,
  MissionResultResponse,
} from '../../../types/missions'
import type { OrderDetail } from '../../../types/orders'

vi.mock('../../../../media/components/MissionUploadedMedia', () => ({
  MissionUploadedMedia: () => <div>Thư viện media riêng</div>,
}))
vi.mock('../../../../delivery/ManagerDeliveryPanel', () => ({
  ManagerDeliveryPanel: ({
    allowLegacyPublication,
  }: {
    allowLegacyPublication?: boolean
  }) => (
    <div data-testid="publication-mode">
      {allowLegacyPublication ? 'legacy-recovery' : 'automatic'}
    </div>
  ),
}))
const mission: MissionResponse = {
  id: 'm',
  orderId: 'o',
  orderTitle: 'Đơn giám sát',
  customerName: 'Khách hàng',
  missionCode: 'MS-1',
  status: 'COMPLETED',
  operatorId: null,
  droneId: null,
  droneCode: 'DR-1',
  latitude: 10.637554,
  longitude: 106.6983628,
  address: null,
  scheduledStartAt: null,
  startedAt: null,
  completedAt: null,
  description: null,
  failureReason: null,
  rejectionReason: null,
  mediaType: null,
  plan: null,
  preflightRetryCount: 0,
  preflightPassed: true,
  preflightFaultType: null,
  preflightFailureReason: null,
  preflightCheckedAt: null,
}
const result: MissionResultResponse = {
  id: 'r',
  missionId: 'm',
  missionCode: 'MS-1',
  status: 'COMPLETED',
  approvalStatus: 'PENDING_MANAGER_APPROVAL',
  startedAt: null,
  endedAt: null,
  completedAt: null,
  submittedAt: null,
  approvedAt: null,
  rejectedAt: null,
  durationSeconds: null,
  mediaCount: 0,
  summary: 'Báo cáo',
  notes: null,
  createdBy: null,
  reviewedBy: null,
  reviewNote: null,
  createdAt: null,
  updatedAt: null,
  mediaFiles: [],
}
beforeEach(() => {
  vi.spyOn(missionsApi, 'getMissionResponse').mockResolvedValue(mission)
  vi.spyOn(ordersApi, 'getOrder').mockResolvedValue({
    id: 'o',
    code: 'ORD-1',
    status: 'APPROVED',
    customer: {
      fullName: 'Khách hàng',
      companyName: 'Công ty mẫu',
      email: 'customer@example.com',
      phone: '0900000000',
    },
    serviceName: 'Kiểm tra nhà xưởng',
    preferredDate: '2026-10-08',
    preferredTimeName: 'Buổi sáng',
    preferredWindow: null,
    submittedAt: '2026-10-07T00:00:00Z',
    addressText: 'Đường Long Hậu',
    center: { lat: 10.63, lon: 106.69 },
    radiusM: 300,
    mediaRequirements: null,
    purpose: null,
    attachments: null,
    title: 'Đơn giám sát',
    deliverables: null,
  } as OrderDetail)
  vi.spyOn(missionsApi, 'getCurrentPreflight').mockRejectedValue(
    new Error('not found'),
  )
  vi.spyOn(missionsApi, 'getCurrentPostDeviceCheck').mockRejectedValue(
    new Error('not found'),
  )
  vi.spyOn(missionsApi, 'getMissionResult').mockResolvedValue(result)
  vi.spyOn(missionsApi, 'getMissionMedia').mockResolvedValue([])
  vi.spyOn(missionsApi, 'getLatestWeatherCheck').mockResolvedValue({
    id: 'w',
    missionId: 'm',
    deviceId: 'd',
    status: 'PASS',
    safeToFly: true,
    summary: 'Thời tiết phù hợp để cất cánh.',
    windSpeedMps: 4.2,
    windGustMps: 6.3,
    precipitationMmH: 0.1,
    visibilityKm: 10.5,
    temperatureC: 29.1,
    humidityPercent: 72,
    advisories: ['Thời tiết ổn định, đủ điều kiện bay mô phỏng.'],
    checkedAt: '2026-10-06T00:00:00Z',
  })
  vi.spyOn(
    checklistExecutionApi,
    'getMissionChecklistExecutions',
  ).mockResolvedValue({
    missionId: 'm',
    legacySnapshot: false,
    readyForSubmission: true,
    readyForFinalApproval: true,
    executions: [
      {
        id: 'e',
        orderChecklistItemId: 'historical',
        content: 'Kiểm tra mái nhà lịch sử',
        displayOrder: 0,
        sourceType: 'CUSTOMER_CUSTOM',
        executionStatus: 'UNABLE_TO_VERIFY',
        assessmentStatus: 'NOT_ASSESSED',
        observation: 'Có cây che',
        unableToVerifyReason: 'Không có góc nhìn',
        version: 2,
        startedAt: null,
        completedAt: null,
        lastModifiedBy: null,
        createdAt: '2026-10-05T00:00:00Z',
        updatedAt: null,
      },
    ],
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  window.history.replaceState(null, '', window.location.pathname)
})
describe('Manager Mission Detail monitoring review', () => {
  it.each([undefined, false, true])(
    'routes approved inspectorConfirmed=%s to the correct publication mode',
    async (inspectorConfirmed) => {
      vi.mocked(missionsApi.getMissionResult).mockResolvedValue({
        ...result,
        approvalStatus: 'APPROVED',
        inspectorConfirmed,
      })
      render(<MissionDetailPage missionId="m" />)
      expect(await screen.findByTestId('publication-mode')).toHaveTextContent(
        inspectorConfirmed === true ? 'automatic' : 'legacy-recovery',
      )
    },
  )
  it.each([
    {
      purpose: 'ORIGINAL' as const,
      caseId: null,
      route: '#portal/manager/orders/o',
    },
    {
      purpose: 'REWORK' as const,
      caseId: 'case-1',
      route: '#portal/manager/orders/o/rework/case-1',
    },
  ])(
    'resumes $purpose planning without querying execution results',
    async ({ purpose, caseId, route }) => {
      vi.mocked(missionsApi.getMissionResponse).mockResolvedValue({
        ...mission,
        status: 'PLANNING',
        purpose,
        resultRevisionCaseId: caseId,
        staffAssignments: [],
        deviceAssignments: [],
      })
      render(<MissionDetailPage missionId="m" />)
      await waitFor(() => expect(window.location.hash).toBe(route))
      expect(
        checklistExecutionApi.getMissionChecklistExecutions,
      ).not.toHaveBeenCalled()
      expect(missionsApi.getMissionResult).not.toHaveBeenCalled()
      expect(missionsApi.getCurrentPreflight).not.toHaveBeenCalled()
      expect(missionsApi.getCurrentPostDeviceCheck).not.toHaveBeenCalled()
      expect(missionsApi.getMissionMedia).not.toHaveBeenCalled()
      expect(screen.queryByText('Kết quả checklist')).not.toBeInTheDocument()
    },
  )

  it('opens the media section without changing the active route', async () => {
    render(<MissionDetailPage missionId="m" />)
    const link = await screen.findByRole('button', {
      name: 'Xem thư viện ảnh/video',
    })
    fireEvent.click(link)
    expect(screen.getByRole('tab', { name: 'Ảnh & video' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      screen.getByRole('region', { name: 'Thư viện ảnh/video' }),
    ).toBeVisible()
    expect(window.location.hash).toBe(
      '#portal/manager/missions/m/detail?tab=media',
    )
  })
  it('restores a selected tab from the URL and keeps the media gallery mounted after first visit', async () => {
    window.history.replaceState(
      null,
      '',
      '#portal/manager/missions/m/detail?tab=resources',
    )
    render(<MissionDetailPage missionId="m" />)
    expect(
      await screen.findByRole('tab', { name: 'Thông tin nguồn lực' }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(missionsApi.getMissionMedia).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('tab', { name: 'Ảnh & video' }))
    const gallery = screen.getByRole('region', { name: 'Thư viện ảnh/video' })
    expect(gallery).toBeVisible()
    fireEvent.click(screen.getByRole('tab', { name: 'Kết quả nhiệm vụ' }))
    expect(gallery).not.toBeVisible()
    fireEvent.click(screen.getByRole('tab', { name: 'Ảnh & video' }))
    expect(gallery).toBeVisible()
    expect(missionsApi.getMissionMedia).not.toHaveBeenCalled()
  })
  it('distinguishes pre-flight not started from post-flight checks not due', async () => {
    vi.mocked(missionsApi.getMissionResponse).mockResolvedValue({
      ...mission,
      status: 'SCHEDULED',
    })
    render(<MissionDetailPage missionId="m" />)
    fireEvent.click(
      await screen.findByRole('tab', { name: 'Kiểm tra trước/sau bay' }),
    )
    // Checks are now loaded per device, so the empty states appear after load.
    expect(
      await screen.findByText('Chưa đến bước kiểm tra trước bay.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Chưa đến bước kiểm tra sau bay.'),
    ).toBeInTheDocument()
  })
  it('renders per-item historical outcomes read-only', async () => {
    render(<MissionDetailPage missionId="m" />)
    fireEvent.click(
      await screen.findByRole('tab', { name: 'Danh mục kiểm tra' }),
    )
    const row = await screen.findByRole('button', {
      name: /Kiểm tra mái nhà lịch sử/,
    })
    // Checklist items are an accordion: the historical outcome shows on expand.
    expect(row).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(row)
    expect(row).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByText(/Không có góc nhìn/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Có cây che/)).toBeInTheDocument()
    expect(screen.queryByText('Cập nhật mục')).toBeNull()
    expect(screen.getByText('Duyệt kết quả')).toBeEnabled()
    expect(screen.getByText('Từ chối kết quả')).toBeEnabled()
  })
  it('uses the satellite mission map on result review', async () => {
    render(<MissionDetailPage missionId="m" />)

    fireEvent.click(
      await screen.findByRole('tab', { name: 'Vị trí & tuyến kế hoạch' }),
    )
    expect(
      screen.getByRole('application', {
        name: 'Bản đồ vệ tinh nhiệm vụ',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/ĐIỂM GIÁM SÁT/)).toBeInTheDocument()
  })
  it('shows an honest location state instead of a default map when coordinates are missing', async () => {
    vi.mocked(missionsApi.getMissionResponse).mockResolvedValue({
      ...mission,
      latitude: null,
      longitude: null,
    })
    // The map now prefers the source Order's GPS, so it must be missing too.
    vi.spyOn(ordersApi, 'getOrder').mockResolvedValue({
      ...(await ordersApi.getOrder('o')),
      center: null,
    })
    const { container } = render(<MissionDetailPage missionId="m" />)
    fireEvent.click(
      await screen.findByRole('tab', { name: 'Vị trí & tuyến kế hoạch' }),
    )

    expect(screen.getByText('Chưa có tọa độ nhiệm vụ')).toBeInTheDocument()
    expect(container.querySelector('.odm-rm-leaflet')).toBeNull()
    expect(screen.queryByText(/HOME →/)).toBeNull()
  })
  it('falls back to results when opening the removed order tab', async () => {
    window.history.replaceState(
      null,
      '',
      '#portal/manager/missions/m/detail?tab=order',
    )
    render(<MissionDetailPage missionId="m" />)

    expect(
      await screen.findByRole('tab', { name: 'Kết quả nhiệm vụ' }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('tab', { name: 'Thông tin đơn hàng' })).toBeNull()
    expect(screen.queryByText('customer@example.com')).toBeNull()
  })
  it('hides the flight plan tab after mission completion', async () => {
    render(<MissionDetailPage missionId="m" />)

    await screen.findByRole('tab', { name: 'Kết quả nhiệm vụ' })
    expect(screen.queryByRole('tab', { name: 'Kế hoạch bay' })).toBeNull()
    expect(
      screen.getByRole('tab', { name: 'Kiểm tra trước/sau bay' }),
    ).toBeInTheDocument()
  })
  it('shows the weather result only inside the checks tab', async () => {
    render(<MissionDetailPage missionId="m" />)

    await screen.findByRole('heading', { name: 'Kết quả nhiệm vụ' })
    expect(screen.queryByText('Kết quả thời tiết')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Kiểm tra trước/sau bay' }))
    expect(
      await screen.findByRole('heading', { name: 'Kết quả thời tiết' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Thời tiết phù hợp để cất cánh.'),
    ).toBeInTheDocument()
  })
  it.each(['DRAFT', 'REJECTED', 'APPROVED'] as const)(
    '%s cannot be approved/rejected',
    async (approvalStatus) => {
      vi.spyOn(missionsApi, 'getMissionResult').mockResolvedValue({
        ...result,
        approvalStatus,
      })
      render(<MissionDetailPage missionId="m" />)
      await screen.findByText('Kiểm tra mái nhà lịch sử')
      expect(screen.queryByRole('button', { name: 'Duyệt kết quả' })).toBeNull()
      expect(
        screen.queryByRole('button', { name: 'Từ chối kết quả' }),
      ).toBeNull()
    },
  )
  it('refreshes mission/result/checklist after rejection', async () => {
    vi.spyOn(missionsApi, 'rejectMissionResult').mockImplementation(
      async () => {
        vi.mocked(missionsApi.getMissionResult).mockResolvedValue({
          ...result,
          approvalStatus: 'REJECTED',
        })
        return { ...result, approvalStatus: 'REJECTED' }
      },
    )
    render(<MissionDetailPage missionId="m" />)
    fireEvent.click(await screen.findByText('Từ chối kết quả'))
    await screen.findByText(
      'Kết quả đã bị từ chối. Nhân sự thực hiện cần chỉnh sửa và gửi lại.',
    )
    await waitFor(() =>
      expect(missionsApi.getMissionResponse).toHaveBeenCalledTimes(2),
    )
    expect(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).toHaveBeenCalledTimes(2)
  })
})
