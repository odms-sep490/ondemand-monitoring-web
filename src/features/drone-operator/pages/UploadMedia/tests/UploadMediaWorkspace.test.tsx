import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  it('shows the Manager phone to the Inspector in readonly acceptance mode', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canInspectDevice: true,
      canExecuteMonitoringChecklist: false,
    })
    render(<UploadMediaPage missionId="m" />)

    expect(await screen.findByText('Liên hệ Manager')).toBeInTheDocument()
    expect(screen.getByText('Seed Manager 1')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Gọi 0902000001' }),
    ).toHaveAttribute('href', 'tel:0902000001')
    expect(screen.queryByText('Gọi 0901000003')).toBeNull()
  })
  it('lets the Inspector approve uploaded Pilot media while the mission is in flight', async () => {
    active.status = 'IN_FLIGHT'
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canInspectDevice: true,
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

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Duyệt media cho khách hàng',
      }),
    )
    await waitFor(() =>
      expect(approve).toHaveBeenCalledWith('m', 'backend-media'),
    )
    expect(
      screen.getByText('Đã duyệt media trong phiên này'),
    ).toBeInTheDocument()
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
    vi.spyOn(operatorMediaApi, 'upload').mockResolvedValue('backend-media')
    const attach = vi.spyOn(checklistEvidenceApi, 'batch').mockResolvedValue([])
    render(<UploadMediaPage missionId="m" />)
    fireEvent.click(
      await screen.findByRole('checkbox', { name: /Quan sát hàng rào/ }),
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /Khu vực phía Bắc/ }))
    fireEvent.click(screen.getByText('Upload ảnh'))
    await waitFor(() =>
      expect(attach).toHaveBeenCalledWith('m', 'backend-media', [
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
      .mockResolvedValue('backend-media')
    const attach = vi
      .spyOn(checklistEvidenceApi, 'batch')
      .mockRejectedValueOnce(new Error('attach failed'))
      .mockResolvedValue([])
    render(<UploadMediaPage missionId="m" />)
    fireEvent.click(
      await screen.findByRole('checkbox', { name: /Quan sát hàng rào/ }),
    )
    fireEvent.click(screen.getByText('Upload ảnh'))
    await screen.findByText(/Gắn bằng chứng chưa thành công/)
    expect(attach).toHaveBeenCalledWith('m', 'backend-media', [
      { executionId: 'e', expectedVersion: 4 },
    ])
    const retry = await screen.findByText('Gắn bằng chứng — không upload lại')
    await waitFor(() => expect(retry).toBeEnabled())
    fireEvent.click(retry)
    await waitFor(() => expect(attach).toHaveBeenCalledTimes(2))
    expect(upload).toHaveBeenCalledOnce()
  })
  it('shows captured images and lets a reporting pilot edit status without assessment', async () => {
    render(<UploadMediaPage missionId="m" />)
    await screen.findByText('Quan sát hàng rào')
    expect(screen.getByText('Chỉnh sửa')).toBeInTheDocument()
    const image = await screen.findByAltText('capture.jpg')
    expect(image).toHaveClass('upload-media-preview')
    expect(screen.queryByText('Upload ảnh')).toBeNull()
    expect(
      screen.getByText(/Upload ảnh cần Pilot hoặc Inspector/),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByText('Chỉnh sửa'))
    expect(screen.getByLabelText('Trạng thái thực hiện')).toBeEnabled()
    expect(screen.queryByLabelText('Đánh giá nghiệm thu')).toBeNull()
    fireEvent.click(screen.getByText('Xem ảnh lớn'))
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce()
  })
  it('lets only the Inspector edit the acceptance assessment', async () => {
    active.status = 'IN_FLIGHT'
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canInspectDevice: true,
      canExecuteMonitoringChecklist: false,
      canSubmitMissionResult: false,
    })

    render(<UploadMediaPage missionId="m" />)

    fireEvent.click(await screen.findByText('Chỉnh sửa'))
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
          executions: [],
        })
        return {} as never
      })
    render(<UploadMediaPage missionId="m" />)
    fireEvent.click(await screen.findByText('Chỉnh sửa'))
    fireEvent.change(screen.getByLabelText('Trạng thái thực hiện'), {
      target: { value: 'COMPLETED' },
    })
    fireEvent.click(screen.getByText('Lưu'))
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
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Gửi kết quả cho Manager' }),
      ).toBeEnabled(),
    )
    expect(active.reload).toHaveBeenCalled()
  })
  it('offers upload to Inspector while the monitoring checklist is read-only', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canUploadMedia: true,
      canExecuteMonitoringChecklist: false,
    })
    const upload = vi
      .spyOn(operatorMediaApi, 'upload')
      .mockResolvedValue('backend-media')
    render(<UploadMediaPage missionId="m" />)
    await screen.findByText('Quan sát hàng rào')
    expect(screen.queryByText('Cập nhật mục')).toBeNull()
    fireEvent.click(await screen.findByText('Upload ảnh'))
    await waitFor(() =>
      expect(upload).toHaveBeenCalledWith(
        expect.objectContaining({ localMediaId: 'local' }),
        false,
      ),
    )
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
    fireEvent.click(await screen.findByText('Upload tất cả'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'S3 upload failed',
    )
    expect(screen.queryByText(/Đã gửi các file đang chờ/)).toBeNull()
  })

  it('separates multi-role acceptance from submission and refreshes Mission', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canCompleteMission: true,
      canSubmitMissionResult: true,
    })
    vi.mocked(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      readyForSubmission: true,
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
      await screen.findByRole('button', { name: 'Gửi kết quả cho Manager' }),
    ).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận hoàn thành Mission' }))
    await waitFor(() => expect(complete).toHaveBeenCalledWith('m'))
    expect(submit).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Gửi kết quả cho Manager' }),
      ).toBeEnabled(),
    )
    expect(active.reload).toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'Xác nhận hoàn thành Mission' }),
    ).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: 'Gửi kết quả cho Manager' }),
    )
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith(
        'm',
        expect.objectContaining({ status: 'COMPLETED' }),
      ),
    )
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Gửi kết quả cho Manager' }),
      ).toBeNull(),
    )
    expect(complete).toHaveBeenCalledOnce()
    expect(
      screen.queryByRole('button', { name: 'Gửi kết quả cho Manager' }),
    ).toBeNull()
  })

  it('shows pending result without a duplicate submit action', async () => {
    active.status = 'COMPLETED'
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canSubmitMissionResult: true,
    })
    vi.mocked(missionApi.getMissionResult).mockResolvedValue({
      id: 'r',
      missionId: 'm',
      status: 'COMPLETED',
      approvalStatus: 'PENDING_MANAGER_APPROVAL',
    } as never)
    render(<UploadMediaPage missionId="m" />)
    await screen.findByText('Kết quả đã được gửi Manager và đang chờ duyệt.')
    expect(
      screen.queryByRole('button', { name: 'Gửi kết quả cho Manager' }),
    ).toBeNull()
  })

  it('blocks known-incomplete checklist with a localized count and no submit', async () => {
    active.status = 'COMPLETED'
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canSubmitMissionResult: true,
    })
    const submit = vi.spyOn(missionApi, 'submitMissionResult')
    render(<UploadMediaPage missionId="m" />)
    const button = await screen.findByRole('button', {
      name: 'Gửi kết quả cho Manager',
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
      name: 'Gửi kết quả cho Manager',
    })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(attach).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
    expect(submit).not.toHaveBeenCalled()
  })

  it('submits independently with unapproved media using operational readiness', async () => {
    active.status = 'COMPLETED'
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canSubmitMissionResult: true,
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
      name: 'Gửi kết quả cho Manager',
    })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith('m', expect.any(Object)),
    )
    expect(complete).not.toHaveBeenCalled()
    expect(
      screen.getByRole('link', { name: 'Quay lại buồng lái' }),
    ).toHaveAttribute('href', '#portal/staff/flight/m')
  })

  it('refreshes authoritative state and localizes stale submit errors', async () => {
    active.status = 'COMPLETED'
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canSubmitMissionResult: true,
    })
    vi.mocked(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      readyForSubmission: true,
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
      await screen.findByRole('button', { name: 'Gửi kết quả cho Manager' }),
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
    await screen.findByText('Upload ảnh')
    vi.mocked(missionApi.getPermissions).mockRejectedValue(new Error('denied'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Làm mới' })[0])
    await screen.findByText(
      'Không tải được quyền upload. Bấm Làm mới để thử lại.',
    )
    expect(screen.queryByText('Upload ảnh')).toBeNull()
  })
})
