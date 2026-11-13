import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { setLanguage } from '../../../../../shared/i18n'
import { missionsApi } from '../../../api/missionsApi'
import { ApiError } from '../../../../../shared/api/httpClient'
import { refundApi, type RefundResponse } from '../../../../finance/refundApi'
import type { MissionResponse } from '../../../types/missions'
import { FlightPermitCard } from '../FlightPermitCard'

const rejectedMission = {
  id: 'mission-1',
  orderId: 'order-1',
  missionCode: 'MS-001',
  status: 'READY',
  flightPermitStatus: 'REJECTED',
  flightPermitNote: 'Thiếu tài liệu khu vực bay',
  flightPermitResourceHoldUntil: '2026-10-30T01:00:00Z',
  scheduledStartAt: '2026-11-02T01:00:00Z',
  scheduledEndAt: '2026-11-02T02:00:00Z',
  orderPreferredDateFrom: '2026-11-10',
  orderPreferredDateTo: '2026-11-12',
  orderPreferredTimeId: 'pt-morning',
  orderPreferredTimeName: 'Buổi sáng',
  orderPreferredTimeStart: '08:00:00',
  orderPreferredTimeEnd: '11:00:00',
} as MissionResponse

afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})

it('keeps a rejected permit separate from order rejection and exposes remediation actions', () => {
  render(
    <FlightPermitCard
      mission={rejectedMission}
      onChanged={vi.fn()}
      depositPaid
    />,
  )

  expect(screen.getByText('Nhiệm vụ đang bị khóa thực thi')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Bổ sung & gửi duyệt lại' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Đề nghị dời lịch' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Xác nhận đã được cấp phép' }),
  ).not.toBeInTheDocument()
})

it('makes permit details read-only and hides every action after cancellation', () => {
  render(
    <FlightPermitCard
      mission={{ ...rejectedMission, orderStatus: 'CANCELLED' }}
      onChanged={vi.fn()}
    />,
  )

  expect(
    screen.getByText(/đã hủy.*chỉ được giữ để đối chiếu/i),
  ).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Ghi chú' })).toBeDisabled()
  expect(screen.queryByText('Thay tệp')).not.toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

it('resubmits only after the manager changes the remediation note or document', async () => {
  const update = vi
    .spyOn(missionsApi, 'updateFlightPermit')
    .mockResolvedValue(rejectedMission)
  render(
    <FlightPermitCard
      mission={rejectedMission}
      onChanged={vi.fn()}
      depositPaid
    />,
  )

  fireEvent.click(
    screen.getByRole('button', { name: 'Bổ sung & gửi duyệt lại' }),
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'bổ sung file hoặc ghi chú',
  )
  expect(update).not.toHaveBeenCalled()

  fireEvent.change(screen.getByRole('textbox', { name: 'Ghi chú' }), {
    target: { value: 'Đã bổ sung tài liệu xác nhận khu vực' },
  })
  fireEvent.click(
    screen.getByRole('button', { name: 'Bổ sung & gửi duyệt lại' }),
  )
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith(
      'mission-1',
      expect.objectContaining({ status: 'PENDING' }),
    ),
  )
})

it('saving an uploaded permit sends it for review instead of approving it', async () => {
  const pendingMission = {
    ...rejectedMission,
    flightPermitStatus: 'PENDING',
    flightPermitNote: 'Đã gửi hồ sơ',
    flightPermitFileName: 'permit-current.pdf',
  } as MissionResponse
  const update = vi
    .spyOn(missionsApi, 'updateFlightPermit')
    .mockResolvedValue(pendingMission)
  render(
    <FlightPermitCard
      mission={pendingMission}
      onChanged={vi.fn()}
      depositPaid
    />,
  )

  expect(screen.queryByText('Chưa chọn tệp')).not.toBeInTheDocument()
  expect(screen.getByText('Thay tệp')).toBeInTheDocument()

  const file = new File(['permit'], 'permit.pdf', { type: 'application/pdf' })
  fireEvent.change(screen.getByLabelText('Chọn tệp giấy phép'), {
    target: { files: [file] },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu hồ sơ & chờ duyệt' }))

  await waitFor(() =>
    expect(update).toHaveBeenCalledWith(
      'mission-1',
      expect.objectContaining({ status: 'PENDING', fileName: 'permit.pdf' }),
    ),
  )
  expect(update).not.toHaveBeenCalledWith(
    'mission-1',
    expect.objectContaining({ status: 'APPROVED' }),
  )
})

it('requires a reason and submits a refund request for a paid Deposit', async () => {
  setLanguage('en')
  vi.spyOn(refundApi, 'getManagerOrderRefund').mockRejectedValue(
    new ApiError('Not found', { status: 404, method: 'GET', path: '/refund' }),
  )
  const request = vi.spyOn(refundApi, 'requestForOrder').mockResolvedValue({
    id: 'refund-1',
    status: 'REQUESTED',
    refundableAmount: 500000,
    refundedAmount: 0,
  } as RefundResponse)
  render(
    <FlightPermitCard
      mission={rejectedMission}
      onChanged={vi.fn()}
      depositPaid
    />,
  )

  fireEvent.click(
    await screen.findByRole('button', { name: 'Request Deposit Refund' }),
  )
  const submit = screen.getByRole('button', { name: 'Submit refund request' })
  expect(submit).toBeDisabled()
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Reason for the refund request' }),
    {
      target: { value: 'Permit could not be obtained' },
    },
  )
  fireEvent.click(submit)

  await waitFor(() =>
    expect(request).toHaveBeenCalledWith(
      'order-1',
      'Permit could not be obtained',
    ),
  )
  expect(
    await screen.findByText('Deposit refund requested'),
  ).toBeInTheDocument()
})

it('offers the refund action for an Order-level permit rejection', async () => {
  setLanguage('en')
  vi.spyOn(refundApi, 'getManagerOrderRefund').mockRejectedValue(
    new ApiError('Not found', { status: 404, method: 'GET', path: '/refund' }),
  )
  render(
    <FlightPermitCard
      mission={{ ...rejectedMission, flightPermitStatus: 'PENDING' }}
      onChanged={vi.fn()}
      depositPaid
      orderPermitRejected
    />,
  )

  expect(
    await screen.findByRole('button', { name: 'Request Deposit Refund' }),
  ).toBeInTheDocument()
})

it('shows the order preferred schedule before rescheduling', () => {
  render(
    <FlightPermitCard
      mission={rejectedMission}
      onChanged={vi.fn()}
      depositPaid
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Đề nghị dời lịch' }))

  expect(screen.getByText('Lịch khách hàng mong muốn')).toBeInTheDocument()
  expect(screen.getByText('Lịch nhiệm vụ hiện tại')).toBeInTheDocument()
  expect(screen.getByText('10/11/2026 – 12/11/2026')).toBeInTheDocument()
  expect(screen.getByText('Buổi sáng (08:00 – 11:00)')).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: /Chỉ dời nhiệm vụ/ })).toBeChecked()
  expect(
    screen.getByText('Cập nhật lịch thực hiện mới của nhiệm vụ'),
  ).toBeInTheDocument()
  expect(
    screen.queryByText('Bước 2 · Cập nhật lịch thực hiện mới của nhiệm vụ'),
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('radio', { name: /Dời lịch đơn hàng và nhiệm vụ/ }),
  ).toBeInTheDocument()
})

it('reschedules both Order and Mission when the new time is outside the current preference', async () => {
  vi.spyOn(missionsApi, 'listPreferredTimes').mockResolvedValue([
    {
      id: 'pt-morning',
      name: 'Morning',
      startTime: '08:00:00',
      endTime: '11:00:00',
    },
  ])
  const patchSchedule = vi
    .spyOn(missionsApi, 'patchSchedule')
    .mockResolvedValue({} as never)
  render(
    <FlightPermitCard
      mission={rejectedMission}
      onChanged={vi.fn()}
      depositPaid
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Đề nghị dời lịch' }))
  fireEvent.click(
    screen.getByRole('radio', { name: /Dời lịch đơn hàng và nhiệm vụ/ }),
  )
  expect(
    await screen.findByText('Bước 1 · Cập nhật lịch mong muốn mới của đơn hàng'),
  ).toBeInTheDocument()
  expect(screen.getByRole('option', { name: /Buổi sáng/ })).toBeInTheDocument()
  expect(
    screen.getByText('Bước 2 · Cập nhật lịch thực hiện mới của nhiệm vụ'),
  ).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Đơn hàng mong muốn từ ngày'), {
    target: { value: '2026-11-15' },
  })
  fireEvent.change(screen.getByLabelText('Đơn hàng mong muốn đến ngày'), {
    target: { value: '2026-11-20' },
  })
  fireEvent.change(screen.getByLabelText('Khung giờ mong muốn mới'), {
    target: { value: 'pt-morning' },
  })
  fireEvent.change(screen.getByLabelText('Bắt đầu mới'), {
    target: { value: '2026-11-15T08:00' },
  })
  fireEvent.change(screen.getByLabelText('Kết thúc mới'), {
    target: { value: '2026-11-15T09:00' },
  })
  fireEvent.click(
    screen.getByRole('checkbox', { name: /khách hàng đồng ý lịch mới/ }),
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Xác nhận dời đơn hàng & nhiệm vụ' }),
  )

  await waitFor(() =>
    expect(patchSchedule).toHaveBeenCalledWith(
      'mission-1',
      expect.objectContaining({
        scope: 'ORDER_AND_MISSION',
        orderPreferredDateFrom: '2026-11-15',
        orderPreferredDateTo: '2026-11-20',
        orderPreferredTimeId: 'pt-morning',
      }),
    ),
  )
})

it('preserves read-only access even after full payment', () => {
  render(
    <FlightPermitCard
      mission={rejectedMission}
      onChanged={vi.fn()}
      readOnly
      depositPaid
    />,
  )
  expect(screen.getByRole('textbox', { name: 'Ghi chú' })).toHaveAttribute(
    'readonly',
  )
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Chọn tệp giấy phép')).not.toBeInTheDocument()
})

it('blocks permit changes until the Deposit is confirmed', () => {
  render(
    <FlightPermitCard
      mission={rejectedMission}
      onChanged={vi.fn()}
      depositPaid={false}
    />,
  )
  expect(screen.getByRole('textbox', { name: 'Ghi chú' })).toBeDisabled()
  expect(screen.queryByLabelText('Chọn tệp giấy phép')).not.toBeInTheDocument()
  for (const button of screen.getAllByRole('button'))
    expect(button).toBeDisabled()
})
