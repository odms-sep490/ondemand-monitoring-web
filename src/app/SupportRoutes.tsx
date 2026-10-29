import {
  CustomerLayout,
  type CustomerNavItemKey,
} from '../features/customer/CustomerLayout'
import { customerLayoutMessages } from '../features/customer/CustomerLayout.messages'
import { authSession } from '../features/auth/api/authApi'
import { HelpCenterHomePage } from '../features/support/pages/HelpCenterHome'
import { CustomerTicketsListPage } from '../features/support/pages/CustomerTicketsList'
import { CustomerTicketDetailPage } from '../features/support/pages/CustomerTicketDetail'
import { PageFrame } from '../shared/components/antd/PageFrame'
import { useI18n } from '../shared/i18n'

/**
 * Help centre and ticket screens. Customers keep their portal shell (so the
 * navigation highlights Help / Support); every other role gets the shared
 * standalone page frame (top bar with logo, back link, VI | EN and dark toggle).
 */
export function SupportRoutes({
  screen,
  ticketId,
}: {
  screen: 'help' | 'tickets' | 'ticketDetail'
  ticketId?: string
}) {
  const { t } = useI18n(customerLayoutMessages)
  const body =
    screen === 'help' ? (
      <HelpCenterHomePage />
    ) : screen === 'tickets' ? (
      <CustomerTicketsListPage />
    ) : (
      <CustomerTicketDetailPage ticketId={ticketId ?? ''} />
    )
  if (authSession.getUser()?.role !== 'CUSTOMER')
    return <PageFrame maxWidth={1100}>{body}</PageFrame>
  const activeNavItem: CustomerNavItemKey =
    screen === 'help' ? 'help' : 'support'
  return (
    <CustomerLayout
      route={{ screen: 'dashboard' }}
      breadcrumb={t.supportCrumbs[screen]}
      activeNavItem={activeNavItem}
    >
      {body}
    </CustomerLayout>
  )
}
