import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../../shared/i18n'
import { PostflightCompletedView } from './PostflightCompletedView'

const testState = vi.hoisted(() => ({
  reviewData: null as unknown,
  monitoringData: null as unknown,
  submitMissionResult: vi.fn(),
}))

vi.mock('../../../../mission/api/missionApi', () => ({
  missionApi: {
    completeMission: vi.fn(),
    failMission: vi.fn(),
    submitMissionResult: testState.submitMissionResult,
  },
}))

vi.mock('../../../../mission/hooks/useMissionMonitoring', () => ({
  useMissionMonitoring: () => ({
    data: testState.monitoringData as never,
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}))

vi.mock('../usePostflightReviewData', () => ({
  usePostflightReviewData: () => ({
    data: testState.reviewData as never,
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}))

vi.mock('../../../components/common/MissionResultActions', () => ({
  missionResultActions: () => ({
    submitted: false,
    canComplete: false,
    canSubmit: true,
    completeReady: false,
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

  it('turns step 7 green immediately after the acceptance is submitted', async () => {
    render(
      <PostflightCompletedView
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

    expect(
      screen.getByRole('listitem', {
        name: 'Nghiệm thu — Đang thực hiện (7/7)',
      }),
    ).toHaveAttribute('aria-current', 'step')

    fireEvent.click(screen.getByRole('button', { name: 'Nghiệm thu và công bố' }))

    await waitFor(() => {
      const acceptanceStep = screen.getByRole('listitem', {
        name: 'Nghiệm thu — Đã hoàn thành (7/7)',
      })
      expect(acceptanceStep).toHaveClass('is-complete')
      expect(acceptanceStep).not.toHaveAttribute('aria-current')
    })
    expect(testState.submitMissionResult).toHaveBeenCalledTimes(1)
    expect(
      screen.getByText('Inspector đã nghiệm thu', {
        selector: '.postflight-review-manager-status',
      }),
    ).toBeTruthy()
    expect(screen.getByText('Đã hoàn tất')).toBeTruthy()
  })
  it('does not treat a legacy pending result as Inspector acceptance', () => {
    testState.monitoringData = {
      ...(testState.monitoringData as Record<string, unknown>),
      result: { missionId: 'mission-1', approvalStatus: 'PENDING_MANAGER_APPROVAL' },
    }
    render(<PostflightCompletedView missionId="mission-1" missionLabel="MS-96811"
      completed={{ overallOk: true, ticketCreated: false, droneStatus: 'AVAILABLE' }}
      deviceId="DRN-001" inspectionResults={null} notes="" telemetrySnapshot={null} />)
    expect(screen.getByRole('listitem', { name: 'Nghiệm thu — Đang thực hiện (7/7)' })).not.toHaveClass('is-complete')
    expect(screen.getByText('Chờ Inspector xác nhận nghiệm thu', { selector: '.postflight-review-manager-status' })).toBeInTheDocument()
    expect(screen.queryByText('Inspector đã nghiệm thu')).toBeNull()
    expect(testState.submitMissionResult).not.toHaveBeenCalled()
  })

})
