import {
  CustomerLayout,
  type CustomerNavItemKey,
} from '../features/customer/CustomerLayout'
import { customerLayoutMessages } from '../features/customer/CustomerLayout.messages'
import { HelpCenterHomePage } from '../features/support/pages/HelpCenterHome'
import { CustomerTicketsListPage } from '../features/support/pages/CustomerTicketsList'
import { CustomerTicketDetailPage } from '../features/support/pages/CustomerTicketDetail'
import { useI18n } from '../shared/i18n'

export function SupportRoutes({
  screen,
  ticketId,
}: {
  screen: 'help' | 'tickets' | 'ticketDetail'
  ticketId?: string
}) {
  const { t } = useI18n(customerLayoutMessages)
  const crumb = screen
  const activeNavItem: CustomerNavItemKey =
    screen === 'help' ? 'help' : 'support'
  return (
    <CustomerLayout
      route={{ screen: 'dashboard' }}
      breadcrumb={t.supportCrumbs[crumb]}
      activeNavItem={activeNavItem}
    >
      {screen === 'help' ? (
        <HelpCenterHomePage />
      ) : screen === 'tickets' ? (
        <CustomerTicketsListPage />
      ) : (
        <CustomerTicketDetailPage ticketId={ticketId ?? ''} />
      )}
    </CustomerLayout>
  )
}
