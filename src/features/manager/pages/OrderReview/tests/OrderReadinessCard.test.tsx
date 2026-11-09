import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { readinessApi } from '../../../api/readinessApi'
import { ordersApi } from '../../../api/ordersApi'
import type { OrderReadiness } from '../../../types/readiness'
import { OrderReadinessCard } from '../components/OrderReadinessCard'

vi.mock('../../../api/readinessApi', () => ({
  readinessApi: { get: vi.fn(), answer: vi.fn() },
}))
vi.mock('../../../api/ordersApi', () => ({
  ordersApi: { submitApproval: vi.fn() },
}))

const readiness: OrderReadiness = {
  orderId: 'o1',
  canApprove: false,
  recommendation: 'COMPLETE_REVIEW',
  blockingReasons: ['Năng lực thực hiện: manager chưa xác nhận'],
  criteria: [
    {
      code: 'SERVICE_AREA',
      type: 'AUTO',
      title: 'Vùng phục vụ',
      description: 'desc',
      required: true,
      result: 'PASS',
      reason: 'Vị trí nằm trong vùng phục vụ',
      note: null,
      decidedByName: null,
      decidedAt: null,
    },
    {
      code: 'SCHEDULE_DATE',
      type: 'AUTO',
      title: 'Thời gian thực hiện',
      description: 'Ngày thực hiện và hạn nhận kết quả',
      required: false,
      result: 'WARN',
      reason: 'Hạn nhận kết quả rất sát ngày thực hiện',
      note: null,
      decidedByName: null,
      decidedAt: null,
    },
    {
      code: 'CAPABILITY',
      type: 'MANUAL',
      title: 'Năng lực thực hiện',
      description: 'Công ty đủ thiết bị',
      required: true,
      result: 'PENDING',
      reason: null,
      note: null,
      decidedByName: null,
      decidedAt: null,
    },
  ],
}

function renderCard(
  editable = true,
  onLocalBlockChange?: (blocked: boolean) => void,
  data: OrderReadiness = readiness,
) {
  const query = {
    data,
    error: undefined,
    loading: false,
    reload: vi.fn(),
  }
  render(
    <OrderReadinessCard
      orderId="o1"
      query={query}
      editable={editable}
      onLocalBlockChange={onLocalBlockChange}
    />,
  )
  return query
}

describe('OrderReadinessCard', () => {
  beforeEach(() => {
    vi.mocked(readinessApi.answer).mockReset()
    vi.mocked(readinessApi.answer).mockResolvedValue(readiness)
    vi.mocked(ordersApi.submitApproval).mockReset()
    vi.mocked(ordersApi.submitApproval).mockResolvedValue(undefined)
  })

  it('shows the system checks and the criteria the manager must answer', () => {
    renderCard()
    expect(
      screen.getByText('Vị trí nằm trong vùng phục vụ'),
    ).toBeInTheDocument()
    expect(screen.getByText('Năng lực thực hiện')).toBeInTheDocument()
    expect(screen.queryByText('Thời gian thực hiện')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Hạn nhận kết quả rất sát ngày thực hiện'),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Còn 1 mục quản lý cần xác nhận',
    )
  })

  it('saves a passing answer immediately and reloads', async () => {
    const query = renderCard()
    const passButton = screen.getByRole('button', {
      name: 'Đạt',
      pressed: false,
    })
    fireEvent.click(passButton)
    expect(
      screen.getByRole('button', { name: 'Đang lưu…', pressed: true }),
    ).toBeDisabled()
    await waitFor(() =>
      expect(readinessApi.answer).toHaveBeenCalledWith('o1', 'CAPABILITY', {
        result: 'PASS',
        note: null,
      }),
    )
    await waitFor(() => expect(query.reload).toHaveBeenCalled())
  })

  it('requires a reason before saving a failing answer', async () => {
    const onLocalBlockChange = vi.fn()
    renderCard(true, onLocalBlockChange)
    fireEvent.click(screen.getByRole('button', { name: 'Không đạt' }))
    await waitFor(() =>
      expect(onLocalBlockChange).toHaveBeenLastCalledWith(true),
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Có tiêu chí bắt buộc không đạt',
    )
    expect(readinessApi.answer).not.toHaveBeenCalled()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    const reject = screen.getByRole('button', { name: 'Từ chối đơn' })
    expect(
      screen.queryByRole('button', { name: 'Yêu cầu bổ sung' }),
    ).not.toBeInTheDocument()
    expect(reject).toBeEnabled()
    const save = screen.getByRole('button', { name: 'Lưu' })
    expect(save).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Ghi chú: Năng lực thực hiện'), {
      target: { value: 'Không có drone ảnh nhiệt' },
    })
    expect(save).toBeEnabled()
    fireEvent.click(save)
    await waitFor(() =>
      expect(readinessApi.answer).toHaveBeenCalledWith('o1', 'CAPABILITY', {
        result: 'FAIL',
        note: 'Không có drone ảnh nhiệt',
      }),
    )
    expect(ordersApi.submitApproval).not.toHaveBeenCalled()
  })

  it('requires choosing what the customer must supplement before sending', async () => {
    renderCard(true, undefined, {
      ...readiness,
      blockingReasons: ['Quyền truy cập hiện trường: manager chưa xác nhận'],
      criteria: readiness.criteria.map((criterion) =>
        criterion.code === 'CAPABILITY'
          ? {
              ...criterion,
              code: 'SITE_ACCESS',
              title: 'Quyền truy cập hiện trường',
              description: 'Khách hàng có quyền sử dụng khu vực',
            }
          : criterion,
      ),
    })
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Chưa liên hệ được / không đồng ý',
      }),
    )
    fireEvent.change(
      screen.getByLabelText('Ghi chú: Quyền truy cập hiện trường'),
      {
        target: { value: 'Chưa có giấy đồng ý của chủ khu vực' },
      },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu bổ sung' }))

    const send = screen.getByRole('button', { name: 'Gửi yêu cầu bổ sung' })
    expect(send).toBeDisabled()
    fireEvent.click(
      screen.getByLabelText(
        'Giấy tờ chứng minh quyền sử dụng hoặc giấy ủy quyền tại khu vực',
      ),
    )
    expect(send).toBeEnabled()
    fireEvent.click(send)

    await waitFor(() =>
      expect(ordersApi.submitApproval).toHaveBeenCalledWith('o1', {
        decision: 'NEED_INFO',
        reason: expect.stringContaining(
          'Giấy tờ chứng minh quyền sử dụng hoặc giấy ủy quyền tại khu vực',
        ),
        requestedUpdateScope: 'ADDITIONAL_INFORMATION',
      }),
    )
  })

  it('only suggests a clear usage-purpose description when PURPOSE fails', () => {
    renderCard(true, undefined, {
      ...readiness,
      canApprove: true,
      blockingReasons: [],
      recommendation: 'APPROVE_WITH_NOTES',
      criteria: [
        ...readiness.criteria,
        {
          code: 'PURPOSE',
          type: 'MANUAL',
          title: 'Mục đích sử dụng',
          description: 'Mục đích sử dụng dữ liệu của khách chấp nhận được',
          required: false,
          result: 'FAIL',
          reason: null,
          note: 'Mục đích hiện tại chưa rõ',
          decidedByName: 'Seed Manager 1',
          decidedAt: '2026-10-22T08:00:00Z',
        },
      ],
    })

    fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu bổ sung' }))

    expect(
      screen.getByLabelText('Mô tả rõ mục đích sử dụng ảnh và dữ liệu'),
    ).toBeVisible()
    expect(
      screen.queryByText(
        'Giấy tờ chứng minh nhu cầu sử dụng hoặc văn bản ủy quyền',
      ),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('Thông tin đơn vị nhận và phạm vi sử dụng kết quả'),
    ).not.toBeInTheDocument()
  })

  it('shows the reject-order action immediately for a local required failure', () => {
    renderCard(true, undefined, {
      ...readiness,
      canApprove: true,
      blockingReasons: [],
      recommendation: 'APPROVE',
    })

    fireEvent.click(screen.getByRole('button', { name: 'Không đạt' }))

    expect(screen.getByRole('button', { name: 'Từ chối đơn' })).toBeVisible()
  })

  it('is read-only once the order is no longer pending', () => {
    renderCard(false)
    expect(screen.getByRole('button', { name: 'Đạt' })).toBeDisabled()
  })
})
