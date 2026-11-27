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
  { id: 'svc-build', name: 'Giám sát công trình', isActive: true },
  { id: 'svc-factory', name: 'Kiểm tra nhà xưởng', isActive: true },
]

const TIMES = [
  { id: 'time-morning', name: 'Buổi sáng', startTime: '07:00', endTime: '11:30' },
  { id: 'time-afternoon', name: 'Buổi chiều', startTime: '13:00', endTime: '17:30' },
]

function makeSession(): OrderAgentSession {
  return {
    id: 'sess-v5-1',
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

function V5Harness() {
  const [form, setForm] = useState<FormState>(() => ({
    ...createDefaultForm(),
    flightPurpose: '',
    serviceId: '',
  }))
  const stepValidity: Partial<Record<Step, boolean>> = {
    1: Boolean(form.serviceId && form.flightPurpose && form.description.trim()),
    2: form.locationStatus === 'confirmed',
    3: true,
    4: Boolean(form.siteContactName && form.siteContactPhone),
    5: Boolean(form.preferredDateFrom && form.preferredTimeId),
    6: form.termsAccepted,
  }
  return (
    <div>
      <div data-testid="v5-service">{form.serviceId}</div>
      <div data-testid="v5-purpose">{form.flightPurpose}</div>
      <div data-testid="v5-description">{form.description}</div>
      <div data-testid="v5-contact">
        {form.siteContactName}|{form.siteContactPhone}
      </div>
      <div data-testid="v5-schedule">
        {form.preferredDateFrom}|{form.preferredTimeId}
      </div>
      <OrderConversation
        form={form}
        setForm={setForm}
        services={SERVICES as never}
        deliverables={[]}
        preferredTimes={TIMES as never}
        stepValidity={stepValidity}
        serializeChecklist={() => []}
        checklistValid={true}
        onApply={() => {}}
        onOpenStep={() => {}}
        serviceSelectionStep
      />
    </div>
  )
}

describe('OrderConversation V5 — End-to-End Voice-to-Form DOM Automation', () => {
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

  it('fills actual DOM textarea, service, purpose, contact and schedule via natural Vietnamese voice/chat', async () => {
    render(<V5Harness />)

    fireEvent.click(screen.getByRole('button', { name: /Mở trợ lý tạo yêu cầu/i }))
    const input = await screen.findByLabelText('Nội dung trao đổi')

    // 1. Select service + flight purpose
    fireEvent.change(input, {
      target: { value: 'Giám sát công trình, theo dõi tiến độ thi công' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))

    await waitFor(() => {
      expect(screen.getByTestId('v5-service')).toHaveTextContent('svc-build')
      expect(screen.getByTestId('v5-purpose')).toHaveTextContent('CONSTRUCTION_MONITORING')
    })

    // 2. Speak mission description -> populates REAL textarea "Mô tả yêu cầu giám sát"
    const descText =
      'Tôi muốn quay toàn cảnh tòa nhà, kiểm tra mái và ghi nhận tiến độ xây dựng.'
    fireEvent.change(input, { target: { value: descText } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))

    await waitFor(() => {
      expect(screen.getByTestId('v5-description')).toHaveTextContent(
        'quay toàn cảnh tòa nhà',
      )
    })
    const realTextarea = screen.getByLabelText('Mô tả yêu cầu giám sát') as HTMLTextAreaElement
    expect(realTextarea.value).toContain('quay toàn cảnh tòa nhà')

    // 3. Speak contact details -> populates real contact name & phone
    fireEvent.change(input, {
      target: { value: 'Tôi tên Nguyễn Văn A, số điện thoại 0901234567' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    await waitFor(() => {
      expect(screen.getByTestId('v5-contact')).toHaveTextContent('Nguyễn Văn A|0901234567')
    })

    // 4. Speak relative date + time -> populates real date & time window
    fireEvent.change(input, {
      target: { value: 'Bay sáng mai lúc 8 giờ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    await waitFor(() => {
      expect(screen.getByTestId('v5-schedule').textContent).toContain('|time-morning')
    })
  })
})

