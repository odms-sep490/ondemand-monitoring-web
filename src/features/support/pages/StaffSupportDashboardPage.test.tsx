import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { authSession } from '../../auth/api/authApi'
import { supportApi } from '../api/supportApi'
import { StaffSupportDashboardPage } from './StaffSupportDashboardPage'

vi.mock('../components/TicketResultReviewCard', () => ({
  TicketResultReviewCard: () => (
    <div data-testid="result-review">Checklist feedback</div>
  ),
}))

afterEach(() => vi.restoreAllMocks())

describe('staff support permissions', () => {
  it('loads assigned tickets without calling manager-only endpoints', async () => {
    vi.spyOn(authSession, 'getUser').mockReturnValue({
      id: 'u1',
      email: 'staff@example.com',
      fullName: 'Staff',
      role: 'STAFF',
    })
    const tickets = vi.spyOn(supportApi, 'listTickets').mockResolvedValue([])
    const agents = vi.spyOn(supportApi, 'getStaffAgents').mockResolvedValue([])
    const analytics = vi.spyOn(supportApi, 'getAnalytics')
    render(<StaffSupportDashboardPage />)
    await waitFor(() => expect(tickets).toHaveBeenCalled())
    expect(agents).not.toHaveBeenCalled()
    expect(analytics).not.toHaveBeenCalled()
  })

  it('opens the ticket selected by a manager deep link after loading the queue', async () => {
    vi.spyOn(authSession, 'getUser').mockReturnValue({
      id: 'manager-1',
      email: 'manager@example.com',
      fullName: 'Manager',
      role: 'MANAGER',
    })
    vi.spyOn(supportApi, 'listTickets').mockResolvedValue([
      {
        id: 'ticket-1',
        ticketCode: 'TKT-1',
        ticketKind: 'RESULT_REVISION',
        customerId: 'customer-1',
        customerName: 'Customer',
        orderId: 'order-1',
        category: 'RESULTS',
        subject: 'Result review',
        priority: 'NORMAL',
        status: 'OPEN',
        openedAt: '2026-11-02T09:00:00Z',
        messages: [],
      },
    ])
    vi.spyOn(supportApi, 'getStaffAgents').mockResolvedValue([])
    vi.spyOn(supportApi, 'getAnalytics').mockResolvedValue({
      totalHelpfulVotes: 0,
      totalTickets: 0,
      deflectionRate: 0,
      avgResponseTimeMins: 0,
      slaComplianceRate: 0,
      topHelpfulArticles: [],
      categoryBreakdown: {},
    })

    render(<StaffSupportDashboardPage initialTicketId="ticket-1" />)

    expect(await screen.findByTestId('result-review')).toBeInTheDocument()
    expect(screen.queryByText('Lịch sử hội thoại')).not.toBeInTheDocument()
    expect(
      within(screen.getByRole('dialog')).queryByRole('textbox'),
    ).not.toBeInTheDocument()
  })

  it('shows a ticket API failure instead of disguising it as an empty queue', async () => {
    vi.spyOn(authSession, 'getUser').mockReturnValue({
      id: 'u1',
      email: 'staff@example.com',
      fullName: 'Staff',
      role: 'STAFF',
    })
    vi.spyOn(supportApi, 'listTickets').mockRejectedValue(
      new Error('Ticket access denied'),
    )
    render(<StaffSupportDashboardPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ticket access denied',
    )
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy()
  })
})
