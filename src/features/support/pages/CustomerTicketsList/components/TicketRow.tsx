import { Tag } from 'antd'
import { useI18n } from '../../../../../shared/i18n'
import { customerHref } from '../../../../customer/routes'
import { fmtDate } from '../../../../customer/lib/orderStatus'
import type { SupportTicketDto } from '../../../api/supportApi'
import { TicketStatusBadge } from '../../../components/TicketStatusBadge'
import { ticketLabelsMessages } from '../../../lib/ticketLabels.messages'
import { customerTicketsListMessages } from '../CustomerTicketsListPage.messages'

export function TicketRow({ ticket }: { ticket: SupportTicketDto }) {
  const { t, locale } = useI18n(customerTicketsListMessages)
  const { t: labels } = useI18n(ticketLabelsMessages)
  const category =
    labels.category[ticket.category as keyof typeof labels.category] ??
    ticket.category

  return (
    <li className="tl-row">
      <div className="tl-main">
        <div className="tl-head">
          <span className="sp-mono">{ticket.ticketCode}</span>
          <TicketStatusBadge status={ticket.status} />
          <Tag>{category}</Tag>
        </div>
        <a className="tl-subject" href={`#help/tickets/${ticket.id}`}>
          {ticket.subject}
        </a>
        {(ticket.orderId || ticket.missionId) && (
          <div className="tl-links">
            {ticket.orderId && (
              <a
                className="sp-link-chip"
                href={customerHref({
                  screen: 'orderDetail',
                  orderId: ticket.orderId,
                })}
                title={t.viewOrderTitle}
              >
                {t.viewOrder}
              </a>
            )}
            {ticket.missionId && (
              <a
                className="sp-link-chip is-green"
                href={customerHref({
                  screen: 'live',
                  orderId: ticket.orderId || ticket.missionId,
                })}
                title={t.viewMissionTitle}
              >
                {t.viewMission}
              </a>
            )}
          </div>
        )}
      </div>
      <div className="tl-side">
        <div>{t.createdAt(fmtDate(ticket.openedAt, locale))}</div>
        <a className="tl-view" href={`#help/tickets/${ticket.id}`}>
          {t.viewDetails}
        </a>
      </div>
    </li>
  )
}
