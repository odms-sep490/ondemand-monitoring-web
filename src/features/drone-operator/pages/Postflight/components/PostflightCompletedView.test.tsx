import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../../shared/i18n'
import { missionApi } from '../../../../mission/api/missionApi'
import { PostflightCompletedView } from './PostflightCompletedView'

const testState = vi.hoisted(() => ({
  reviewData: null as unknown,
  backgroundLoading: false,
  monitoringData: null as unknown,
  submitMissionResult: vi.fn(),
  canComplete: false,
}))

vi.mock('../../../../mission/api/missionApi', () => ({
  missionApi: {
    completeMission: vi.fn(),
    failMission: vi.fn(),
    getPermissions: vi.fn().mockResolvedValue({ canReviewMissionMedia: false }),
    submitMissionResult: testState.submitMissionResult,
  },
}))

vi.mock('../../../../mission/hooks/useMissionMonitoring', () => ({
  useMissionMonitoring: () => ({
    data: testState.monitoringData as never,
    loading: testState.backgroundLoading,
    error: null,
    reload: vi.fn(),
  }),
}))

vi.mock('../usePostflightReviewData', () => ({
  usePostflightReviewData: () => ({
    data: testState.reviewData as never,
    loading: testState.backgroundLoading,
    error: null,
    reload: vi.fn(),
  }),
}))

vi.mock('../../../components/common/MissionResultActions', () => ({
  missionResultActions: () => ({
    submitted: false,
    canComplete: testState.canComplete,
    canSubmit: true,
    completeReady: testState.canComplete,
    submitReady: true,
    readinessReason: null,
  }),
  staffResultError: () => 'Không thể thực hiện thao tác.',
}))

vi.mock('../../../../mission/components/MonitoringChecklistSection', () => ({
  MonitoringChecklistSection: () => null,
}))

describe('PostflightCompletedView', () => {
  beforeEach(() => {
    testState.backgroundLoading = false
    testState.canComplete = false
    vi.mocked(missionApi.completeMission).mockReset()
    testState.submitMissionResult.mockReset()
    testState.submitMissionResult.mockResolvedValue(undefined)
    testState.reviewData = {
      mission: {
        id: 'mission-1',
        missionCode: 'MS-96811',
        status: 'COMPLETED',
        completedAt: '2026-11-12T10:00:00.000Z',
        serviceName: 'Giám sát công trình',
        address: 'Tây Ninh',
        startedAt: '2026-11-12T09:00:00.000Z',
      },
      preflight: { items: [] },
      weather: {
        status: 'PASS',
        safeToFly: true,
        summary: 'Đủ điều kiện bay',
        windSpeedMps: 1,
        windGustMps: 2,
        precipitationMmH: 0,
        visibilityKm: 10,
        temperatureC: 27,
        humidityPercent: 60,
        advisories: [],
        checkedAt: '2026-11-12T08:00:00.000Z',
      },
      postflight: {
        overallOk: true,
        checkedAt: '2026-11-12T10:05:00.000Z',
        items: [],
      },
      media: [],
      loadErrors: {},
    }
    testState.monitoringData = {
      checklist: {
        missionId: 'mission-1',
        readyForSubmission: true,
        readyForFinalApproval: true,
        executions: [
          {
            content: 'Chụp ảnh tổng quan công trình',
            assessmentStatus: 'COMPLIANT',
            executionStatus: 'COMPLETED',
            evidence: [],
          },
        ],
      },
      permissions: {
        canAssessMonitoringChecklist: true,
        canMaintainDevice: false,
        canConfirmMissionFailure: false,
      },
      result: null,
    }
    act(() => setLanguage('vi'))
  })

  it('keeps tab summaries and content stable while refreshing existing data', () => {
    const element = <PostflightCompletedView inspectionOnly missionId="mission-1" missionLabel="MS-1"
      completed={{ overallOk: true, ticketCreated: false, droneStatus: 'AVAILABLE' }}
      deviceId="d" inspectionResults={null} notes="" telemetrySnapshot={null} />
    const view = render(element)
    const tabs = screen.getAllByRole('tab')
    const summaries = tabs.map(tab => tab.textContent)
    testState.backgroundLoading = true
    view.rerender(<PostflightCompletedView inspectionOnly missionId="mission-1" missionLabel="MS-1"
      completed={{ overallOk: true, ticketCreated: false, droneStatus: 'AVAILABLE' }}
      deviceId="d" inspectionResults={null} notes="" telemetrySnapshot={null} />)
    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(summaries)
    expect(screen.getAllByRole('tab')[0]).toBe(tabs[0])
  })

  it('confirms inspection without returning to the flight stepper', async () => {
    render(
      <PostflightCompletedView
        inspectionOnly
        missionId="mission-1"
        missionLabel="MS-96811"
        completed={{
          overallOk: true,
          ticketCreated: false,
          droneStatus: 'AVAILABLE',
        }}
        deviceId="DRN-001"
        inspectionResults={null}
        notes=""
        telemetrySnapshot={null}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Nghiệm thu nhiệm vụ' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Nghiệm thu và công bố' }))

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Nghiệm thu và công bố' })).toBeNull())
    expect(testState.submitMissionResult).toHaveBeenCalledTimes(1)
    expect(
      screen.getByText('Inspector đã nghiệm thu', {
        selector: '.postflight-review-manager-status',
      }),
    ).toBeTruthy()
  })
  it('does not treat a legacy pending result as Inspector acceptance', () => {
    testState.monitoringData = {
      ...(testState.monitoringData as Record<string, unknown>),
      result: { missionId: 'mission-1', approvalStatus: 'PENDING_MANAGER_APPROVAL' },
    }
    render(<PostflightCompletedView inspectionOnly missionId="mission-1" missionLabel="MS-96811"
      completed={{ overallOk: true, ticketCreated: false, droneStatus: 'AVAILABLE' }}
      deviceId="DRN-001" inspectionResults={null} notes="" telemetrySnapshot={null} />)
    expect(screen.getByText('Chờ Inspector xác nhận nghiệm thu', { selector: '.postflight-review-manager-status' })).toBeInTheDocument()
    expect(screen.queryByText('Inspector đã nghiệm thu')).toBeNull()
    expect(testState.submitMissionResult).not.toHaveBeenCalled()
  })


it('requires checklist assessment before completing inspection', async () => {
  testState.canComplete = true
  const review = testState.reviewData as { mission: { status: string; completedAt?: string } }
  review.mission.status = 'IN_PROGRESS'
  delete review.mission.completedAt
  const monitoring = testState.monitoringData as { checklist: { readyForSubmission: boolean; executions: { assessmentStatus: string }[] }; permissions: { canAssessMonitoringChecklist: boolean } }
  monitoring.permissions.canAssessMonitoringChecklist = false
  monitoring.checklist.readyForSubmission = false
  monitoring.checklist.executions[0].assessmentStatus = 'NOT_ASSESSED'
  render(<PostflightCompletedView missionId="mission-1" missionLabel="MS-1" completed={{ overallOk: true, ticketCreated: false, droneStatus: 'AVAILABLE' }} deviceId="d" inspectionResults={null} notes="" telemetrySnapshot={null} />)
  const confirm = screen.getByRole('button', { name: 'Hoàn tất nghiệm thu' })
  expect(confirm).toBeDisabled()
  fireEvent.click(confirm)
  expect(missionApi.completeMission).not.toHaveBeenCalled()
})


it('allows completion after assessment and customer evidence selection are ready', async () => {
  testState.canComplete = true
  const review = testState.reviewData as { mission: { status: string; completedAt?: string } }
  review.mission.status = 'IN_PROGRESS'
  delete review.mission.completedAt
  render(<PostflightCompletedView inspectionOnly missionId="mission-1" missionLabel="MS-1" completed={{ overallOk: true, ticketCreated: false, droneStatus: 'AVAILABLE' }} deviceId="d" inspectionResults={null} notes="" telemetrySnapshot={null} />)
  const confirm = screen.getByRole('button', { name: 'Hoàn tất nghiệm thu' })
  expect(confirm).toBeEnabled()
  expect(screen.queryByText('Chờ người thực hiện gửi hồ sơ. Nghiệm thu chỉ bắt đầu sau bước này.')).toBeNull()
  fireEvent.click(confirm)
  await waitFor(() => expect(missionApi.completeMission).toHaveBeenCalledWith('mission-1'))
})

it('keeps completion blocked when customer evidence selection is incomplete', () => {
  testState.canComplete = true
  const review = testState.reviewData as { mission: { status: string; completedAt?: string } }
  review.mission.status = 'IN_PROGRESS'
  delete review.mission.completedAt
  const monitoring = testState.monitoringData as { checklist: { readyForFinalApproval: boolean } }
  monitoring.checklist.readyForFinalApproval = false
  render(<PostflightCompletedView inspectionOnly missionId="mission-1" missionLabel="MS-1" completed={{ overallOk: true, ticketCreated: false, droneStatus: 'AVAILABLE' }} deviceId="d" inspectionResults={null} notes="" telemetrySnapshot={null} />)
  expect(screen.getByRole('button', { name: 'Hoàn tất nghiệm thu' })).toBeDisabled()
  expect(missionApi.completeMission).not.toHaveBeenCalled()
})


it('directs accepted supplemental results to the original Mission instead of claiming separate customer publication', async () => {
  const review = testState.reviewData as { mission: { inspectionSourceMissionId?: string } }
  review.mission.inspectionSourceMissionId = 'original'
  render(<PostflightCompletedView inspectionOnly missionId="mission-1" missionLabel="MS-CHILD" completed={{ overallOk: true, ticketCreated: false, droneStatus: 'AVAILABLE' }} deviceId="d" inspectionResults={null} notes="" telemetrySnapshot={null} />)
  expect(screen.getByRole('link', { name: 'Trở về nghiệm thu Mission gốc' })).toHaveAttribute('href', '#portal/staff/inspection/original')
  expect(screen.queryByRole('button', { name: 'Nghiệm thu và công bố' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận đạt và gửi kết quả về nhiệm vụ gốc' }))
  await waitFor(() => expect(testState.submitMissionResult).toHaveBeenCalledOnce())
})


it('allows original publication with compliant original work plus explicitly resolved supplemental work', async () => {
  const monitoring = testState.monitoringData as { checklist: { executions: Record<string, unknown>[] } }
  monitoring.checklist.executions.push({ content: 'Quay video bổ sung', assessmentStatus: 'NON_COMPLIANT', executionStatus: 'COMPLETED', fulfilledByMissionId: 'child', fulfilledByMissionCode: 'MS-CHILD', evidence: [] })
  render(<PostflightCompletedView inspectionOnly missionId="mission-1" missionLabel="MS-ORIGINAL" completed={{ overallOk: true, ticketCreated: false, droneStatus: 'AVAILABLE' }} deviceId="d" inspectionResults={null} notes="" telemetrySnapshot={null} />)
  const publish = screen.getByRole('button', { name: 'Nghiệm thu và công bố' })
  expect(publish).toBeEnabled()
  fireEvent.click(publish)
  await waitFor(() => expect(testState.submitMissionResult).toHaveBeenCalledOnce())
  expect(testState.submitMissionResult.mock.calls[0][1].summary).toContain('2/2')
})

})
