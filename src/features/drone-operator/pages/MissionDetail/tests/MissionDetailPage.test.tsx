import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

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
  it('missing permission response keeps legacy detail readable without granting actions', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue(mission)
    // Deliberately malformed response, outside the typed API contract.
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue(null as never)
    render(<MissionDetailPage missionId="m" />)
    expect((await screen.findAllByText('MS-1'))[0]).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(
      screen.queryByRole('button', { name: 'Hoàn thành Mission' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Mở buồng lái' }),
    ).not.toBeInTheDocument()
  })
  it('historical confirmed ready exposes postflight close-out, never new flight', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission,
      status: 'READY_TO_FLY',
      backendStatus: 'READY_TO_FLY',
      safeStopStatus: 'IN_PROGRESS',
      safeStopConfirmedAt: 'now',
    })
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canPrepareSafeStopPostflight: true,
    })
    const postflight = vi
      .spyOn(missionApi, 'startPostflight')
      .mockResolvedValue({ id: 'm', status: 'POSTFLIGHT_CHECKING' } as Awaited<
        ReturnType<typeof missionApi.startPostflight>
      >)
    render(<MissionDetailPage missionId="m" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Chuẩn bị kiểm tra sau bay' }),
    )
    await waitFor(() => expect(postflight).toHaveBeenCalledWith('m'))
    expect(
      screen.queryByRole('link', { name: 'Mở buồng lái' }),
    ).not.toBeInTheDocument()
  })
  it.each([
    ['REQUESTED', undefined, undefined, 'Đang dừng an toàn'],
    ['IN_PROGRESS', 'now', undefined, 'Đã xác nhận an toàn'],
    ['READY_FOR_CANCELLATION', 'now', 'now', 'Sẵn sàng hủy'],
  ])(
    'safe-stop %s dominates detail despite stale normal permissions',
    async (safeStopStatus, safeStopConfirmedAt, safeStopCleanedAt, label) => {
      vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
        ...mission,
        backendStatus: 'READY_TO_FLY',
        status: 'READY_TO_FLY',
        safeStopStatus,
        safeStopConfirmedAt,
        safeStopCleanedAt,
      })
      vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
        ...noActions,
        canControlFlight: true,
        canOperatePayload: true,
      })
      render(<MissionDetailPage missionId="m" />)
      expect((await screen.findAllByText(label))[0]).toBeInTheDocument()
      expect(
        screen.queryByRole('link', { name: 'Mở buồng lái' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('link', { name: 'Kết nối GCS' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText('Quy trình: sẵn sàng bàn giao'),
      ).not.toBeInTheDocument()
    },
  )
  it('shows GCS connection before preflight for a scheduled accepted mission', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission,
      backendStatus: 'SCHEDULED',
      status: 'SCHEDULED',
      myResponseStatus: 'ACCEPTED',
    })
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canOperatePayload: true,
    })

    render(<MissionDetailPage missionId="m" />)

    expect(await screen.findByText('Kết nối GCS')).toBeInTheDocument()
    expect(screen.queryByText('Kiểm tra thiết bị')).toBeNull()
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
      await screen.findByText('Monitoring lịch sử')
      if (canExecuteMonitoringChecklist)
        expect(screen.getByText('Cập nhật mục')).toBeInTheDocument()
      else expect(screen.queryByText('Cập nhật mục')).toBeNull()
      if (canCompleteMission) {
        expect(await screen.findByText('Mở dữ liệu nghiệm thu')).toBeInTheDocument()
        expect(screen.queryByText('Xác nhận hoàn thành nhiệm vụ')).toBeNull()
      }
      expect(
        screen.queryByRole('button', { name: 'Gửi kết quả cho quản lý' }),
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
    expect(
      await screen.findByText('Chưa sẵn sàng gửi kết quả'),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'Gửi kết quả cho quản lý' }),
    ).toBeDisabled()
  })
  it('keeps mission detail stable on focus and refreshes result status only from the checklist button', async () => {
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
    await screen.findByText(
      'Chỉ đọc: kết quả đang chờ duyệt hoặc đã được duyệt.',
    )
    vi.mocked(missionApi.getMissionResult).mockResolvedValue({
      ...result,
      approvalStatus: 'REJECTED',
    })
    act(() => window.dispatchEvent(new Event('focus')))
    expect(
      screen.queryByRole('button', { name: 'Gửi kết quả cho quản lý' }),
    ).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Tải lại/ }))
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Gửi kết quả cho quản lý' }),
      ).toBeEnabled(),
    )
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
    expect(await screen.findByText('Mở dữ liệu nghiệm thu')).toBeInTheDocument()
    expect(screen.queryByText('Xác nhận hoàn thành nhiệm vụ')).toBeNull()
    expect(complete).not.toHaveBeenCalled()
    expect(submit).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'Gửi kết quả cho quản lý' }),
    ).toBeNull()
  })

  it('lets a multi-role staff complete and submit in one action', async () => {
    vi.mocked(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      executions: [],
      readyForSubmission: true,
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
    fireEvent.click(
      await screen.findByRole('button', { name: 'Gửi kết quả cho quản lý' }),
    )

    await waitFor(() => expect(complete).toHaveBeenCalledWith('m'))
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith(
        'm',
        expect.objectContaining({
          notes: 'Kết quả giám sát được gửi cho manager duyệt.',
          status: 'COMPLETED',
        }),
      ),
    )
  })

  it('shows "Kết nối GCS" right after accepting, without a reload', async () => {
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
      } as never)
      vi.mocked(missionApi.getPermissions).mockResolvedValue({
        ...noActions,
        canOperatePayload: true,
      })
      return {} as never
    })

    render(<MissionDetailPage missionId="m" />)
    fireEvent.click(
      await screen.findByRole('button', { name: /Chấp nhận nhiệm vụ/ }),
    )

    expect(
      await screen.findByRole('link', { name: 'Kết nối GCS' }),
    ).toBeInTheDocument()
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
    expect(await screen.findByText('Mở dữ liệu nghiệm thu')).toBeInTheDocument()
    expect(screen.queryByText('Xác nhận hoàn thành nhiệm vụ')).toBeNull()
    expect(complete).not.toHaveBeenCalled()
  })

  it.each(['OPERATOR', 'PILOT fallback'])(
    '%s submits using backend capability, not upload permission',
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
      fireEvent.click(
        await screen.findByRole('button', { name: 'Gửi kết quả cho quản lý' }),
      )
      await waitFor(() =>
        expect(submit).toHaveBeenCalledWith('m', expect.any(Object)),
      )
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
    await screen.findByText('Mở dữ liệu nghiệm thu')
    expect(
      screen.queryByRole('button', { name: 'Gửi kết quả cho quản lý' }),
    ).toBeNull()
  })

  it('lets the inspector view Pilot media while the mission is ready to fly', async () => {
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

    expect(await screen.findByText('Mở dữ liệu nghiệm thu')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Ảnh & video' })).toBeInTheDocument()
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
    const first = await screen.findByRole('button', {
      name: 'Gửi kết quả cho quản lý',
    })
    expect(first).toBeEnabled()
    view.rerender(<MissionDetailPage missionId="m2" />)
    expect(
      await screen.findByRole('button', { name: 'Gửi kết quả cho quản lý' }),
    ).toBeDisabled()
    view.rerender(<MissionDetailPage missionId="m1" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Gửi kết quả cho quản lý' }),
    )
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith('m1', expect.any(Object)),
    )
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Gửi kết quả cho quản lý' }),
      ).toBeNull(),
    )
    expect(submit).toHaveBeenCalledOnce()
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
