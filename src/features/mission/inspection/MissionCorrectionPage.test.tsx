import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { MissionCorrectionPage } from './MissionCorrectionPage'
import {
  inspectionCorrectionApi,
  type InspectionCorrection,
} from './inspectionCorrectionApi'
import { ApiError } from '../../../shared/api/httpClient'
import { setLanguage } from '../../../shared/i18n'
import type { MissionChecklistResponse } from '../types/checklistExecution'
import type { MissionPermissions } from '../types/permissions'
const state = vi.hoisted(() => ({ data: null as unknown, reload: vi.fn() }))
vi.mock('../hooks/useMissionMonitoring', () => ({
  useMissionMonitoring: () => ({
    data: state.data,
    loading: false,
    error: null,
    reload: state.reload,
  }),
}))
vi.mock('../../drone-operator/pages/UploadMedia/UploadMediaPage', () => ({
  UploadMediaPage: (props: {
    mode: string
    executionIds: string[]
    correctionStage: string
    embedded: boolean
    onBusyChange: (busy: boolean) => void
  }) => (
    <div data-testid="workspace" data-stage={props.correctionStage}>
      {props.mode}:{props.executionIds.join(',')}:{String(props.embedded)}
      <button onClick={() => props.onBusyChange(true)}>Start transfer</button>
      <button onClick={() => props.onBusyChange(false)}>Finish transfer</button>
    </div>
  ),
}))
let correction: InspectionCorrection
let permissions: MissionPermissions
let checklist: MissionChecklistResponse
beforeEach(() => {
  setLanguage('vi')
  state.reload.mockReset()
  correction = {
    id: 'c',
    missionId: 'm',
    version: 2,
    mode: 'DOSSIER_ADJUSTMENT',
    status: 'OPEN',
    reviewToken: 'snapshot-v2',
    requestedBy: 'inspector',
    requestedAt: '2026-11-15T00:00:00Z',
    resolvedAt: null,
    supplementalMissionId: null,
    supplementalMissionCode: null,
    supplementalMissionStatus: null,
    items: [
      {
        executionId: 'failed',
        content: 'Capture the east side',
        requestedExecutionVersion: 1,
        reason: 'Replace the blurred overview',
        mediaIds: [],
      },
    ],
    events: [],
  }
  permissions = {
    canAttachChecklistEvidence: true,
    canExecuteMonitoringChecklist: true,
    canAssessMonitoringChecklist: false,
    canAccessMissionInspection: true,
  } as MissionPermissions
  const executionDefaults = {
    orderChecklistItemId: 'item',
    displayOrder: 1,
    sourceType: 'CUSTOMER_CUSTOM' as const,
    observation: null,
    unableToVerifyReason: null,
    startedAt: null,
    completedAt: null,
    lastModifiedBy: null,
    createdAt: '2026-11-15T00:00:00Z',
    updatedAt: null,
  }
  checklist = {
    missionId: 'm',
    legacySnapshot: false,
    readyForSubmission: true,
    executions: [
      {
        ...executionDefaults,
        id: 'failed',
        content: 'Capture the east side',
        executionStatus: 'COMPLETED',
        assessmentStatus: 'NON_COMPLIANT',
        evidenceReady: true,
        evidence: [],
        version: 2,
        readyForFinalApproval: false,
      },
      {
        ...executionDefaults,
        id: 'other',
        content: 'Unrelated accepted work',
        executionStatus: 'COMPLETED',
        assessmentStatus: 'COMPLIANT',
        evidenceReady: true,
        evidence: [],
        version: 1,
        readyForFinalApproval: true,
      },
    ],
  } as MissionChecklistResponse
  state.data = { permissions, checklist, result: null }
  vi.spyOn(inspectionCorrectionApi, 'list').mockImplementation(async () => [
    correction,
  ])
})
afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})
it('offers existing evidence before optional file upload and scopes the editor to the request', async () => {
  render(<MissionCorrectionPage missionId="m" />)
  await screen.findByText('Replace the blurred overview')
  await waitFor(() => expect(screen.getByRole('button', {
      name: 'Đã có tệp phù hợp — chỉnh bằng chứng',
    })).toBeEnabled())
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Đã có tệp phù hợp — chỉnh bằng chứng',
    }),
  )
  expect(screen.getByTestId('workspace')).toHaveTextContent(
    'checklist:failed:true',
  )
  expect(screen.getByTestId('workspace')).toHaveAttribute('data-stage', 'evidence')
  expect(screen.queryByText('Unrelated accepted work')).toBeNull()
  expect(
    screen.queryByRole('button', { name: 'Gửi lại để nghiệm thu' }),
  ).toBeNull()
})
it('takes Staff through optional file upload, evidence updates, and an explicit resubmission', async () => {
  const decide = vi
    .spyOn(inspectionCorrectionApi, 'decide')
    .mockImplementation(async () => {
      correction = { ...correction, status: 'SUBMITTED' }
      permissions.canAttachChecklistEvidence = false
      permissions.canExecuteMonitoringChecklist = false
      return correction
    })
  render(<MissionCorrectionPage missionId="m" />)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Cần tải thêm tệp gốc' }),
  )
  expect(screen.getByTestId('workspace')).toHaveTextContent('media:failed:true')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Tiếp tục chỉnh bằng chứng' })).toBeEnabled())
  fireEvent.click(
    screen.getByRole('button', { name: 'Tiếp tục chỉnh bằng chứng' }),
  )
  expect(screen.getByTestId('workspace')).toHaveTextContent(
    'checklist:failed:true',
  )
  await waitFor(() => expect(screen.getByRole('button', { name: 'Kiểm tra và gửi lại' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra và gửi lại' }))
  fireEvent.change(screen.getByLabelText('Nội dung đã bổ sung'), {
    target: { value: 'Replaced the blurred image' },
  })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Gửi lại để nghiệm thu' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Gửi lại để nghiệm thu' }))
  await waitFor(() =>
    expect(decide).toHaveBeenCalledWith(
      'm',
      expect.objectContaining({
        id: 'c',
        version: 2,
        reviewToken: 'snapshot-v2',
      }),
      'resubmit',
      'Replaced the blurred image',
    ),
  )
  expect(
    await screen.findByText('Đã gửi lại — chờ người nghiệm thu kiểm tra'),
  ).toBeInTheDocument()
  expect(screen.queryByTestId('workspace')).toBeNull()
})
it('blocks resubmission while any requested evidence remains unvalidated', async () => {
  checklist.executions[0].evidenceReady = false
  render(<MissionCorrectionPage missionId="m" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Gửi lại' }))
  fireEvent.change(screen.getByLabelText('Nội dung đã bổ sung'), {
    target: { value: 'Done' },
  })
  expect(
    screen.getByRole('button', { name: 'Gửi lại để nghiệm thu' }),
  ).toBeDisabled()
  expect(
    screen.getByText(
      'Cần hoàn tất và xác thực các bằng chứng của từng mục trước khi gửi lại.',
    ),
  ).toBeInTheDocument()
})
it('does not leave the file step during an active transfer', async () => {
  render(<MissionCorrectionPage missionId="m" />)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Cần tải thêm tệp gốc' }),
  )
  await waitFor(() => expect(screen.getByRole('button', { name: 'Start transfer' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Start transfer' }))
  expect(
    screen.getByRole('button', { name: 'Tiếp tục chỉnh bằng chứng' }),
  ).toBeDisabled()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Finish transfer' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Finish transfer' }))
  await waitFor(() => expect(
    screen.getByRole('button', { name: 'Tiếp tục chỉnh bằng chứng' }),
  ).toBeEnabled())
})
it('opens normal inspection for a submitted dossier instead of requesting another decision', async () => {
  correction = { ...correction, status: 'SUBMITTED' }
  permissions.canAssessMonitoringChecklist = true
  render(<MissionCorrectionPage missionId="m" />)
  await waitFor(() => expect(window.location.hash).toContain('inspection'))
  expect(screen.queryByRole('button', { name: 'Xác nhận bổ sung đạt' })).toBeNull()
})
it('escalates missing source data with a reason instead of restarting the original flight', async () => {
  const decide = vi
    .spyOn(inspectionCorrectionApi, 'decide')
    .mockResolvedValue(correction)
  render(<MissionCorrectionPage missionId="m" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Gửi lại' }))
  fireEvent.change(screen.getByLabelText('Nội dung đã bổ sung'), {
    target: { value: 'No usable original files remain' },
  })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Yêu cầu bay bổ sung' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu bay bổ sung' }))
  await waitFor(() =>
    expect(decide).toHaveBeenCalledWith(
      'm',
      expect.anything(),
      'require-flight',
      'No usable original files remain',
    ),
  )
})
it('fails closed when a requested execution is missing from the current Mission', async () => {
  checklist.executions = checklist.executions.filter(
    (row) => row.id !== 'failed',
  )
  render(<MissionCorrectionPage missionId="m" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Gửi lại' }))
  fireEvent.change(screen.getByLabelText('Nội dung đã bổ sung'), {
    target: { value: 'Done' },
  })
  expect(
    screen.getByRole('button', { name: 'Gửi lại để nghiệm thu' }),
  ).toBeDisabled()
})
it('shows a localized concurrency error without server details', async () => {
  vi.spyOn(inspectionCorrectionApi, 'decide').mockRejectedValue(
    new ApiError('private SQL error', {
      status: 409,
      code: 'CONCURRENT_UPDATE',
      method: 'POST',
      path: '/',
    }),
  )
  render(<MissionCorrectionPage missionId="m" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Gửi lại' }))
  fireEvent.change(screen.getByLabelText('Nội dung đã bổ sung'), {
    target: { value: 'Done' },
  })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Gửi lại để nghiệm thu' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Gửi lại để nghiệm thu' }))
  expect(
    await screen.findByText(
      'Hồ sơ đã thay đổi. Làm mới và kiểm tra lại trước khi xác nhận.',
    ),
  ).toBeInTheDocument()
  expect(screen.queryByText('private SQL error')).toBeNull()
})
it('uses English for the correction steps when selected', async () => {
  setLanguage('en')
  render(<MissionCorrectionPage missionId="m" />)
  expect(
    await screen.findByRole('button', {
      name: 'Use existing files — update evidence',
    }),
  ).toBeInTheDocument()
  expect(screen.queryByText('Xem yêu cầu')).toBeNull()
})

it('switches a multi-role Staff member to reinspection only after an explicit resubmit', async () => {
  const decide = vi
    .spyOn(inspectionCorrectionApi, 'decide')
    .mockImplementation(async () => {
      correction = { ...correction, status: 'SUBMITTED' }
      permissions.canAttachChecklistEvidence = false
      permissions.canExecuteMonitoringChecklist = false
      permissions.canAssessMonitoringChecklist = true
      return correction
    })
  render(<MissionCorrectionPage missionId="m" />)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Gửi lại' }),
  )
  fireEvent.change(screen.getByLabelText('Nội dung đã bổ sung'), {
    target: { value: 'Replaced evidence' },
  })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Gửi lại để nghiệm thu' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Gửi lại để nghiệm thu' }))
  expect(
    await screen.findByRole('heading', {
      name: 'Kiểm tra lại hồ sơ bổ sung',
      level: 1,
    }),
  ).toBeInTheDocument()
  expect(decide).toHaveBeenCalledTimes(1)
  expect(decide).toHaveBeenCalledWith(
    'm',
    expect.anything(),
    'resubmit',
    'Replaced evidence',
  )
  await waitFor(() => expect(window.location.hash).toContain('inspection'))
  expect(screen.queryByRole('button', { name: 'Xác nhận bổ sung đạt' })).toBeNull()
})
it('shows the latest returned finding before Staff start correcting again', async () => {
  correction.events = [
    {
      action: 'RETURNED',
      actor: 'inspector',
      occurredAt: '2026-11-15T01:00:00Z',
      note: 'The eastern boundary is still missing',
    },
  ]
  render(<MissionCorrectionPage missionId="m" />)
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'The eastern boundary is still missing',
  )
})
it('does not expose editing controls when the correction request cannot be loaded', async () => {
  vi.mocked(inspectionCorrectionApi.list).mockRejectedValue(
    new Error('private database message'),
  )
  render(<MissionCorrectionPage missionId="m" />)
  expect(
    await screen.findByText(
      'Chưa tải được yêu cầu và quyền xử lý. Hãy thử lại.',
    ),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Gửi lại' }),
  ).toBeNull()
  expect(screen.queryByText('private database message')).toBeNull()
})

it('refreshes the correction snapshot after editing evidence before resubmission', async () => {
  const decide = vi.spyOn(inspectionCorrectionApi, 'decide').mockResolvedValue(correction)
  render(<MissionCorrectionPage missionId="m" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Đã có tệp phù hợp — chỉnh bằng chứng' }))
  await waitFor(() => expect(inspectionCorrectionApi.list).toHaveBeenCalledTimes(2))
  correction = { ...correction, reviewToken: 'updated-after-evidence' }
  await waitFor(() => expect(screen.getByRole('button', { name: 'Kiểm tra và gửi lại' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra và gửi lại' }))
  await waitFor(() => expect(inspectionCorrectionApi.list).toHaveBeenCalledTimes(3))
  fireEvent.change(screen.getByLabelText('Nội dung đã bổ sung'), {
    target: { value: 'Replaced evidence' },
  })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Gửi lại để nghiệm thu' })).toBeEnabled())
  await waitFor(() => expect(screen.getByRole('button', { name: 'Gửi lại để nghiệm thu' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Gửi lại để nghiệm thu' }))
  await waitFor(() => expect(decide).toHaveBeenCalledWith(
    'm', expect.objectContaining({ reviewToken: 'updated-after-evidence' }),
    'resubmit', 'Replaced evidence',
  ))
})
