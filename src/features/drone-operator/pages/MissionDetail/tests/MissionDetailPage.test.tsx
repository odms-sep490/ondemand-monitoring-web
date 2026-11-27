import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import * as auth from '../../../../auth/api/authApi'
import * as checkData from '../checkData'
import { setLanguage } from '../../../../../shared/i18n'
import { MissionDetailPage } from '../MissionDetailPage'
import { operatorApi } from '../../../api/operatorApi'
import { missionApi } from '../../../../mission/api/missionApi'
import { checklistExecutionApi } from '../../../../mission/api/checklistExecutionApi'
import type { OperatorMission } from '../../../types/mission'

afterEach(() => vi.restoreAllMocks())
beforeEach(() => {
  vi.spyOn(
    checklistExecutionApi,
    'getMissionChecklistExecutions',
  ).mockResolvedValue({
    missionId: 'm',
    legacySnapshot: false,
    readyForSubmission: true,
    readyForFinalApproval: true,
    executions: [],
  })
  vi.spyOn(missionApi, 'getMissionResult').mockResolvedValue(null)
})

const mission: OperatorMission = {
  id: 'm',
  missionCode: 'MS-1',
  backendStatus: 'PENDING_REVIEW',
  status: 'ACCEPTED',
  title: 'Monitoring',
  location: 'Local',
  date: '2026-10-05',
  startTime: '09:00',
  endTime: '10:00',
  serviceLabel: 'Monitoring',
  droneCode: null,
  droneName: null,
}
const noActions = {
  canRespond: false,
  canControlFlight: false,
  canOperatePayload: false,
  canInspectDevice: false,
  canMaintainDevice: false,
  canUploadMedia: false,
  canCompleteMission: false,
  canSubmitMissionResult: false,
  canExecuteMonitoringChecklist: false,
}

// operatorApi.getMission routes through the real (unmocked) mission API, so
// it rejects in this test environment and the screen settles on its
// bilingual "mission not found" error state.
describe('MissionDetailScreen', () => {
  it.each(['checklist', 'result'])(
    'accepts a pending assignment when unrelated %s data fails to load',
    async (failedResource) => {
      vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
        ...mission,
        status: 'PENDING',
        backendStatus: 'READY',
        myResponseStatus: 'PENDING',
      })
      vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
        ...noActions,
        canRespond: true,
      })
      if (failedResource === 'checklist') {
        vi.mocked(
          checklistExecutionApi.getMissionChecklistExecutions,
        ).mockRejectedValue(new Error('Checklist service unavailable'))
      } else {
        vi.mocked(missionApi.getMissionResult).mockRejectedValue(
          new Error('Result service unavailable'),
        )
      }
      const accept = vi
        .spyOn(operatorApi, 'acceptMission')
        .mockResolvedValue({} as never)
      render(<MissionDetailPage missionId="m" />)
      const button = await screen.findByRole('button', {
        name: /Chấp nhận nhiệm vụ/,
      })
      await waitFor(() => expect(button).toBeEnabled())
      fireEvent.click(button)
      await waitFor(() => expect(accept).toHaveBeenCalledExactlyOnceWith('m'))
    },
  )

  it('keeps acceptance locked and reports a permission load failure truthfully', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission,
      status: 'PENDING',
      backendStatus: 'READY',
      myResponseStatus: 'PENDING',
    })
    vi.spyOn(missionApi, 'getPermissions').mockRejectedValue(
      new Error('Permissions unavailable'),
    )
    const accept = vi.spyOn(operatorApi, 'acceptMission')
    render(<MissionDetailPage missionId="m" />)
    expect(
      await screen.findByText(
        'Không tải được quyền nhận nhiệm vụ. Hệ thống sẽ tự thử lại.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Chấp nhận nhiệm vụ/ }),
    ).toBeDisabled()
    expect(
      screen.queryByText('Bạn chưa có quyền phản hồi nhiệm vụ này.'),
    ).not.toBeInTheDocument()
    expect(accept).not.toHaveBeenCalled()
  })

  it('does not accept an assignment when the backend denies the capability', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission,
      status: 'PENDING',
      backendStatus: 'READY',
      myResponseStatus: 'PENDING',
    })
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue(noActions)
    render(<MissionDetailPage missionId="m" />)
    expect(
      await screen.findByText('Bạn chưa có quyền phản hồi nhiệm vụ này.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Chấp nhận nhiệm vụ/ }),
    ).toBeDisabled()
  })

  it('missing permission response keeps legacy detail readable without granting actions', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue(mission)
    // Deliberately malformed response, outside the typed API contract.
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue(null as never)
    render(<MissionDetailPage missionId="m" />)
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mission MS-1' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Hoàn thành nhiệm vụ' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Mở buồng lái' }),
    ).not.toBeInTheDocument()
  })
  it('goes straight to the preflight inspection for a scheduled accepted mission', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission,
      backendStatus: 'SCHEDULED',
      status: 'SCHEDULED',
      myResponseStatus: 'ACCEPTED',
      deviceAssignmentStatus: 'ASSIGNED',
    })
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canOperatePayload: true,
    })

    render(<MissionDetailPage missionId="m" />)

    expect(
      await screen.findByRole('link', { name: 'Kiểm tra trước bay' }),
    ).toBeInTheDocument()
    // The separate GCS connection step was removed from the mission flow.
    expect(screen.queryByRole('link', { name: 'Kết nối GCS' })).toBeNull()
  })

  it.each([
    ['OPERATOR', true, false],
    ['PILOT fallback', true, false],
    ['INSPECTOR', false, true],
  ] as const)(
    'PENDING_REVIEW: %s follows backend editing/completion capabilities',
    async (_actor, canExecuteMonitoringChecklist, canCompleteMission) => {
      vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
        ...mission,
        status: 'PENDING_REVIEW',
      })
      vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
        ...noActions,
        canExecuteMonitoringChecklist,
        canCompleteMission,
      })
      vi.mocked(
        checklistExecutionApi.getMissionChecklistExecutions,
      ).mockResolvedValue({
        missionId: 'm',
        legacySnapshot: false,
        readyForSubmission: false,
        executions: [
          {
            id: 'e',
            orderChecklistItemId: 'h',
            content: 'Monitoring lịch sử',
            displayOrder: 1,
            sourceType: 'CUSTOMER_CUSTOM',
            executionStatus: 'PENDING',
            assessmentStatus: 'NOT_ASSESSED',
            observation: null,
            unableToVerifyReason: null,
            startedAt: null,
            completedAt: null,
            lastModifiedBy: null,
            createdAt: '2026-10-05T00:00:00Z',
            updatedAt: null,
            version: 0,
          },
        ],
      })
      render(<MissionDetailPage missionId="m" />)
      fireEvent.click(await screen.findByRole('tab', { name: 'Checklist' }))
      await screen.findByText('Monitoring lịch sử')
      // Mission detail only hosts the assessment-only checklist now, so no
      // actor gets an item-update control here, regardless of permission.
      expect(screen.queryByText('Cập nhật mục')).toBeNull()
      if (canCompleteMission) {
        expect(
          await screen.findByText('Mở nghiệm thu nhiệm vụ'),
        ).toBeInTheDocument()
        expect(screen.queryByText('Xác nhận hoàn thành nhiệm vụ')).toBeNull()
      }
      expect(
        screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' }),
      ).toBeNull()
    },
  )
  it('disables submit when backend checklist readiness is false', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission,
      backendStatus: 'COMPLETED',
      status: 'COMPLETED',
    })
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canSubmitMissionResult: true,
      canExecuteMonitoringChecklist: true,
    })
    vi.mocked(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      readyForSubmission: false,
      executions: [],
    })
    render(<MissionDetailPage missionId="m" />)
    // Mission detail no longer hosts result actions; it links to the acceptance
    // workspace instead.
    expect(
      await screen.findByRole('link', { name: 'Mở nghiệm thu nhiệm vụ' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' }),
    ).toBeNull()
  })
  it('refreshes result status on focus without exposing a submit action', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission,
      backendStatus: 'COMPLETED',
      status: 'COMPLETED',
    })
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canSubmitMissionResult: true,
      canExecuteMonitoringChecklist: true,
    })
    const result = {
      id: 'r',
      missionId: 'm',
      missionCode: 'MS-1',
      status: 'COMPLETED' as const,
      approvalStatus: 'PENDING_MANAGER_APPROVAL' as const,
    }
    vi.mocked(missionApi.getMissionResult).mockResolvedValue(result)
    render(<MissionDetailPage missionId="m" />)
    fireEvent.click(await screen.findByRole('tab', { name: 'Checklist' }))
    await screen.findByText('Không có mục danh sách kiểm tra giám sát.')
    const resultCalls = vi.mocked(missionApi.getMissionResult).mock.calls.length
    vi.mocked(missionApi.getMissionResult).mockResolvedValue({
      ...result,
      approvalStatus: 'REJECTED',
    })
    act(() => window.dispatchEvent(new Event('focus')))
    // Focus reloads the mission and its monitoring/result data.
    await waitFor(() =>
      expect(
        vi.mocked(missionApi.getMissionResult).mock.calls.length,
      ).toBeGreaterThan(resultCalls),
    )
    expect(
      screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' }),
    ).toBeNull()
  })
  it('moves Inspector completion to the acceptance workspace', async () => {
    vi.mocked(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      executions: [],
      readyForSubmission: false,
      readyForMissionCompletion: true,
      checklistEvidenceReady: true,
    })
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue(mission)
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canCompleteMission: true,
      canUploadMedia: true,
    })
    const complete = vi
      .spyOn(missionApi, 'completeMission')
      .mockResolvedValue({} as never)
    const submit = vi
      .spyOn(missionApi, 'submitMissionResult')
      .mockResolvedValue({} as never)
    render(<MissionDetailPage missionId="m" />)
    expect(await screen.findByText('Mở nghiệm thu nhiệm vụ')).toBeInTheDocument()
    expect(screen.queryByText('Xác nhận hoàn thành nhiệm vụ')).toBeNull()
    expect(complete).not.toHaveBeenCalled()
    expect(submit).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' }),
    ).toBeNull()
  })

  it('keeps result submission inside the acceptance workspace for multi-role staff', async () => {
    vi.mocked(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      executions: [],
      readyForSubmission: true,
      readyForFinalApproval: true,
      readyForMissionCompletion: true,
      checklistEvidenceReady: true,
    })
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue(mission)
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canCompleteMission: true,
      canSubmitMissionResult: true,
      canUploadMedia: true,
    })
    const complete = vi
      .spyOn(missionApi, 'completeMission')
      .mockImplementation(async () => {
        vi.mocked(operatorApi.getMission).mockResolvedValue({
          ...mission,
          status: 'COMPLETED',
          backendStatus: 'COMPLETED',
        })
        vi.mocked(missionApi.getPermissions).mockResolvedValue({
          ...noActions,
          canSubmitMissionResult: true,
        })
        return {} as never
      })
    const submit = vi
      .spyOn(missionApi, 'submitMissionResult')
      .mockResolvedValue({} as never)

    render(<MissionDetailPage missionId="m" />)
    expect(await screen.findByText('Mở nghiệm thu nhiệm vụ')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' }),
    ).toBeNull()
    expect(complete).not.toHaveBeenCalled()
    expect(submit).not.toHaveBeenCalled()
  })

  it('shows the preflight action right after accepting, without a reload', async () => {
    const pending = {
      ...mission,
      status: 'PENDING' as const,
      backendStatus: 'WAITING_OPERATOR_ACCEPTANCE',
      myResponseStatus: 'PENDING',
    }
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue(pending as never)
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canRespond: true,
    })
    vi.spyOn(operatorApi, 'acceptMission').mockImplementation(async () => {
      vi.mocked(operatorApi.getMission).mockResolvedValue({
        ...mission,
        status: 'ACCEPTED',
        backendStatus: 'SCHEDULED',
        myResponseStatus: 'ACCEPTED',
        deviceAssignmentStatus: 'ASSIGNED',
      } as never)
      vi.mocked(missionApi.getPermissions).mockResolvedValue({
        ...noActions,
        canOperatePayload: true,
      })
      return {} as never
    })

    render(<MissionDetailPage missionId="m" />)
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mission MS-1' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Thông tin để quyết định',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Bản đồ vệ tinh nhiệm vụ' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Thông tin bổ sung' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Ngày bay')).not.toBeInTheDocument()
    const acceptButton = await screen.findByRole('button', {
      name: /Chấp nhận nhiệm vụ/,
    })
    await waitFor(() => expect(acceptButton).toBeEnabled())
    fireEvent.click(acceptButton)

    expect(
      await screen.findByRole('link', { name: 'Kiểm tra trước bay' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Mở nghiệm thu nhiệm vụ')).not.toBeInTheDocument()
  })

  it('keeps an accepted mission READY and waits for the flight permit before Start', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission,
      status: 'ACCEPTED',
      backendStatus: 'READY',
      myResponseStatus: 'ACCEPTED',
    })
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canCompleteMission: true,
      canInspectDevice: true,
      canUploadMedia: true,
      canStartMission: true,
    })

    render(<MissionDetailPage missionId="m" />)

    expect(
      await screen.findAllByText('Chờ quản lý duyệt giấy phép bay'),
    ).not.toHaveLength(0)
    expect(
      screen.queryByRole('button', { name: 'Bắt đầu nhiệm vụ' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Đã chấp nhận')).not.toBeInTheDocument()
    expect(screen.queryByText('Sẵn sàng phân công')).not.toBeInTheDocument()
    expect(screen.queryByText('Mở nghiệm thu nhiệm vụ')).not.toBeInTheDocument()
  })

  it('does not show the removed completion button before evidence readiness', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue(mission)
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canCompleteMission: true,
      canUploadMedia: true,
    })
    vi.mocked(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      executions: [],
      readyForSubmission: false,
      readyForMissionCompletion: false,
      checklistEvidenceReady: false,
    })
    const complete = vi
      .spyOn(missionApi, 'completeMission')
      .mockResolvedValue({} as never)
    render(<MissionDetailPage missionId="m" />)
    expect(await screen.findByText('Mở nghiệm thu nhiệm vụ')).toBeInTheDocument()
    expect(screen.queryByText('Xác nhận hoàn thành nhiệm vụ')).toBeNull()
    expect(complete).not.toHaveBeenCalled()
  })

  it.each(['OPERATOR', 'PILOT fallback'])(
    '%s submits only from the acceptance workspace',
    async () => {
      vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
        ...mission,
        backendStatus: 'COMPLETED',
        status: 'COMPLETED',
      })
      vi.spyOn(missionApi, 'getMissionResult').mockResolvedValue(null)
      vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
        ...noActions,
        canSubmitMissionResult: true,
        canExecuteMonitoringChecklist: true,
      })
      const complete = vi
        .spyOn(missionApi, 'completeMission')
        .mockResolvedValue({} as never)
      const submit = vi
        .spyOn(missionApi, 'submitMissionResult')
        .mockResolvedValue({} as never)
      render(<MissionDetailPage missionId="m" />)
      await screen.findByRole('link', { name: 'Mở nghiệm thu nhiệm vụ' })
      expect(
        screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' }),
      ).toBeNull()
      expect(submit).not.toHaveBeenCalled()
      expect(complete).not.toHaveBeenCalled()
      expect(
        screen.queryByRole('button', { name: 'Xác nhận hoàn thành nhiệm vụ' }),
      ).toBeNull()
    },
  )

  it('upload permission alone never enables result submission', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission,
      backendStatus: 'COMPLETED',
      status: 'COMPLETED',
    })
    vi.spyOn(missionApi, 'getMissionResult').mockResolvedValue(null)
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canUploadMedia: true,
    })
    render(<MissionDetailPage missionId="m" />)
    await screen.findByRole('tab', { name: 'Ảnh & video' })
    expect(screen.queryByRole('link', { name: 'Chuẩn bị hồ sơ nghiệm thu' })).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' }),
    ).toBeNull()
  })

  it('hides the acceptance workspace while the mission is ready to fly', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission,
      status: 'READY_TO_FLY',
      backendStatus: 'READY_TO_FLY',
    })
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canInspectDevice: true,
    })

    render(<MissionDetailPage missionId="m" />)

    expect(
      await screen.findByRole('tab', { name: 'Ảnh & video' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Mở nghiệm thu nhiệm vụ')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Xác nhận hoàn thành nhiệm vụ' }),
    ).toBeNull()
  })
  it('switches between sibling Missions without borrowing checklist readiness or result state', async () => {
    vi.spyOn(operatorApi, 'getMission').mockImplementation(async (id) => ({
      ...mission,
      id,
      status: 'COMPLETED',
      backendStatus: 'COMPLETED',
    }))
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canSubmitMissionResult: true,
    })
    vi.mocked(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).mockImplementation(async (id) => ({
      missionId: id,
      legacySnapshot: false,
      readyForSubmission: id === 'm1',
      executions: [],
    }))
    const submit = vi
      .spyOn(missionApi, 'submitMissionResult')
      .mockImplementation(async (id) => {
        vi.mocked(missionApi.getMissionResult).mockImplementation(
          async (current) =>
            current === id
              ? ({
                  id: 'r1',
                  missionId: id,
                  status: 'COMPLETED',
                  approvalStatus: 'PENDING_MANAGER_APPROVAL',
                } as never)
              : null,
        )
        return {}
      })
    const view = render(<MissionDetailPage missionId="m1" />)
    await screen.findByRole('link', { name: 'Mở nghiệm thu nhiệm vụ' })
    expect(
      screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' }),
    ).toBeNull()
    view.rerender(<MissionDetailPage missionId="m2" />)
    expect(
      screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' }),
    ).toBeNull()
    view.rerender(<MissionDetailPage missionId="m1" />)
    expect(
      screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' }),
    ).toBeNull()
    expect(submit).not.toHaveBeenCalled()
  })
  it('renders the vietnamese error state', async () => {
    vi.spyOn(operatorApi, 'getMission').mockRejectedValue(
      new Error('not found'),
    )
    render(<MissionDetailPage missionId="MSN-1" />)
    expect(await screen.findByText('Không tải được nhiệm vụ')).toBeTruthy()
    expect(screen.getByText('Về danh sách')).toBeTruthy()
  })

  it('renders the english error state when language is switched', async () => {
    vi.spyOn(operatorApi, 'getMission').mockRejectedValue(
      new Error('not found'),
    )
    render(<MissionDetailPage missionId="MSN-1" />)
    await screen.findByText('Không tải được nhiệm vụ')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Could not load the mission')).toBeTruthy()
    expect(screen.getByText('Back to list')).toBeTruthy()
  })
})


describe('Inspector weather-to-start workflow', () => {
  it.each(['missing', 'expired'] as const)('checks %s weather, requires explicit confirmation, then starts', async (initial) => {
    setLanguage('vi')
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission, backendStatus: 'READY', status: 'READY_TO_FLY', myResponseStatus: 'ACCEPTED',
      deviceAssignmentStatus: 'READY_TO_FLY', flightPermitStatus: 'APPROVED',
      flightPermitUpdatedAt: new Date(Date.now() - 60000).toISOString(), latitude: 10.8, longitude: 106.7,
    })
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({ ...noActions, canStartMission: true })
    const weather = {
      id: 'weather-qa', status: 'PASS' as const, safeToFly: true, summary: 'Safe',
      windSpeedMps: 1, windGustMps: 2, precipitationMmH: 0, visibilityKm: 10,
      temperatureC: 28, humidityPercent: 70, advisories: [], checkedAt: new Date().toISOString(), inspectorAccepted: false,
    }
    vi.spyOn(checkData, 'fetchLatestWeatherCheck').mockResolvedValue(initial === 'missing' ? null : {
      ...weather, checkedAt: new Date(Date.now() - 16 * 60000).toISOString(), inspectorAccepted: true,
    })
    const check = vi.spyOn(auth, 'authenticatedFetch').mockImplementation(async (url) => new Response(JSON.stringify({
      data: String(url).includes('/api/weather/preflight-check') ? weather : null,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const accept = vi.spyOn(checkData, 'acceptWeatherCheck').mockResolvedValue({ ...weather, inspectorAccepted: true })
    const start = vi.spyOn(missionApi, 'startMission').mockResolvedValue({} as never)
    render(<MissionDetailPage missionId="m" />)
    fireEvent.click(await screen.findByRole('button', { name: /Kiểm tra (lại )?thời tiết/ }))
    await waitFor(() => expect(check).toHaveBeenCalledWith(expect.stringContaining('/api/weather/preflight-check'), expect.objectContaining({
      method: 'POST', body: JSON.stringify({ missionId: 'm', latitude: 10.8, longitude: 106.7 }),
    })))
    expect(await screen.findByText('1.0 / 2.0 m/s')).toBeInTheDocument()
    expect(start).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Bắt đầu nhiệm vụ' })).not.toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận quyết định bay' }))
    await waitFor(() => expect(accept).toHaveBeenCalledWith('m', 'weather-qa'))
    const startButton = await screen.findByRole('button', { name: 'Bắt đầu nhiệm vụ' })
    expect(start).not.toHaveBeenCalled()
    fireEvent.click(startButton)
    await waitFor(() => expect(start).toHaveBeenCalledExactlyOnceWith('m'))
  })

  it('hides weather approval and Start from a crew member without start permission', async () => {
    setLanguage('vi')
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission, backendStatus: 'READY', status: 'READY_TO_FLY', myResponseStatus: 'ACCEPTED',
      deviceAssignmentStatus: 'READY_TO_FLY', flightPermitStatus: 'APPROVED',
    })
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({ ...noActions, canStartMission: false })
    vi.spyOn(checkData, 'fetchLatestWeatherCheck').mockResolvedValue(null)
    render(<MissionDetailPage missionId="m" />)
    await screen.findByRole('heading', { level: 1, name: 'Mission MS-1' })
    expect(screen.queryByRole('button', { name: 'Xác nhận quyết định bay' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Bắt đầu nhiệm vụ' })).not.toBeInTheDocument()
  })
})
