import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultForm } from '../../../lib/createOrder/draftStorage'
import type { FormState, Step } from '../../../lib/createOrder/types'
import type { OrderAgentSession } from '../../../lib/createOrder/orderAgent'
import { OrderConversation } from './OrderConversation'

const apiMock = vi.fn()
vi.mock('../../../../../shared/api/httpClient', async () => {
  const actual = await vi.importActual<typeof import('../../../../../shared/api/httpClient')>(
    '../../../../../shared/api/httpClient',
  )
  return {
    ...actual,
    apiRequest: (...args: unknown[]) => apiMock(...args),
  }
})

const SERVICES = [
  { id: 'svc-factory', name: 'Kiểm tra nhà xưởng', isActive: true },
  { id: 'svc-build', name: 'Giám sát công trình', isActive: true },
  { id: 'svc-forest', name: 'Giám sát rừng', isActive: true },
]

function makeSession(): OrderAgentSession {
  return {
    id: 'sess-action-1',
    revision: 1,
    expiresAt: '2099-01-01T00:00:00Z',
    state: {
      messages: [],
      confirmedFields: {},
      pendingChanges: {},
      readyForReview: false,
    },
  }
}

function Harness({ initialServiceId = 'svc-factory' }: { initialServiceId?: string }) {
  const [form, setForm] = useState<FormState>(() => ({
    ...createDefaultForm(),
    flightPurpose: '',
    serviceId: initialServiceId,
  }))
  // Mirror CreateOrderPage: step 1 is false until service + purpose + description are all filled.
  const stepValidity: Partial<Record<Step, boolean>> = {
    1: Boolean(form.serviceId && form.flightPurpose && form.description.trim()),
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
  }
  return (
    <div>
      <div data-testid="current-service">{form.serviceId}</div>
      <OrderConversation
        form={form}
        setForm={setForm}
        services={SERVICES as never}
        deliverables={[]}
        stepValidity={stepValidity}
        serializeChecklist={() => []}
        checklistValid={false}
        mediaTotals={{ images: 0, videos: 0 }}
        onApply={() => {}}
        onOpenStep={() => {}}
        serviceSelectionStep
      />
    </div>
  )
}

describe('OrderConversation AI Action Agent (end-to-end UI)', () => {
  beforeEach(() => {
    apiMock.mockReset()
    apiMock.mockImplementation(async (url: string) => {
      if (url === '/api/customer/order-conversations') return makeSession()
      if (url.endsWith('/speech')) return new Blob(['RIFF'], { type: 'audio/wav' })
      return makeSession()
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('xử lý câu lỗi giọng nói "tôi múa trò dịch vụ giám sát công trình", cập nhật bản nháp sang 1/7 và hỗ trợ Hoàn tác', async () => {
    render(<Harness initialServiceId="svc-factory" />)

    // Mở hộp thoại AI hỗ trợ tạo yêu cầu
    fireEvent.click(screen.getByRole('button', { name: /Mở trợ lý tạo yêu cầu/i }))
    const input = await screen.findByLabelText('Nội dung trao đổi')

    // Trước khi gửi: đang chọn Kiểm tra nhà xưởng (1/7 mục đã xong)
    expect(screen.getByTestId('current-service')).toHaveTextContent('svc-factory')
    expect(screen.getByText('1/7 mục đã xong')).toBeInTheDocument()

    // Gõ câu lỗi nhận dạng giọng nói và bấm Gửi
    fireEvent.change(input, { target: { value: 'tôi múa trò dịch vụ giám sát công trình' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))

    // Bản nháp lập tức chuyển sang Giám sát công trình, KHÔNG treo ở "Trợ lý đang xử lý yêu cầu..."
    await waitFor(() => {
      expect(screen.getByTestId('current-service')).toHaveTextContent('svc-build')
    })
    expect(screen.queryByText(/Trợ lý đang xử lý yêu cầu/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Đã chọn dịch vụ Giám sát công trình\./)).toBeInTheDocument()
    expect(screen.getByText('1/7 mục đã xong')).toBeInTheDocument()

    // Bấm Hoàn tác → quay về Kiểm tra nhà xưởng
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn tác' }))
    await waitFor(() => {
      expect(screen.getByTestId('current-service')).toHaveTextContent('svc-factory')
    })
  })

  it('thực thi nhiều action trong một câu và tăng tiến độ lên 2/7 khi mục đích bay hợp lệ', async () => {
    render(<Harness initialServiceId="" />)

    fireEvent.click(screen.getByRole('button', { name: /Mở trợ lý tạo yêu cầu/i }))
    const input = await screen.findByLabelText('Nội dung trao đổi')

    expect(screen.getByText('0/7 mục đã xong')).toBeInTheDocument()

    fireEvent.change(input, {
      target: {
        value: 'chọn giám sát công trình, mục đích theo dõi tiến độ thi công',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))

    await waitFor(() => {
      expect(screen.getByTestId('current-service')).toHaveTextContent('svc-build')
    })
    expect(screen.getByText('2/7 mục đã xong')).toBeInTheDocument()
  })

  it('V2: cho phép nói "Cho tôi chọn lại dịch vụ" từ bước sau, hiện lại thẻ dịch vụ, rồi đổi liên tiếp sang Giám sát rừng -> Giám sát công trình', async () => {
    render(<Harness initialServiceId="svc-factory" />)

    fireEvent.click(screen.getByRole('button', { name: /Mở trợ lý tạo yêu cầu/i }))
    const input = await screen.findByLabelText('Nội dung trao đổi')

    // Bước 1: Mở lại danh sách chọn dịch vụ mà vẫn giữ dịch vụ hiện tại
    fireEvent.change(input, { target: { value: 'Cho tôi chọn lại dịch vụ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))

    await waitFor(() => {
      expect(screen.getByText(/Đã mở lại bước chọn dịch vụ/i)).toBeInTheDocument()
    })
    expect(screen.getByTestId('current-service')).toHaveTextContent('svc-factory')
    // Thẻ dịch vụ thật phải hiển thị trở lại trong giao diện
    expect(screen.getAllByText('Giám sát rừng').length).toBeGreaterThan(0)

    // Bước 2: Đổi nhanh liên tiếp: Giám sát rừng -> À không, không phải rừng, giám sát công trình
    fireEvent.change(input, { target: { value: 'Chọn giám sát rừng' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    await waitFor(() => {
      expect(screen.getByTestId('current-service')).toHaveTextContent('svc-forest')
    })

    fireEvent.change(input, { target: { value: 'Khoan, không phải nhà xưởng, công trình' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    await waitFor(() => {
      expect(screen.getByTestId('current-service')).toHaveTextContent('svc-build')
    })
  })
})
