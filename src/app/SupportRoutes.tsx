import { PageFrame } from '../shared/components/antd/PageFrame'
import { HelpCenterHomePage } from '../features/support/pages/HelpCenterHome'
import { CustomerTicketsListPage } from '../features/support/pages/CustomerTicketsList'
import { CustomerTicketDetailPage } from '../features/support/pages/CustomerTicketDetail'

/** Help centre and ticket screens share one standalone page frame (top bar + back link). */
export function SupportRoutes({
  screen,
  ticketId,
}: {
  screen: 'help' | 'tickets' | 'ticketDetail'
  ticketId?: string
}) {
  return (
    <PageFrame maxWidth={1100}>
      {screen === 'help' ? (
        <HelpCenterHomePage />
      ) : screen === 'tickets' ? (
        <CustomerTicketsListPage />
      ) : (
        <CustomerTicketDetailPage ticketId={ticketId ?? ''} />
      )}
    </PageFrame>
  )
}
