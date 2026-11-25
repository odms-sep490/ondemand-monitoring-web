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
    checklistValid: false,
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
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
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
  fireEvent.click(screen.getByRole('button', { name: 'Mở trợ lý tạo yêu cầu' }))
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
it('asks for the site relationship before advancing to the map', async () => {
  const { props, session } = setup()
  const guidedSession = {
    ...session,
    revision: 1,
    state: {
      ...session.state,
      messages: [
        {
          role: 'user' as const,
          content:
            'Tôi chọn dịch vụ Catalog service.\n\n[ONDEMAND_GUIDED_PROMPT]\nTrước khi chuyển sang bản đồ, hãy hỏi đúng một câu về mối liên hệ.',
        },
        {
          role: 'assistant' as const,
          content: 'Bạn là ai với công trình?',
        },
      ],
      requestedUiAction: 'MAP' as const,
    },
  }
  vi.mocked(apiRequest)
    .mockResolvedValueOnce(session)
    .mockResolvedValueOnce(guidedSession)
  const view = render(<OrderConversation {...props} />)
  fireEvent.click(
    screen.getByRole('button', { name: 'Mở trợ lý tạo yêu cầu' }),
  )
  await screen.findByLabelText('Nội dung trao đổi')
  fireEvent.click(screen.getByRole('button', { name: 'Chọn dịch vụ' }))
  await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(2))
  expect(vi.mocked(apiRequest).mock.calls[1]?.[1]).toMatchObject({
    body: expect.objectContaining({
      text: expect.stringContaining(
        'Trước khi chuyển sang bản đồ, hãy hỏi đúng một câu về mối liên hệ',
      ),
    }),
  })
  expect(
    screen.getByText('Tôi chọn dịch vụ Catalog service.'),
  ).toBeInTheDocument()
  expect(
    screen.queryByText(/Trước khi chuyển sang bản đồ/),
  ).not.toBeInTheDocument()

  props.form.serviceId = 's'
  view.rerender(<OrderConversation {...props} />)
  const relationshipButton = screen.getByRole('button', {
    name: 'Trả lời trợ lý về mối liên hệ với công trình',
  })
  expect(
    screen.queryByRole('button', { name: 'Chọn khu vực trên bản đồ' }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Liên hệ và quyền giám sát' }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Chọn ngày và khung giờ' }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Bàn giao và xem lại' }),
  ).not.toBeInTheDocument()
  fireEvent.click(relationshipButton)
  expect(screen.getByLabelText('Nội dung trao đổi')).toHaveFocus()
})

it('keeps the AI guide in relationship, purpose, map, checklist, site conditions, then schedule order', async () => {
  const { props, session } = setup()
  props.form.serviceId = 's'
  props.form.flightPurpose = ''
  props.checklistValid = false
  const guidedSession: OrderAgentSession = {
    ...session,
    state: {
      ...session.state,
      messages: [
        {
          role: 'assistant',
          content: 'Chúng ta sẽ lần lượt làm rõ vị trí, checklist, điều kiện và lịch.',
        },
      ],
      requestedUiAction: 'SCHEDULE',
      nextQuestionField: 'preferredDateFrom',
    },
  }
  vi.mocked(apiRequest)
    .mockResolvedValueOnce(guidedSession)
    .mockResolvedValueOnce(guidedSession)
  const view = render(<OrderConversation {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Mở trợ lý tạo yêu cầu' }))

  expect(
    await screen.findByRole('button', {
      name: 'Trả lời trợ lý về mối liên hệ với công trình',
    }),
  ).toBeInTheDocument()

  props.form.monitoringRelationship = 'CONTRACTOR'
  view.rerender(<OrderConversation {...props} />)
  expect(
    screen.getByRole('button', { name: 'Mục đích chuyến bay' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Chọn khu vực trên bản đồ' }),
  ).not.toBeInTheDocument()

  props.form.flightPurpose = 'CONSTRUCTION_MONITORING'
  view.rerender(<OrderConversation {...props} />)
  expect(
    screen.getByRole('button', { name: 'Chọn khu vực trên bản đồ' }),
  ).toBeInTheDocument()

  props.form.locationStatus = 'confirmed'
  props.form.locationConfirmedAt = '2026-11-24T00:00:00Z'
  props.form.coverageAreaShape = 'POLYGON'
  props.form.coverageArea = {
    type: 'Polygon',
    coordinates: [
      [
        [106.6, 10.7],
        [106.61, 10.7],
        [106.61, 10.71],
        [106.6, 10.7],
      ],
    ],
  }
  view.rerender(<OrderConversation {...props} />)
  expect(
    screen.getByRole('button', { name: 'Chọn checklist, số ảnh và video' }),
  ).toBeInTheDocument()

  fireEvent.click(
    screen.getByRole('button', { name: 'Chọn checklist, số ảnh và video' }),
  )
  expect(
    screen.getByRole('button', { name: 'Xác nhận và tiếp tục' }),
  ).toBeDisabled()
  fireEvent.click(
    screen.getByRole('button', { name: 'Quay lại trò chuyện' }),
  )

  props.checklistValid = true
  view.rerender(<OrderConversation {...props} />)
  expect(
    screen.getByRole('button', { name: 'Chọn checklist, số ảnh và video' }),
  ).toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('button', { name: 'Chọn checklist, số ảnh và video' }),
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Xác nhận và tiếp tục' }),
  )
  expect(
    await screen.findByRole('button', {
      name: 'Điều kiện ra vào và quyền giám sát',
    }),
  ).toBeInTheDocument()
  expect(vi.mocked(apiRequest).mock.calls[1]?.[1]).toMatchObject({
    body: expect.objectContaining({
      text: expect.stringContaining(
        'Hiện chỉ hướng dẫn bước Điều kiện ra vào và quyền giám sát',
      ),
    }),
  })

  Object.assign(props.form, {
    siteContactName: 'An',
    siteContactPhone: '0901234567',
    accessNotes: 'Cổng chính',
    monitoringAuthorizationConfirmed: true,
    altitudeM: 50,
  })
  view.rerender(<OrderConversation {...props} />)
  expect(
    screen.getByRole('button', { name: 'Chọn ngày và khung giờ' }),
  ).toBeInTheDocument()

  Object.assign(props.form, {
    preferredDateFrom: '2027-01-01',
    preferredDateTo: '2027-01-02',
    preferredTimeId: 'morning',
  })
  view.rerender(<OrderConversation {...props} />)
  expect(
    screen.getByRole('button', { name: 'Bàn giao và xem lại' }),
  ).toBeInTheDocument()
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
  fireEvent.click(screen.getByRole('button', { name: 'Mở trợ lý tạo yêu cầu' }))
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
  fireEvent.click(screen.getByRole('button', { name: 'Mở trợ lý tạo yêu cầu' }))
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
  fireEvent.click(screen.getByRole('button', { name: 'Mở trợ lý tạo yêu cầu' }))
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
  fireEvent.click(screen.getByRole('button', { name: 'Mở trợ lý tạo yêu cầu' }))
  await screen.findByLabelText('Nội dung trao đổi')
  fireEvent.click(screen.getByText('Nhập bằng giọng nói'))
  await screen.findByText(/Không mở được micro/)
  fireEvent.change(screen.getByLabelText('Nội dung trao đổi'), {
    target: { value: 'Tôi nhập bằng bàn phím' },
  })
  expect(screen.getByRole('button', { name: 'Gửi' })).toBeEnabled()
})

it('shows an optimistic user bubble and compact animated assistant bubble until the real reply arrives', async () => {
  const { props, session } = setup()
  props.form.orderAgentSessionId = session.id
  const response = deferred<OrderAgentSession>()
  vi.mocked(apiRequest)
    .mockResolvedValueOnce(session)
    .mockReturnValueOnce(response.promise)
  render(<OrderConversation {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Mở trợ lý tạo yêu cầu' }))
  await screen.findByLabelText('Nội dung trao đổi')
  fireEvent.change(screen.getByLabelText('Nội dung trao đổi'), {
    target: { value: 'Tôi cần theo dõi công trình' },
  })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Gửi' })).toBeEnabled())
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))

  const loading = await screen.findByRole('status')
  expect(loading).toHaveTextContent('Trợ lý đang xử lý yêu cầu...')
  expect(loading.querySelector('.order-chat-typing i')).toBeInTheDocument()
  expect(document.querySelector('.order-agent-message.is-optimistic')).toHaveTextContent(
    'Tôi cần theo dõi công trình',
  )
  expect(screen.getByRole('button', { name: 'Gửi' })).toBeDisabled()
  expect(
    vi.mocked(apiRequest).mock.calls.filter(([path]) => path.endsWith('/messages')),
  ).toHaveLength(1)

  response.resolve({
    ...session,
    revision: 1,
    state: {
      ...session.state,
      messages: [{ role: 'assistant', content: 'Tôi có thể hỗ trợ yêu cầu này.' }],
    },
  })
  expect(await screen.findByText('Tôi có thể hỗ trợ yêu cầu này.')).toBeInTheDocument()
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
  expect(screen.queryByText('Tôi cần theo dõi công trình')).not.toBeInTheDocument()
})

it('replaces loading with the API error, keeps the message, and retries with the same request id', async () => {
  const { props, session } = setup()
  props.form.orderAgentSessionId = session.id
  const response = {
    ...session,
    revision: 1,
    state: {
      ...session.state,
      messages: [{ role: 'assistant' as const, content: 'Trợ lý đã phản hồi.' }],
    },
  }
  vi.mocked(apiRequest)
    .mockResolvedValueOnce(session)
    .mockRejectedValueOnce(new Error('Dịch vụ đang tạm thời không phản hồi.'))
    .mockResolvedValueOnce(response)
  render(<OrderConversation {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Mở trợ lý tạo yêu cầu' }))
  await screen.findByLabelText('Nội dung trao đổi')
  const input = screen.getByLabelText('Nội dung trao đổi')
  fireEvent.change(input, { target: { value: 'Giữ lại nội dung này' } })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Gửi' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))

  expect(await screen.findByText('Dịch vụ đang tạm thời không phản hồi.')).toBeInTheDocument()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(input).toHaveValue('Giữ lại nội dung này')
  expect(document.querySelector('.order-agent-message.is-optimistic')).toHaveTextContent(
    'Giữ lại nội dung này',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  expect(await screen.findByText('Trợ lý đã phản hồi.')).toBeInTheDocument()

  const messageCalls = vi.mocked(apiRequest).mock.calls.filter(([path]) => path.endsWith('/messages'))
  const requestIds = messageCalls.map(([, options]) =>
    (options?.body as { requestId: string }).requestId,
  )
  expect(requestIds).toHaveLength(2)
  expect(requestIds[1]).toBe(requestIds[0])
})

it('ignores a late response after the chat modal closes', async () => {
  const { props, session } = setup()
  props.form.orderAgentSessionId = session.id
  const response = deferred<OrderAgentSession>()
  vi.mocked(apiRequest)
    .mockResolvedValueOnce(session)
    .mockReturnValueOnce(response.promise)
  render(<OrderConversation {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Mở trợ lý tạo yêu cầu' }))
  await screen.findByLabelText('Nội dung trao đổi')
  fireEvent.change(screen.getByLabelText('Nội dung trao đổi'), {
    target: { value: 'Yêu cầu đang gửi' },
  })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Gửi' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
  await screen.findByRole('status')

  const closeButton = document.querySelector<HTMLButtonElement>(
    '.order-chat-restored .ant-modal-close',
  )
  expect(closeButton).not.toBeNull()
  fireEvent.click(closeButton!)
  await waitFor(() => expect(document.querySelector('.ant-modal')?.className).toContain('ant-zoom-leave'))
  const messageCall = vi.mocked(apiRequest).mock.calls.find(([path]) => path.endsWith('/messages'))
  expect(messageCall?.[1]?.signal?.aborted).toBe(true)
  response.resolve({
    ...session,
    state: {
      ...session.state,
      messages: [{ role: 'assistant', content: 'Phản hồi cũ không được hiển thị.' }],
    },
  })
  await waitFor(() => expect(screen.queryByText('Phản hồi cũ không được hiển thị.')).not.toBeInTheDocument())
})

it('switches sessions without applying the previous session response', async () => {
  const { props, session } = setup()
  props.form.orderAgentSessionId = session.id
  const staleResponse = deferred<OrderAgentSession>()
  const otherSession: OrderAgentSession = {
    ...session,
    id: 'other-session',
    state: {
      ...session.state,
      messages: [{ role: 'assistant', content: 'Hội thoại mới đã sẵn sàng.' }],
    },
  }
  vi.mocked(apiRequest)
    .mockResolvedValueOnce(session)
    .mockReturnValueOnce(staleResponse.promise)
    .mockResolvedValueOnce(otherSession)
  const view = render(<OrderConversation {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Mở trợ lý tạo yêu cầu' }))
  await screen.findByLabelText('Nội dung trao đổi')
  fireEvent.change(screen.getByLabelText('Nội dung trao đổi'), {
    target: { value: 'Tin nhắn thuộc phiên cũ' },
  })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Gửi' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
  await screen.findByRole('status')

  props.form.orderAgentSessionId = otherSession.id
  view.rerender(<OrderConversation {...props} />)
  expect(await screen.findByText('Hội thoại mới đã sẵn sàng.')).toBeInTheDocument()
  staleResponse.resolve({
    ...session,
    state: {
      ...session.state,
      messages: [{ role: 'assistant', content: 'Phản hồi của phiên cũ.' }],
    },
  })
  await waitFor(() => expect(screen.queryByText('Phản hồi của phiên cũ.')).not.toBeInTheDocument())
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

it('plays the authenticated AI voice and mute stops audio and speaking animation', async () => {
  const { props, session } = setup()
  props.form.orderAgentSessionId = session.id
  class FakeAudio {
    static latest: FakeAudio | undefined
    src: string
    onplaying: (() => void) | null = null
    onended: (() => void) | null = null
    onerror: (() => void) | null = null
    pause = vi.fn()
    play = vi.fn(async () => { this.onplaying?.() })
    constructor(src: string) { this.src = src; FakeAudio.latest = this }
  }
  vi.stubGlobal('Audio', FakeAudio)
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:assistant-voice'),
    revokeObjectURL: vi.fn(),
  } as unknown as typeof URL)
  const assistantReply = {
    ...session,
    state: {
      ...session.state,
      messages: [{ role: 'assistant' as const, content: 'Đây là câu trả lời.' }],
    },
  }
  vi.mocked(apiRequest)
    .mockResolvedValueOnce(session)
    .mockResolvedValueOnce(assistantReply)
    .mockResolvedValueOnce(new Blob(['wav'], { type: 'audio/wav' }) as never)
  render(<OrderConversation {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Mở trợ lý tạo yêu cầu' }))
  await screen.findByLabelText('Nội dung trao đổi')
  fireEvent.change(screen.getByLabelText('Nội dung trao đổi'), {
    target: { value: 'Xin tư vấn' },
  })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Gửi' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
  await screen.findByText('Đây là câu trả lời.')
  await waitFor(() => expect(FakeAudio.latest?.play).toHaveBeenCalled())
  expect(apiRequest).toHaveBeenCalledWith(
    expect.stringMatching(new RegExp(`/${session.id}/speech$`)),
    expect.objectContaining({ method: 'POST', responseType: 'blob' }),
  )
  const avatar = document.querySelector('.order-agent-avatar')
  expect(avatar).not.toBeNull()
  await waitFor(() => expect(avatar).toHaveClass('is-speaking'))
  fireEvent.click(screen.getByRole('button', { name: 'Tắt giọng trợ lý' }))
  await waitFor(() => expect(avatar).not.toHaveClass('is-speaking'))
  if (!FakeAudio.latest) throw new Error('The assistant audio element was not created.')
  expect(FakeAudio.latest.pause).toHaveBeenCalledOnce()
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
  fireEvent.click(screen.getByRole('button', { name: 'Mở trợ lý tạo yêu cầu' }))
  await screen.findByLabelText('Nội dung trao đổi')
  fireEvent.click(screen.getByText('Nhập bằng giọng nói'))
  await screen.findByText('Dừng ghi âm')
  fireEvent.click(screen.getByText('Tiếp tục nhập thủ công'))
  expect(stop).toHaveBeenCalled()
  expect(vi.mocked(apiRequest).mock.calls.some(([path])=>path.endsWith('/transcribe'))).toBe(false)
})
