import 'fake-indexeddb/auto'
import { authSession } from '../../../../auth/api/authSession'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render as renderComponent,
  screen,
  waitFor,
} from '@testing-library/react'
import { ConfigProvider } from 'antd'
import type { ReactNode } from 'react'
import { UploadMediaPage } from '../UploadMediaPage'
import { missionApi } from '../../../../mission/api/missionApi'
import { checklistExecutionApi } from '../../../../mission/api/checklistExecutionApi'
import {
  operatorMediaApi,
  type LocalMedia,
} from '../../../../media/api/operatorMediaApi'
import { operatorMissionMediaApi } from '../../../../media/api/operatorMissionMediaApi'
import { flightControlApi } from '../../../api/flightControlApi'
import { ApiError } from '../../../../../shared/api/httpClient'
import { checklistEvidenceApi } from '../../../../mission/api/checklistEvidenceApi'

const render = (ui: ReactNode) =>
  renderComponent(
    <ConfigProvider theme={{ token: { motion: false } }}>{ui}</ConfigProvider>,
  )

const active = vi.hoisted(() => ({ status: 'PENDING_REVIEW', reload: vi.fn() }))
vi.mock('../../../api/useActiveMission', () => ({
  useActiveMission: () => ({
    data: {
      id: 'm',
      missionCode: 'MS-1',
      status: active.status,
      deviceId: 'd',
      managerName: 'Seed Manager 1',
      managerEmail: 'seed.manager@odms.local',
      managerPhone: '0902000001',
      staffAssignments: [
        {
          assignedRole: 'INSPECTOR',
          staffName: 'Seed Staff 3',
          staffEmail: 'seed.drone.operator.3@odms.local',
          staffPhone: '0901000003',
          responseStatus: 'ACCEPTED',
        },
      ],
    },
    reload: active.reload,
  }),
}))
const permissions = {
  canRespond: false,
  canControlFlight: false,
  canOperatePayload: false,
  canInspectDevice: false,
  canMaintainDevice: false,
  canUploadMedia: false,
  canExecuteMonitoringChecklist: true,
}
const media: LocalMedia = {
  localMediaId: 'local',
  missionId: 'm',
  deviceId: 'd',
  mediaType: 'IMAGE',
  fileName: 'capture.jpg',
  contentType: 'image/jpeg',
  fileSize: 200,
  checksumSha256: 'checksum',
  capturedAt: '2026-10-05T00:00:00Z',
  status: 'REVIEW_PENDING',
}
beforeEach(() => {
  vi.spyOn(authSession, 'getUser').mockReturnValue({
    id: crypto.randomUUID(),
    role: 'STAFF',
  } as never)
  vi.spyOn(authSession, 'isLoggedOut').mockReturnValue(false)
  active.status = 'PENDING_REVIEW'
  active.reload.mockClear()
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
  vi.spyOn(missionApi, 'getPermissions').mockResolvedValue(permissions)
  vi.spyOn(missionApi, 'getMissionResult').mockResolvedValue(null)
  vi.spyOn(flightControlApi, 'bindSession').mockResolvedValue({} as never)
  vi.spyOn(operatorMediaApi, 'reviewItems').mockResolvedValue([media])
  vi.spyOn(operatorMediaApi, 'status').mockResolvedValue({
    status: 'VALIDATING',
    attemptNumber: 1,
  } as never)
  vi.spyOn(operatorMissionMediaApi, 'list').mockResolvedValue({
    items: [],
    page: 0,
    totalItems: 0,
    totalPages: 0,
    first: true,
    last: true,
  })
  vi.spyOn(
    checklistExecutionApi,
    'getMissionChecklistExecutions',
  ).mockResolvedValue({
    missionId: 'm',
    readyForSubmission: false,
    legacySnapshot: false,
    executions: [
      {
        id: 'e',
        orderChecklistItemId: 'h',
        content: 'Quan sát hàng rào',
        displayOrder: 1,
        sourceType: 'CUSTOMER_CUSTOM',
        executionStatus: 'PENDING',
        assessmentStatus: 'NOT_ASSESSED',
        observation: null,
        unableToVerifyReason: null,
        version: 4,
        startedAt: null,
        completedAt: null,
        lastModifiedBy: null,
        createdAt: '2026-10-05T00:00:00Z',
        updatedAt: null,
      },
    ],
  })
})
afterEach(() => vi.restoreAllMocks())
describe('Upload media and monitoring workspace', () => {
  it('retains the server video poster when the uploaded file is still local', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({ ...permissions, canUploadMedia: true })
    vi.mocked(operatorMediaApi.reviewItems).mockResolvedValue([{ ...media, backendMediaId: 'server-video', mediaType: 'VIDEO', contentType: 'video/mp4', fileName: 'clip.mp4', status: 'AVAILABLE', localAvailable: true }])
    vi.mocked(operatorMissionMediaApi.list).mockResolvedValue({ items: [{ mediaId: 'server-video', missionId: 'm', deviceId: 'd', mediaType: 'VIDEO', fileName: 'clip.mp4', contentType: 'video/mp4', fileSize: 200, capturedAt: media.capturedAt, availableAt: null, downloadUrl: 'https://example.test/original.mp4', thumbnailUrl: 'https://example.test/poster.jpg', previewUrl: 'https://example.test/preview.mp4', status: 'AVAILABLE', urlExpiresAt: '' }], page: 0, totalItems: 1, totalPages: 1, first: true, last: true })
    render(<UploadMediaPage missionId="m" />)
    const open = await screen.findByRole('button', { name: 'Xem video clip.mp4' })
    expect(open.querySelector('img')).toHaveAttribute('src', 'https://example.test/poster.jpg')
    expect(document.querySelector('video')).toBeNull()
    fireEvent.click(open)
    expect(await screen.findByLabelText('clip.mp4', { selector: 'video' })).toHaveAttribute('src', 'https://example.test/preview.mp4')
  })
  it('keeps readonly acceptance free of the removed contact notice', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canInspectDevice: true,
      canAssessMonitoringChecklist: true,
      canExecuteMonitoringChecklist: false,
    })
    render(<UploadMediaPage missionId="m" />)

    await screen.findAllByText('capture.jpg')
    expect(screen.queryByText('Liên hệ Manager')).toBeNull()
    expect(screen.queryByText('Liên hệ người nghiệm thu')).toBeNull()
    expect(screen.queryByRole('link', { name: /Gọi 090/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Tải tất cả lên' })).toBeNull()
  })
  it.each([
    { canAssess: false, canInspect: true, confirmed: false },
    { canAssess: true, canInspect: false, confirmed: false },
    { canAssess: true, canInspect: true, confirmed: true },
  ])(
    'gates media review by assessment permission and frozen result: $canAssess / $canInspect / $confirmed',
    async ({ canAssess, canInspect, confirmed }) => {
      active.status = 'IN_PROGRESS'
      if (confirmed)
        vi.mocked(missionApi.getMissionResult).mockResolvedValue({
          missionId: 'm',
          approvalStatus: 'APPROVED',
          inspectorConfirmed: true,
        } as never)
      vi.mocked(missionApi.getPermissions).mockResolvedValue({
        ...permissions,
        canInspectDevice: canInspect,
        canAssessMonitoringChecklist: canAssess,
        canAttachChecklistEvidence: true,
        canExecuteMonitoringChecklist: false,
      })
      vi.mocked(operatorMissionMediaApi.list).mockResolvedValue({
        items: [
          {
            mediaId: 'backend-media',
            missionId: 'm',
            deviceId: 'd',
            mediaType: 'IMAGE',
            status: 'PENDING_MANAGER_APPROVAL',
            fileName: 'pilot-upload.jpg',
            contentType: 'image/jpeg',
            fileSize: 200,
            capturedAt: '2026-10-05T00:00:00Z',
            availableAt: null,
            downloadUrl: '/preview/pilot-upload.jpg',
          },
        ],
        page: 0,
        totalItems: 1,
        totalPages: 1,
        first: true,
        last: true,
      })
      const approve = vi
        .spyOn(operatorMissionMediaApi, 'approve')
        .mockResolvedValue({})

      render(<UploadMediaPage missionId="m" />)

      await screen.findAllByText('pilot-upload.jpg')
      if (!canAssess || confirmed) {
        expect(
          screen.queryByRole('button', { name: 'Duyệt bằng chứng' }),
        ).toBeNull()
        expect(approve).not.toHaveBeenCalled()
        return
      }
      fireEvent.click(
        await screen.findByRole('button', {
          name: 'Duyệt bằng chứng',
        }),
      )
      await waitFor(() =>
        expect(approve).toHaveBeenCalledWith('m', 'backend-media'),
      )
      expect(screen.getByText('Đã duyệt bằng chứng.')).toBeInTheDocument()
    },
  )
  it('shows rejected media as uploaded, prevents duplicate transfer, and blocks checklist attachment', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canUploadMedia: true,
      canAttachChecklistEvidence: true,
    })
    vi.mocked(operatorMediaApi.reviewItems).mockResolvedValue([
      {
        ...media,
        backendMediaId: 'rejected-media',
        status: 'REJECTED',
      },
    ])
    vi.mocked(operatorMediaApi.status).mockResolvedValue({
      status: 'REJECTED',
      attemptNumber: 1,
    } as never)

    render(<UploadMediaPage missionId="m" />)

    expect(await screen.findAllByText('Bị từ chối')).toHaveLength(2)
    expect(
      screen.getByText(
        'Media đã bị từ chối. Liên hệ nghiệm thu viên để biết thêm.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tải ảnh lên' })).toBeNull()
    expect(screen.queryByText('Gắn vào checklist')).toBeNull()
    expect(
      screen.queryByRole('progressbar', { name: 'media đã tải lên' }),
    ).not.toBeInTheDocument()
  })
  it('allows one capture to target multiple historical checklist executions', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canUploadMedia: true,
      canAttachChecklistEvidence: true,
      canExecuteMonitoringChecklist: false,
    })
    const snapshot =
      await checklistExecutionApi.getMissionChecklistExecutions('m')
    vi.mocked(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).mockResolvedValue({
      ...snapshot,
      executions: [
        snapshot.executions[0],
        {
          ...snapshot.executions[0],
          id: 'e2',
          content: 'Khu vực phía Bắc',
          version: 2,
        },
      ],
    })
    vi.spyOn(operatorMediaApi, 'upload').mockImplementation(
      async (_item, _manual, prepared) => {
        await prepared?.('backend-media')
        return 'backend-media'
      },
    )
    const attach = vi.spyOn(checklistEvidenceApi, 'batch').mockResolvedValue([])
    render(<UploadMediaPage missionId="m" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Gắn vào checklist' }),
    )
    fireEvent.click(
      await screen.findByRole('checkbox', { name: /Quan sát hàng rào/ }),
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /Khu vực phía Bắc/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Gắn vào 2 mục' }))
    await waitFor(() =>
      expect(attach.mock.calls.flatMap((call) => call[2])).toEqual([
        { executionId: 'e', expectedVersion: 4 },
        { executionId: 'e2', expectedVersion: 2 },
      ]),
    )
  })
  it('uploads then attaches using backend media id and recovers attach failure without another upload', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canUploadMedia: true,
      canAttachChecklistEvidence: true,
      canExecuteMonitoringChecklist: false,
    })
    vi.mocked(operatorMediaApi.reviewItems).mockResolvedValue([
      { ...media, sourceType: 'DRONE_CAMERA' },
    ])
    const upload = vi
      .spyOn(operatorMediaApi, 'upload')
      .mockImplementation(async (_item, _manual, prepared) => {
        await prepared?.('backend-media')
        return 'backend-media'
      })
    const attach = vi
      .spyOn(checklistEvidenceApi, 'batch')
      .mockRejectedValueOnce(new Error('attach failed'))
      .mockResolvedValue([])
    render(<UploadMediaPage missionId="m" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Gắn vào checklist' }),
    )
    fireEvent.click(
      await screen.findByRole('checkbox', { name: /Quan sát hàng rào/ }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Gắn vào 1 mục' }))
    // IndexedDB recovery includes a bounded 10-second wait, so the test deadline must cover it.
    await screen.findByRole('button', { name: 'Thử lại' }, { timeout: 10000 })
    expect(attach).toHaveBeenCalledWith('m', 'backend-media', [
      { executionId: 'e', expectedVersion: 4 },
    ])
    fireEvent.click(
      await screen.findByRole(
        'button',
        { name: 'Thử lại' },
        { timeout: 10000 },
      ),
    )
    await waitFor(() => expect(attach).toHaveBeenCalledTimes(2))
    expect(upload).toHaveBeenCalledOnce()
  }, 15000)
  it('shows captured images and lets a reporting pilot edit status without assessment', async () => {
    render(<UploadMediaPage missionId="m" mode="checklist" />)
    await screen.findByText('Quan sát hàng rào')
    fireEvent.click(
      await screen.findByRole('button', { name: /Quan sát hàng rào/ }),
    )
    expect(await screen.findByText('Cập nhật mục')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Danh sách media' }),
    ).toHaveAttribute('href', '#portal/staff/upload/m')
    if (!screen.queryByText('Cập nhật mục'))
      fireEvent.click(
        await screen.findByRole('button', { name: /Quan sát hàng rào/ }),
      )
    fireEvent.click(await screen.findByText('Cập nhật mục'))
    expect(screen.getByLabelText('Trạng thái thực hiện')).toBeEnabled()
    expect(screen.queryByLabelText('Đánh giá nghiệm thu')).toBeNull()
  })
  it('lets only the Inspector edit the acceptance assessment', async () => {
    active.status = 'IN_PROGRESS'
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canInspectDevice: true,
      canAssessMonitoringChecklist: true,
      canExecuteMonitoringChecklist: false,
      canSubmitMissionResult: false,
    })

    render(<UploadMediaPage missionId="m" mode="checklist" />)

    if (!screen.queryByText('Cập nhật mục'))
      fireEvent.click(
        await screen.findByRole('button', { name: /Quan sát hàng rào/ }),
      )
    fireEvent.click(await screen.findByText('Cập nhật mục'))
    expect(screen.queryByLabelText('Trạng thái thực hiện')).toBeNull()
    expect(screen.getByLabelText('Đánh giá nghiệm thu')).toBeEnabled()
  })
  it('saves a checklist item directly on upload screen with expectedVersion', async () => {
    active.status = 'COMPLETED'
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canSubmitMissionResult: true,
    })
    const save = vi
      .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
      .mockImplementation(async () => {
        vi.mocked(
          checklistExecutionApi.getMissionChecklistExecutions,
        ).mockResolvedValue({
          missionId: 'm',
          legacySnapshot: false,
          readyForSubmission: true,
          readyForFinalApproval: true,
          executions: [],
        })
        return {} as never
      })
    render(<UploadMediaPage missionId="m" mode="checklist" />)
    if (!screen.queryByText('Cập nhật mục'))
      fireEvent.click(
        await screen.findByRole('button', { name: /Quan sát hàng rào/ }),
      )
    fireEvent.click(await screen.findByText('Cập nhật mục'))
    fireEvent.change(screen.getByLabelText('Trạng thái thực hiện'), {
      target: { value: 'COMPLETED' },
    })
    fireEvent.click(screen.getByText('Lưu mục'))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        'm',
        'e',
        expect.objectContaining({
          expectedVersion: 4,
          executionStatus: 'COMPLETED',
        }),
      ),
    )
    expect(
      screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' }),
    ).toBeNull()
    expect(active.reload).toHaveBeenCalled()
  })
  it('keeps checklist and media as separate primary pages', async () => {
    render(<UploadMediaPage missionId="m" />)
    await screen.findByAltText('capture.jpg')
    expect(screen.queryByText('Chỉnh sửa')).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Checklist thực hiện' }),
    ).toHaveAttribute('href', '#portal/staff/checklist/m')
    expect(screen.queryByText('Upload ảnh')).not.toBeInTheDocument()
  })
  it('does not claim batch success after an upload fails', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canUploadMedia: true,
    })
    vi.spyOn(operatorMediaApi, 'upload').mockRejectedValue(
      new Error('S3 upload failed'),
    )
    render(<UploadMediaPage missionId="m" />)
    await screen.findByAltText('capture.jpg')
    fireEvent.click(await screen.findByText('Tải tất cả lên'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'S3 upload failed',
    )
    expect(screen.queryByText(/Đã gửi các tệp chờ tải/)).toBeNull()
  })

  it('separates multi-role acceptance from submission and refreshes Mission', async () => {
    active.status = 'IN_PROGRESS'
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canCompleteMission: true,
      canSubmitMissionResult: true,
      canAssessMonitoringChecklist: true,
    })
    vi.mocked(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      readyForSubmission: true,
      readyForFinalApproval: true,
      readyForMissionCompletion: true,
      executions: [],
    })
    const complete = vi
      .spyOn(missionApi, 'completeMission')
      .mockImplementation(async () => {
        active.status = 'COMPLETED'
        vi.mocked(missionApi.getPermissions).mockResolvedValue({
          ...permissions,
          canSubmitMissionResult: true,
          canAssessMonitoringChecklist: true,
        })
        return {} as never
      })
    const submit = vi
      .spyOn(missionApi, 'submitMissionResult')
      .mockImplementation(async () => {
        vi.mocked(missionApi.getMissionResult).mockResolvedValue({
          id: 'r',
          missionId: 'm',
          status: 'COMPLETED',
          approvalStatus: 'PENDING_MANAGER_APPROVAL',
        } as never)
        return {} as never
      })
    render(<UploadMediaPage missionId="m" />)
    expect(
      await screen.findByRole('button', { name: 'Xác nhận nghiệm thu' }),
    ).toBeEnabled()
    fireEvent.click(
      screen.getByRole('button', { name: 'Xác nhận hoàn thành Mission' }),
    )
    await waitFor(() => expect(complete).toHaveBeenCalledWith('m'))
    expect(submit).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Xác nhận nghiệm thu' }),
      ).toBeEnabled(),
    )
    expect(active.reload).toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'Xác nhận hoàn thành Mission' }),
    ).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận nghiệm thu' }))
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith(
        'm',
        expect.objectContaining({ status: 'COMPLETED' }),
      ),
    )
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' }),
      ).toBeNull(),
    )
    expect(complete).toHaveBeenCalledOnce()
    expect(
      screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' }),
    ).toBeNull()
  })

  it('shows pending result without a duplicate submit action', async () => {
    active.status = 'COMPLETED'
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canSubmitMissionResult: true,
      canAssessMonitoringChecklist: true,
    })
    vi.mocked(missionApi.getMissionResult).mockResolvedValue({
      id: 'r',
      missionId: 'm',
      status: 'COMPLETED',
      approvalStatus: 'PENDING_MANAGER_APPROVAL',
    } as never)
    render(<UploadMediaPage missionId="m" />)
    await screen.findByText('Hồ sơ đang chờ xác nhận nghiệm thu.')
    expect(
      screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' }),
    ).toBeNull()
  })

  it('blocks known-incomplete checklist with a localized count and no submit', async () => {
    active.status = 'COMPLETED'
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canSubmitMissionResult: true,
      canAssessMonitoringChecklist: true,
    })
    const submit = vi.spyOn(missionApi, 'submitMissionResult')
    render(<UploadMediaPage missionId="m" />)
    const button = await screen.findByRole('button', {
      name: 'Xác nhận nghiệm thu',
    })
    expect(button).toBeDisabled()
    expect(
      screen.getByText('Còn 1 mục checklist chưa hoàn tất.'),
    ).toBeInTheDocument()
    fireEvent.click(button)
    expect(submit).not.toHaveBeenCalled()
  })

  it('does not implicitly attach evidence, complete or submit from an unready final action', async () => {
    active.status = 'COMPLETED'
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canSubmitMissionResult: true,
      canAssessMonitoringChecklist: true,
      canAttachChecklistEvidence: true,
    })
    const snapshot =
      await checklistExecutionApi.getMissionChecklistExecutions('m')
    vi.mocked(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).mockResolvedValue({
      ...snapshot,
      executions: [
        {
          ...snapshot.executions[0],
          executionStatus: 'COMPLETED',
          minimumEvidenceCount: 1,
          eligibleEvidenceCount: 0,
        },
      ],
    })
    const attach = vi.spyOn(checklistEvidenceApi, 'batch')
    const complete = vi.spyOn(missionApi, 'completeMission')
    const submit = vi.spyOn(missionApi, 'submitMissionResult')
    render(<UploadMediaPage missionId="m" />)
    const button = await screen.findByRole('button', {
      name: 'Xác nhận nghiệm thu',
    })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(attach).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
    expect(submit).not.toHaveBeenCalled()
  })

  it('blocks inspection with unapproved media despite operational readiness', async () => {
    active.status = 'COMPLETED'
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canSubmitMissionResult: true,
      canAssessMonitoringChecklist: true,
    })
    vi.mocked(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      readyForSubmission: true,
      readyForFinalApproval: false,
      executions: [],
      blockingReasons: ['MEDIA_APPROVAL_REQUIRED'],
    })
    const complete = vi.spyOn(missionApi, 'completeMission')
    const submit = vi
      .spyOn(missionApi, 'submitMissionResult')
      .mockResolvedValue({})
    render(<UploadMediaPage missionId="m" />)
    const button = await screen.findByRole('button', {
      name: 'Xác nhận nghiệm thu',
    })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(submit).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
  })

  it('refreshes authoritative state and localizes stale submit errors', async () => {
    active.status = 'COMPLETED'
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canSubmitMissionResult: true,
      canAssessMonitoringChecklist: true,
    })
    vi.mocked(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      readyForSubmission: true,
      readyForMissionCompletion: true,
      readyForFinalApproval: true,
      executions: [],
    })
    vi.spyOn(missionApi, 'submitMissionResult').mockRejectedValue(
      new ApiError('Monitoring checklist is not ready for result submission', {
        code: 'CHECKLIST_NOT_READY',
        status: 409,
        method: 'POST',
        path: '/result',
      }),
    )
    render(<UploadMediaPage missionId="m" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Xác nhận nghiệm thu' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Checklist chưa hoàn tất hoặc chưa đủ bằng chứng hợp lệ.',
    )
    expect(screen.queryByText(/Monitoring checklist/)).toBeNull()
    expect(active.reload).toHaveBeenCalled()
  })

  it('refreshes permissions and fails closed after a permission fetch failure', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canUploadMedia: true,
    })
    render(<UploadMediaPage missionId="m" />)
    await screen.findByRole('button', { name: 'Tải tất cả lên' })
    vi.mocked(missionApi.getPermissions).mockRejectedValue(new Error('denied'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Làm mới' })[0])
    await screen.findByText('Chỉ xem media')
    expect(screen.queryByRole('button', { name: 'Tải tất cả lên' })).toBeNull()
    expect(screen.queryByText('Tải ảnh lên')).toBeNull()
  })
})
