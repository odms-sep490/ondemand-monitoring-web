import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { supportApi, type SupportTicketDto } from '../../../api/supportApi'
import { CustomerTicketDetailPage } from '../CustomerTicketDetailPage'

vi.mock('../../../components/TicketResultReviewCard', () => ({
  TicketResultReviewCard: () => (
    <div data-testid="result-review">Checklist feedback</div>
  ),
}))

const TICKET: SupportTicketDto = {
  id: 'tk-1',
  ticketCode: 'TK-0001',
  customerId: 'u',
  customerName: 'C',
  orderId: 'ord-1',
  category: 'ORDERS',
  subject: 'Hỏi về lịch bay',
  priority: 'URGENT',
  status: 'OPEN',
  openedAt: '2026-09-20T08:00:00Z',
  messages: [
    {
      id: 'm1',
      ticketId: 'tk-1',
      senderId: 's',
      senderName: 'Hỗ trợ',
      senderRole: 'STAFF',
      content: 'Xin chào',
      createdAt: '2026-09-20T09:00:00Z',
    },
  ],
}

beforeEach(() => {
  vi.spyOn(supportApi, 'getTicketById').mockResolvedValue(TICKET)
})
afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})

describe('CustomerTicketDetailPage', () => {
  it('keeps only checklist feedback on result revision tickets', async () => {
    vi.mocked(supportApi.getTicketById).mockResolvedValue({
      ...TICKET,
      ticketKind: 'RESULT_REVISION',
    })
    render(<CustomerTicketDetailPage ticketId="tk-1" />)
    expect(await screen.findByTestId('result-review')).toBeInTheDocument()
    expect(screen.queryByText('Lịch sử trao đổi')).not.toBeInTheDocument()
    expect(screen.queryByText('Xin chào')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Phản hồi của bạn')).not.toBeInTheDocument()
    act(() => setLanguage('en'))
    expect(screen.queryByText('Conversation')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Your reply')).not.toBeInTheDocument()
  })

  it('renders the ticket with translated labels', async () => {
    render(<CustomerTicketDetailPage ticketId="tk-1" />)
    expect(await screen.findByText('Hỏi về lịch bay')).toBeInTheDocument()
    expect(screen.getByText('Mới mở')).toBeInTheDocument()
    expect(screen.getByText('Ưu tiên: Khẩn cấp')).toBeInTheDocument()
    expect(screen.getByText(/Hỗ trợ \(Nhân viên hỗ trợ\)/)).toBeInTheDocument()
    act(() => setLanguage('en'))
    expect(screen.getByText('Priority: Urgent')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText(/\(Support agent\)/)).toBeInTheDocument()
  })

  it('sends a reply and reloads the ticket', async () => {
    const add = vi
      .spyOn(supportApi, 'addMessage')
      .mockResolvedValue(TICKET.messages![0])
    render(<CustomerTicketDetailPage ticketId="tk-1" />)
    fireEvent.change(await screen.findByLabelText('Phản hồi của bạn'), {
      target: { value: 'Cảm ơn' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi phản hồi' }))
    await waitFor(() =>
      expect(add).toHaveBeenCalledWith(
        'tk-1',
        expect.objectContaining({ content: 'Cảm ơn' }),
      ),
    )
    await waitFor(() =>
      expect(supportApi.getTicketById).toHaveBeenCalledTimes(2),
    )
  })

  it('shows the not-found state when the ticket is missing', async () => {
    vi.spyOn(supportApi, 'getTicketById').mockResolvedValue(
      undefined as unknown as SupportTicketDto,
    )
    render(<CustomerTicketDetailPage ticketId="nope" />)
    expect(
      await screen.findByText('Yêu cầu không tồn tại hoặc đã bị xóa.'),
    ).toBeInTheDocument()
  })

  it('hides the reply form on a resolved ticket', async () => {
    vi.spyOn(supportApi, 'getTicketById').mockResolvedValue({
      ...TICKET,
      status: 'RESOLVED',
    })
    render(<CustomerTicketDetailPage ticketId="tk-1" />)
    expect(await screen.findByText(/đã được đóng/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Phản hồi của bạn')).not.toBeInTheDocument()
  })
})
