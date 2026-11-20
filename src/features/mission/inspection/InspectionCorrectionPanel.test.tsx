import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setLanguage } from '../../../shared/i18n'
import { InspectionCorrectionPanel } from './InspectionCorrectionPanel'
import {
  inspectionCorrectionApi,
  type InspectionCorrection,
} from './inspectionCorrectionApi'
import type { MissionChecklistExecution } from '../types/checklistExecution'
const rows = [
  {
    id: 'bad',
    content: 'Inspect fence',
    version: 3,
    assessmentStatus: 'NON_COMPLIANT',
    evidence: [],
  },
  {
    id: 'good',
    content: 'Inspect exit',
    version: 2,
    assessmentStatus: 'COMPLIANT',
    evidence: [],
  },
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
  await screen.findByLabelText('Nội dung cần bổ sung: Inspect fence')
  expect(
    screen.getByRole('radio', { name: 'Điều chỉnh hồ sơ bằng dữ liệu đã có' }),
  ).toBeChecked()
  fireEvent.click(
    screen.getByRole('radio', { name: 'Cần thực hiện chuyến bay bổ sung' }),
  )
  fireEvent.change(
    screen.getByLabelText('Nội dung cần bổ sung: Inspect fence'),
    { target: { value: 'Image is blurred' } },
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Ghi nhận yêu cầu bổ sung' }),
  )
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith('m1', expect.any(String), [
      {
        executionId: 'bad',
        expectedVersion: 3,
        reason: 'Image is blurred',
        mediaIds: [],
      },
    ], 'SUPPLEMENTAL_FLIGHT'),
  )
})
it('requires a reason for every selected checklist', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([])
  render(<InspectionCorrectionPanel missionId="m1" rows={rows} canRequest />)
  await screen.findByLabelText('Nội dung cần bổ sung: Inspect fence')
  expect(
    screen.getByRole('button', { name: 'Ghi nhận yêu cầu bổ sung' }),
  ).toBeDisabled()
})
it('routes Staff to the staged dossier workspace instead of offering an inline resubmit', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([{ ...batch, mode: 'DOSSIER_ADJUSTMENT' }])
  const decide = vi.spyOn(inspectionCorrectionApi, 'decide')
  render(<InspectionCorrectionPanel missionId="m1" canRespond />)
  expect(await screen.findByRole('link', { name: 'Mở bổ sung hồ sơ' })).toHaveAttribute('href', '#portal/staff/corrections/m1')
  expect(screen.queryByLabelText('Ghi chú xử lý')).toBeNull()
  expect(decide).not.toHaveBeenCalled()
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
it('switching missions clears unsent correction form and never mixes targets', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([])
  const { rerender } = render(
    <InspectionCorrectionPanel missionId="m1" rows={rows} canRequest />,
  )
  await screen.findByLabelText('Nội dung cần bổ sung: Inspect fence')
  fireEvent.change(
    screen.getByLabelText('Nội dung cần bổ sung: Inspect fence'),
    { target: { value: 'Local draft' } },
  )
  rerender(<InspectionCorrectionPanel missionId="m2" rows={rows} canRequest />)
  await screen.findByLabelText('Nội dung cần bổ sung: Inspect fence')
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
it('manager opens the shared planning workspace instead of creating from the result panel', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([batch])
  const create = vi.spyOn(inspectionCorrectionApi, 'createMission')
  render(<InspectionCorrectionPanel missionId="m1" manager orderId="order" />)
  expect(
    await screen.findByRole('link', { name: 'Lập kế hoạch bổ sung' }),
  ).toHaveAttribute('href', '#portal/manager/orders/order/inspection/m1/c')
  expect(screen.queryByLabelText('Phạm vi nhiệm vụ bổ sung')).toBeNull()
  expect(create).not.toHaveBeenCalled()
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
it('Manager sees only supplemental planning when a request is open', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([batch])
  render(<InspectionCorrectionPanel missionId="m1" manager orderId="order" />)
  expect(
    await screen.findByRole('heading', { name: 'Lập nhiệm vụ bổ sung nội bộ' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('heading', { name: 'Yêu cầu bổ sung kết quả' }),
  ).toBeNull()
  expect(
    screen.queryByText(
      'Inspector nghiệm thu và công bố kết quả trực tiếp cho khách hàng.',
    ),
  ).toBeNull()
  expect(
    screen.getByRole('link', { name: 'Lập kế hoạch bổ sung' }),
  ).toHaveAttribute('href', '#portal/manager/orders/order/inspection/m1/c')
})

it('automatically includes every failed checklist with its assessment note and excludes compliant work', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([])
  const request = vi
    .spyOn(inspectionCorrectionApi, 'request')
    .mockResolvedValue(batch)
  render(
    <InspectionCorrectionPanel
      missionId="m1"
      canRequest
      rows={[
        { ...rows[0], assessmentNote: 'Image is blurred' },
        {
          ...rows[0],
          id: 'bad2',
          content: 'Inspect roof',
          version: 4,
          assessmentNote: 'Coverage missing',
        },
        rows[1],
      ]}
    />,
  )
  expect(
    await screen.findByDisplayValue('Image is blurred'),
  ).toBeInTheDocument()
  expect(screen.getByDisplayValue('Coverage missing')).toBeInTheDocument()
  expect(screen.queryByText('Inspect exit')).toBeNull()
  expect(screen.queryByRole('checkbox', { name: 'Inspect fence' })).toBeNull()
  fireEvent.click(
    screen.getByRole('button', { name: 'Ghi nhận yêu cầu bổ sung' }),
  )
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith('m1', expect.any(String), [
      {
        executionId: 'bad',
        expectedVersion: 3,
        reason: 'Image is blurred',
        mediaIds: [],
      },
      {
        executionId: 'bad2',
        expectedVersion: 4,
        reason: 'Coverage missing',
        mediaIds: [],
      },
    ], 'DOSSIER_ADJUSTMENT'),
  )
})
it('hides the correction panel when no checklist has failed and no history exists', async () => {
  const list = vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([])
  render(
    <InspectionCorrectionPanel missionId="m1" rows={[rows[1]]} canRequest />,
  )
  await waitFor(() => expect(list).toHaveBeenCalled())
  await waitFor(() => expect(screen.queryByRole('region')).toBeNull())
})

it('explains combined correction and inspection responsibilities without sending to another Staff', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([])
  render(
    <InspectionCorrectionPanel
      missionId="m1"
      rows={rows}
      canRequest
      canRespond
    />,
  )
  expect(
    await screen.findByText(/Bạn có quyền thực hiện cả bổ sung và nghiệm thu/),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Gửi yêu cầu cho Staff' }),
  ).toBeNull()
  expect(
    screen.getByRole('button', { name: 'Ghi nhận yêu cầu bổ sung' }),
  ).toBeInTheDocument()
  expect(screen.queryByText('Chưa có yêu cầu bổ sung.')).toBeNull()
})

it('offers creating a replacement for a failed internal Mission while preserving its history', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([
    {
      ...batch,
      supplementalMissionId: 'failed',
      supplementalMissionCode: 'MS-FAILED',
      supplementalMissionStatus: 'FAILED',
    },
  ])
  render(<InspectionCorrectionPanel missionId="m1" manager orderId="order" />)
  expect(
    await screen.findByRole('link', { name: 'Lập kế hoạch bổ sung' }),
  ).toHaveAttribute('href', '#portal/manager/orders/order/inspection/m1/c')
  expect(screen.getByRole('link', { name: 'MS-FAILED' })).toBeInTheDocument()
})

it('keeps dossier adjustments out of Manager flight planning', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([{ ...batch, mode: 'DOSSIER_ADJUSTMENT' }])
  const { container } = render(<InspectionCorrectionPanel missionId="m1" manager orderId="order" />)
  await waitFor(() => expect(container).toBeEmptyDOMElement())
})
it('shows waiting guidance to a pure Inspector when a dossier adjustment is still open', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([
    { ...batch, mode: 'DOSSIER_ADJUSTMENT', status: 'OPEN' },
  ])
  render(<InspectionCorrectionPanel missionId="m1" canRequest />)
  expect(
    await screen.findByText(/Yêu cầu đã gửi tới đội thực hiện/),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'Xem tiến độ xử lý' }),
  ).toHaveAttribute('href', '#portal/staff/corrections/m1')
  expect(
    screen.queryByRole('link', { name: 'Mở bổ sung hồ sơ' }),
  ).toBeNull()
})

it('routes the Inspector to the same workspace for reinspection', async () => {
  window.location.hash = '#portal/staff/missions/m1'
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([{ ...batch, mode: 'DOSSIER_ADJUSTMENT', status: 'SUBMITTED' }])
  render(<InspectionCorrectionPanel missionId="m1" canRequest />)
  expect(await screen.findByRole('link', { name: 'Kiểm tra lại hồ sơ' })).toHaveAttribute('href', '#portal/staff/inspection/m1')
  expect(screen.queryByRole('button', { name: 'Xác nhận đã bổ sung đạt' })).toBeNull()
})

it('opens the requested checklist item in place when already on the inspection page', async () => {
  window.location.hash = '#portal/staff/inspection/m1'
  const onReviewChecklist = vi.fn()
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([
    { ...batch, mode: 'DOSSIER_ADJUSTMENT', status: 'SUBMITTED' },
  ])
  render(
    <InspectionCorrectionPanel
      missionId="m1"
      rows={rows}
      canRequest
      onReviewChecklist={onReviewChecklist}
    />,
  )
  fireEvent.click(
    await screen.findByRole('button', { name: 'Kiểm tra lại hồ sơ' }),
  )
  expect(onReviewChecklist).toHaveBeenCalledWith('bad')
  window.location.hash = ''
})


it('lets the original Inspector recover results from an already accepted supplemental Mission', async () => {
  const opened = { ...batch, mode: 'SUPPLEMENTAL_FLIGHT' as const, supplementalMissionId: 'child', supplementalMissionCode: 'MS-CHILD', supplementalMissionStatus: 'COMPLETED' }
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue(opened ? [opened] : [])
  const receive = vi.spyOn(inspectionCorrectionApi, 'synchronizeSupplement').mockResolvedValue({ ...opened, status: 'SUBMITTED' })
  const refresh = vi.fn()
  render(<InspectionCorrectionPanel missionId="m1" rows={rows} canRequest refresh={refresh} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Đồng bộ kết quả đã nghiệm thu' }))
  await waitFor(() => expect(receive).toHaveBeenCalledWith('m1', 'c'))
  await waitFor(() => expect(refresh).toHaveBeenCalled())
})

it('supplemental acceptance never exposes a second source Inspector decision', async () => {
  const decide = vi.spyOn(inspectionCorrectionApi, 'decide')
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([{ ...batch, status: 'SUBMITTED', mode: 'SUPPLEMENTAL_FLIGHT', supplementalMissionId: 'child', supplementalMissionStatus: 'COMPLETED' }])
  vi.spyOn(inspectionCorrectionApi, 'supplementResult').mockResolvedValue({ missionId: 'child', missionCode: 'MS-12345', completedAt: null, executions: [] })
  render(<InspectionCorrectionPanel missionId="m1" canRequest />)
  await screen.findByText('MS-12345')
  expect(screen.queryByRole('button', {name: 'Yêu cầu sửa tiếp'})).toBeNull()
  expect(screen.queryByRole('button', {name: 'Xác nhận đã bổ sung đạt'})).toBeNull()
  expect(decide).not.toHaveBeenCalled()
})

it('closes a submitted dossier from checklist acceptance and selected evidence without a second decision', async () => {
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([{ ...batch, mode: 'DOSSIER_ADJUSTMENT', status: 'SUBMITTED' }])
  const reconcile = vi.spyOn(inspectionCorrectionApi, 'reconcileChecklistReview').mockResolvedValue(true)
  render(<InspectionCorrectionPanel missionId="m1" rows={[
    { ...rows[0], assessmentStatus: 'COMPLIANT', readyForFinalApproval: true },
  ]} canRequest />)
  await waitFor(() => expect(reconcile).toHaveBeenCalledTimes(1))
  expect(screen.queryByRole('button', { name: 'Xác nhận đã bổ sung đạt' })).toBeNull()
})

it('shows next-step guidance on the original mission only when remaining checklist items still need assessment or customer evidence selection', async () => {
  const resolvedSupplement = {
    ...batch,
    status: 'RESOLVED' as const,
    mode: 'SUPPLEMENTAL_FLIGHT' as const,
    supplementalMissionId: 'child',
    supplementalMissionCode: 'MS-CHILD',
    supplementalMissionStatus: 'COMPLETED',
  }
  vi.spyOn(inspectionCorrectionApi, 'list').mockResolvedValue([resolvedSupplement])
  vi.spyOn(inspectionCorrectionApi, 'supplementResult').mockResolvedValue({
    missionId: 'child',
    missionCode: 'MS-CHILD',
    completedAt: null,
    executions: [],
  })

  const { rerender } = render(
    <InspectionCorrectionPanel
      missionId="m1"
      canRequest
      rows={[
        { ...rows[0], fulfilledByMissionId: 'child', fulfilledByMissionCode: 'MS-CHILD' },
        { ...rows[1], assessmentStatus: 'COMPLIANT', readyForFinalApproval: false },
      ]}
    />,
  )

  expect(
    await screen.findByText('Cần hoàn tất các hạng mục còn lại của nhiệm vụ gốc'),
  ).toBeInTheDocument()
  expect(
    screen.getByText(/Nhiệm vụ gốc còn 1 hạng mục cần đánh giá đạt và chọn đủ bằng chứng gửi khách/),
  ).toBeInTheDocument()

  // Once the remaining item is ready for final approval, the guidance disappears
  rerender(
    <InspectionCorrectionPanel
      missionId="m1"
      canRequest
      rows={[
        { ...rows[0], fulfilledByMissionId: 'child', fulfilledByMissionCode: 'MS-CHILD' },
        { ...rows[1], assessmentStatus: 'COMPLIANT', readyForFinalApproval: true },
      ]}
    />,
  )
  await waitFor(() =>
    expect(
      screen.queryByText('Cần hoàn tất các hạng mục còn lại của nhiệm vụ gốc'),
    ).toBeNull(),
  )

  // If the original mission is already completed (canRequest=false), the guidance is never shown
  rerender(
    <InspectionCorrectionPanel
      missionId="m1"
      canRequest={false}
      rows={[
        { ...rows[0], fulfilledByMissionId: 'child', fulfilledByMissionCode: 'MS-CHILD' },
        { ...rows[1], assessmentStatus: 'COMPLIANT', readyForFinalApproval: false },
      ]}
    />,
  )
  expect(
    screen.queryByText('Cần hoàn tất các hạng mục còn lại của nhiệm vụ gốc'),
  ).toBeNull()
})

