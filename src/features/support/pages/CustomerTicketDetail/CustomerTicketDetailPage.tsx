import { Button } from 'antd'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../customer/components/common/StateView'
import { PageHeader } from '../../../customer/components/common/ui'
import { useI18n } from '../../../../shared/i18n'
import { isResultRevisionTicket } from '../../lib/resultReviewPresentation'
import '../../support.css'
import { CustomerTicketConversation } from './components/CustomerTicketConversation'
import { TicketOverview } from './components/TicketOverview'
import './CustomerTicketDetail.css'
import { customerTicketDetailMessages } from './CustomerTicketDetailPage.messages'
import { useTicketDetail } from './hooks/useTicketDetail'
import { TicketResultReviewCard } from '../../components/TicketResultReviewCard'

export function CustomerTicketDetailPage({ ticketId }: { ticketId: string }) {
  const { t } = useI18n(customerTicketDetailMessages)
  const detail = useTicketDetail(ticketId)
  const { ticket } = detail

  if (detail.loading && !ticket) return <LoadingState />

  if (!ticket) {
    return detail.error ? (
      <ErrorState
        title={t.errorTitle}
        error={detail.error}
        onRetry={detail.reload}
      />
    ) : (
      <EmptyState
        title={t.notFoundTitle}
        action={<Button href="#help/tickets">{t.notFoundAction}</Button>}
      />
    )
  }

  return (
    <div className="sp-page">
      <PageHeader
        back={<a href="#help/tickets">{t.back}</a>}
        title={
          <>
            {t.ticketCode}: <span className="sp-mono">{ticket.ticketCode}</span>
          </>
        }
      />

      <TicketOverview ticket={ticket} />
      {isResultRevisionTicket(ticket) ? (
        <TicketResultReviewCard ticketId={ticket.id} />
      ) : (
        <CustomerTicketConversation
          key={ticket.id}
          ticket={ticket}
          onReplied={detail.reload}
        />
      )}
    </div>
  )
}
