import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { OrderConversation } from './OrderConversation'
import { createDefaultForm } from '../../../lib/createOrder/draftStorage'
import type { OrderAgentSession } from '../../../lib/createOrder/orderAgent'
import { apiRequest, ApiError } from '../../../../../shared/api/httpClient'
import { customerApi } from '../../../api/customerApi'
vi.mock('../../../../../shared/api/httpClient', async () => ({
  ...(await vi.importActual('../../../../../shared/api/httpClient')),
  apiRequest: vi.fn(),
}))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
function setup() {
  vi.spyOn(customerApi, 'getChecklistCatalog').mockResolvedValue([])
  const props = {
    form: createDefaultForm(),
    setForm: vi.fn(),
    services: [{ id: 's', name: 'Catalog service' }],
    deliverables: [],
    serializeChecklist: () => [],
    mediaTotals: { images: 4, videos: 0 },
    onApply: vi.fn(),
    onOpenStep: vi.fn(),
  }
  const session: OrderAgentSession = {
    id: 'session',
    revision: 0,
    expiresAt: '2099-01-01',
    state: {
      messages: [],
      confirmedFields: {},
      pendingChanges: {},
      readyForReview: false,
    },
  }
  return { props, session }
}
it('records chat and confirms proposals explicitly without ever submitting an order', async () => {
  const { props, session } = setup()
  const proposal = {
    ...session,
    revision: 1,
    state: {
      ...session.state,
      messages: [
        { role: 'assistant' as const, content: 'Bạn có thể chọn dịch vụ này.' },
      ],
      pendingChanges: { serviceId: 's' },
    },
  }
  vi.mocked(apiRequest)
    .mockResolvedValueOnce(session)
    .mockResolvedValueOnce(proposal)
    .mockResolvedValueOnce({
      ...proposal,
      revision: 2,
      state: {
        ...proposal.state,
        pendingChanges: {},
        confirmedFields: { serviceId: 's' },
      },
    })
  render(<OrderConversation {...props} />)
  fireEvent.click(screen.getByText('Tư vấn tạo đơn bằng AI'))
  await screen.findByLabelText('Nội dung trao đổi')
  fireEvent.change(screen.getByLabelText('Nội dung trao đổi'), {
    target: { value: 'Tôi cần theo dõi công trình' },
  })
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Gửi' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
  await screen.findByText('Đề xuất — cần bạn xác nhận')
  expect(props.setForm).toHaveBeenCalledTimes(1) // Session pointer only, not the proposal.
  fireEvent.click(screen.getByText('Xác nhận lựa chọn này'))
  await waitFor(() => expect(props.setForm).toHaveBeenCalledTimes(2))
  expect(vi.mocked(apiRequest).mock.calls.map((c) => c[0])).toEqual([
    '/api/customer/order-conversations',
    '/api/customer/order-conversations/session/messages',
    '/api/customer/order-conversations/session/confirm',
  ])
  expect(props.onApply).not.toHaveBeenCalled()
})
it('opens existing map and date steps and keeps the same session', async () => {
  const { props, session } = setup()
  vi.mocked(apiRequest).mockResolvedValue(session)
  render(<OrderConversation {...props} />)
  fireEvent.click(screen.getByText('Tư vấn tạo đơn bằng AI'))
  await screen.findByLabelText('Nội dung trao đổi')
  fireEvent.click(screen.getByText('Chọn khu vực trên bản đồ'))
  expect(props.onOpenStep).toHaveBeenCalledWith(2)
})

it('validates an AI review request and calls the real apply boundary without submitting', async () => {
  const { props, session } = setup()
  const review = {
    ...session,
    revision: 1,
    state: { ...session.state, requestedUiAction: 'REVIEW' as const },
  }
  const validated = {
    ...review,
    revision: 2,
    state: { ...review.state, readyForReview: true },
  }
  vi.mocked(apiRequest)
    .mockResolvedValueOnce(session)
    .mockResolvedValueOnce(review)
    .mockResolvedValueOnce(validated)
  render(<OrderConversation {...props} />)
  fireEvent.click(screen.getByText('Tư vấn tạo đơn bằng AI'))
  await screen.findByLabelText('Nội dung trao đổi')
  fireEvent.change(screen.getByLabelText('Nội dung trao đổi'), {
    target: { value: 'Hãy kiểm tra để tôi xem lại đơn' },
  })
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Gửi' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
  await waitFor(() =>
    expect(props.onApply).toHaveBeenCalledWith(validated, props.form),
  )
  expect(vi.mocked(apiRequest).mock.calls.map((call) => call[0])).toEqual([
    '/api/customer/order-conversations',
    '/api/customer/order-conversations/session/messages',
    '/api/customer/order-conversations/session/validate',
  ])
})
it('loads the current revision after 409 without replaying or applying speculative changes', async () => {
  const { props, session } = setup()
  vi.mocked(apiRequest)
    .mockResolvedValueOnce(session)
    .mockRejectedValueOnce(
      new ApiError('Conflict', {
        status: 409,
        method: 'POST',
        path: '/messages',
      }),
    )
    .mockResolvedValueOnce({ ...session, revision: 4 })
  render(<OrderConversation {...props} />)
  fireEvent.click(screen.getByText('Tư vấn tạo đơn bằng AI'))
  await screen.findByLabelText('Nội dung trao đổi')
  fireEvent.change(screen.getByLabelText('Nội dung trao đổi'), {
    target: { value: 'Sửa yêu cầu' },
  })
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Gửi' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
  await screen.findByText(/Đã tải hội thoại mới nhất/)
  expect(
    vi.mocked(apiRequest).mock.calls.filter((c) => c[0].endsWith('/messages')),
  ).toHaveLength(1)
  expect(props.setForm).toHaveBeenCalledTimes(1)
  expect(props.onApply).not.toHaveBeenCalled()
})

it('sends missing enum/date/map fields to validation without manufacturing geometry', async () => {
  const { props, session } = setup()
  props.form.flightPurpose = ''
  vi.mocked(apiRequest).mockResolvedValue(session)
  render(<OrderConversation {...props} />)
  fireEvent.click(screen.getByText('Tư vấn tạo đơn bằng AI'))
  await screen.findByLabelText('Nội dung trao đổi')
  await waitFor(() =>
    expect(screen.getByText('Kiểm tra và xem lại đơn')).toBeEnabled(),
  )
  fireEvent.click(screen.getByText('Kiểm tra và xem lại đơn'))
  await screen.findByText(/Bản nháp còn thiếu thông tin/)
  const call = vi
    .mocked(apiRequest)
    .mock.calls.find(([path]) => path.endsWith('/validate'))
  const body = call?.[1]?.body as { draft: Record<string, unknown> }
  expect(body.draft).not.toHaveProperty('coverageArea')
  expect(body.draft).not.toHaveProperty('latitude')
  expect(body.draft).not.toHaveProperty('flightPurpose')
  expect(props.onApply).not.toHaveBeenCalled()
})

it('denied microphone permission keeps text chat usable', async () => {
  const { props, session } = setup()
  vi.mocked(apiRequest).mockResolvedValue(session)
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
    },
  })
  render(<OrderConversation {...props} />)
  fireEvent.click(screen.getByText('Tư vấn tạo đơn bằng AI'))
  await screen.findByLabelText('Nội dung trao đổi')
  fireEvent.click(screen.getByText('Nhập bằng giọng nói'))
  await screen.findByText(/Không mở được micro/)
  fireEvent.change(screen.getByLabelText('Nội dung trao đổi'), {
    target: { value: 'Tôi nhập bằng bàn phím' },
  })
  expect(screen.getByRole('button', { name: 'Gửi' })).toBeEnabled()
})

it('canceling recording stops microphone tracks without uploading audio',async()=>{
  const {props,session}=setup()
  vi.mocked(apiRequest).mockResolvedValue(session)
  const stop=vi.fn();const stream={getTracks:()=>[{stop}]}
  Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:vi.fn().mockResolvedValue(stream)}})
  class Recorder {
    state='inactive';mimeType='audio/webm';stream=stream;onstop?:()=>void
    start(){this.state='recording'}
    stop(){this.state='inactive';this.onstop?.()}
  }
  vi.stubGlobal('MediaRecorder',Recorder)
  render(<OrderConversation {...props}/>)
  fireEvent.click(screen.getByText('Tư vấn tạo đơn bằng AI'))
  await screen.findByLabelText('Nội dung trao đổi')
  fireEvent.click(screen.getByText('Nhập bằng giọng nói'))
  await screen.findByText('Dừng ghi âm')
  fireEvent.click(screen.getByText('Tiếp tục nhập thủ công'))
  expect(stop).toHaveBeenCalled()
  expect(vi.mocked(apiRequest).mock.calls.some(([path])=>path.endsWith('/transcribe'))).toBe(false)
})
