import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api/httpClient'
import { setLanguage } from '../../../shared/i18n'
import { InspectionCorrectionPanel } from './InspectionCorrectionPanel'
import {
  inspectionCorrectionApi,
  type InspectionCorrection,
} from './inspectionCorrectionApi'
import type { MissionChecklistExecution } from '../types/checklistExecution'
const rows = [
  { id: 'bad', content: 'Inspect fence', version: 3, evidence: [] },
  { id: 'good', content: 'Inspect exit', version: 2, evidence: [] },
] as unknown as MissionChecklistExecution[]
const batch: InspectionCorrection = {
  id: 'c',
  missionId: 'm1',
  version: 2,
  status: 'OPEN',
  reviewToken: 'snapshot-token',
  requestedBy: 'inspector',
  requestedAt: '2026-11-14T00:00:00Z',
  resolvedAt: null,
  supplementalMissionId: null,
  supplementalMissionCode: null,
  supplementalMissionStatus: null,
  items: [
    {
      executionId: 'bad',
      content: 'Inspect fence',
      requestedExecutionVersion: 3,
      reason: 'Image is blurred',
      mediaIds: [],
    },
  ],
  events: [
    {
      action: 'REQUESTED',
      actor: 'inspector',
      occurredAt: '2026-11-14T00:00:00Z',
      note: null,
    },
  ],
}
beforeEach(() => setLanguage('vi'))
afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})
it('requests only the selected checklist scope and preserves unselected work', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([])
  const request = vi
    .spyOn(inspectionCorrectionApi, 'request')
    .mockResolvedValue(batch)
  render(<InspectionCorrectionPanel missionId="m1" rows={rows} canRequest />)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Tạo yêu cầu bổ sung' }),
  )
  fireEvent.click(screen.getByRole('checkbox', { name: 'Inspect fence' }))
  fireEvent.change(
    screen.getByLabelText('Nội dung cần bổ sung: Inspect fence'),
    { target: { value: 'Image is blurred' } },
  )
  fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu cho Staff' }))
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith('m1', expect.any(String), [
      {
        executionId: 'bad',
        expectedVersion: 3,
        reason: 'Image is blurred',
        mediaIds: [],
      },
    ]),
  )
})
it('requires a reason for every selected checklist', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([])
  render(<InspectionCorrectionPanel missionId="m1" rows={rows} canRequest />)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Tạo yêu cầu bổ sung' }),
  )
  fireEvent.click(screen.getByRole('checkbox', { name: 'Inspect fence' }))
  expect(
    screen.getByRole('button', { name: 'Gửi yêu cầu cho Staff' }),
  ).toBeDisabled()
})
it('staff resubmits using the exact mission, correction version and review snapshot', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([batch])
  const decide = vi
    .spyOn(inspectionCorrectionApi, 'decide')
    .mockResolvedValue({ ...batch, status: 'SUBMITTED' })
  render(<InspectionCorrectionPanel missionId="m1" canRespond />)
  fireEvent.change(await screen.findByLabelText('Ghi chú xử lý'), {
    target: { value: 'Uploaded corrected image' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi lại để nghiệm thu' }))
  await waitFor(() =>
    expect(decide).toHaveBeenCalledWith(
      'm1',
      batch,
      'resubmit',
      'Uploaded corrected image',
    ),
  )
  expect(
    screen.queryByRole('button', { name: 'Xác nhận đã bổ sung đạt' }),
  ).not.toBeInTheDocument()
})
it('inspector rechecks submitted work and may return it with a reason', async () => {
  const submitted = { ...batch, status: 'SUBMITTED' as const }
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([submitted])
  const decide = vi
    .spyOn(inspectionCorrectionApi, 'decide')
    .mockResolvedValue(batch)
  render(<InspectionCorrectionPanel missionId="m1" canRequest />)
  expect(
    await screen.findByRole('button', { name: 'Xác nhận đã bổ sung đạt' }),
  ).toBeDisabled()
  fireEvent.change(screen.getByLabelText('Ghi chú xử lý'), {
    target: { value: 'Still blurred' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu sửa tiếp' }))
  await waitFor(() =>
    expect(decide).toHaveBeenCalledWith(
      'm1',
      submitted,
      'return',
      'Still blurred',
    ),
  )
})
it('never shows an accept action on an open or already resolved request', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([batch])
  render(<InspectionCorrectionPanel missionId="m1" canRequest />)
  await screen.findByText('Image is blurred')
  expect(
    screen.queryByRole('button', { name: 'Xác nhận đã bổ sung đạt' }),
  ).not.toBeInTheDocument()
})
it('read failures show a localized fail-closed notice', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockRejectedValue(
    new Error('RAW_DATABASE_ERROR'),
  )
  render(<InspectionCorrectionPanel missionId="m1" rows={rows} canRequest />)
  expect(
    await screen.findByText(/Không tải được yêu cầu bổ sung/),
  ).toBeInTheDocument()
  expect(screen.queryByText('RAW_DATABASE_ERROR')).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Tạo yêu cầu bổ sung' }),
  ).not.toBeInTheDocument()
  act(() => setLanguage('en'))
  expect(
    screen.getByText(/Unable to load correction requests/),
  ).toBeInTheDocument()
})
it('shows concurrency errors without exposing raw backend messages', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([batch])
  vi.spyOn(inspectionCorrectionApi, 'decide').mockRejectedValue(
    new ApiError('SQL conflict', {
      code: 'CONCURRENT_UPDATE',
      status: 409,
      method: 'POST',
      path: '/',
    }),
  )
  render(<InspectionCorrectionPanel missionId="m1" canRespond />)
  fireEvent.change(await screen.findByLabelText('Ghi chú xử lý'), {
    target: { value: 'Ready' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi lại để nghiệm thu' }))
  expect(await screen.findByText(/Dữ liệu đã thay đổi/)).toBeInTheDocument()
  expect(screen.queryByText('SQL conflict')).not.toBeInTheDocument()
})
it('switching missions clears unsent correction form and never mixes targets', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([])
  const { rerender } = render(
    <InspectionCorrectionPanel missionId="m1" rows={rows} canRequest />,
  )
  fireEvent.click(
    await screen.findByRole('button', { name: 'Tạo yêu cầu bổ sung' }),
  )
  fireEvent.click(screen.getByRole('checkbox', { name: 'Inspect fence' }))
  fireEvent.change(
    screen.getByLabelText('Nội dung cần bổ sung: Inspect fence'),
    { target: { value: 'Local draft' } },
  )
  rerender(<InspectionCorrectionPanel missionId="m2" rows={rows} canRequest />)
  await screen.findByRole('button', { name: 'Tạo yêu cầu bổ sung' })
  expect(screen.queryByDisplayValue('Local draft')).not.toBeInTheDocument()
})
it('staff supplemental links stay in the staff portal', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([
    {
      ...batch,
      supplementalMissionId: 'child',
      supplementalMissionCode: 'MS-I1',
      supplementalMissionStatus: 'PLANNING',
    },
  ])
  render(<InspectionCorrectionPanel missionId="m1" canRespond />)
  expect(await screen.findByRole('link', { name: 'MS-I1' })).toHaveAttribute(
    'href',
    expect.stringContaining('#portal/staff/'),
  )
})
it('manager creates an internal mission with Vietnam UTC+7 schedule', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([batch])
  const create = vi
    .spyOn(inspectionCorrectionApi, 'createMission')
    .mockResolvedValue({ id: 'child' } as never)
  render(<InspectionCorrectionPanel missionId="m1" manager orderId="order" />)
  fireEvent.change(await screen.findByLabelText('Phạm vi Mission bổ sung'), {
    target: { value: 'Recapture fence' },
  })
  fireEvent.change(screen.getByLabelText('Bắt đầu — giờ Việt Nam'), {
    target: { value: '2026-11-15T08:00' },
  })
  fireEvent.change(screen.getByLabelText('Kết thúc — giờ Việt Nam'), {
    target: { value: '2026-11-15T09:00' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Tạo Mission bổ sung' }))
  await waitFor(() =>
    expect(create).toHaveBeenCalledWith('m1', batch, {
      clientRequestId: expect.any(String),
      scopeLabel: 'Recapture fence',
      scheduledStartAt: '2026-11-15T01:00:00.000Z',
      scheduledEndAt: '2026-11-15T02:00:00.000Z',
    }),
  )
})

it('Manager coordinates but cannot accept or return Inspector corrections', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([
    { ...batch, status: 'SUBMITTED' },
  ])
  render(<InspectionCorrectionPanel missionId="m1" manager orderId="order" />)
  await waitFor(() =>
    expect(inspectionCorrectionApi.list).toHaveBeenCalledWith(
      'm1',
      expect.any(AbortSignal),
    ),
  )
  expect(screen.queryByRole('region')).toBeNull()
  expect(
    screen.queryByRole('button', { name: 'Xác nhận đã bổ sung đạt' }),
  ).toBeNull()
  expect(screen.queryByRole('button', { name: 'Yêu cầu sửa tiếp' })).toBeNull()
  expect(screen.queryByLabelText('Ghi chú xử lý')).toBeNull()
})
it('Inspector can accept a submitted request without a Manager step', async () => {
  const submitted = { ...batch, status: 'SUBMITTED' as const }
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([submitted])
  const decide = vi
    .spyOn(inspectionCorrectionApi, 'decide')
    .mockResolvedValue({ ...submitted, status: 'RESOLVED' })
  render(<InspectionCorrectionPanel missionId="m1" canRequest />)
  fireEvent.change(await screen.findByLabelText('Ghi chú xử lý'), {
    target: { value: 'Ảnh rõ nét, đủ phạm vi' },
  })
  fireEvent.click(
    screen.getByRole('button', { name: 'Xác nhận đã bổ sung đạt' }),
  )
  await waitFor(() =>
    expect(decide).toHaveBeenCalledWith(
      'm1',
      submitted,
      'resolve',
      'Ảnh rõ nét, đủ phạm vi',
    ),
  )
  expect(
    screen.queryByRole('button', { name: 'Tạo Mission bổ sung' }),
  ).toBeNull()
})

it.each(['empty', 'resolved'] as const)(
  'does not show the Inspector panel to Manager for %s requests',
  async (state) => {
    const list = vi
      .spyOn(inspectionCorrectionApi, 'list')
      .mockResolvedValue(
        state === 'empty' ? [] : [{ ...batch, status: 'RESOLVED' }],
      )
    render(<InspectionCorrectionPanel missionId="m1" manager orderId="order" />)
    await waitFor(() => expect(list).toHaveBeenCalled())
    expect(screen.queryByRole('region')).toBeNull()
    expect(screen.queryByText('Yêu cầu bổ sung kết quả')).toBeNull()
  },
)
it('Manager sees only supplemental planning when a request is open', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([batch])
  render(<InspectionCorrectionPanel missionId="m1" manager orderId="order" />)
  expect(
    await screen.findByRole('heading', { name: 'Lập Mission bổ sung nội bộ' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('heading', { name: 'Yêu cầu bổ sung kết quả' }),
  ).toBeNull()
  expect(
    screen.queryByText(
      'Inspector nghiệm thu và công bố kết quả trực tiếp cho khách hàng.',
    ),
  ).toBeNull()
  expect(screen.getByLabelText('Phạm vi Mission bổ sung')).toBeInTheDocument()
})
