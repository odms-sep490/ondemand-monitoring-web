import { Tag } from 'antd'
import { StatusTag } from '../../../../../shared/components/antd'
import { Card } from '../../../../customer/components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import { fmtDateTime } from '../../../../customer/lib/orderStatus'
import { customerHref } from '../../../../customer/routes'
import type { SupportTicketDto } from '../../../api/supportApi'
import { TicketStatusBadge } from '../../../components/TicketStatusBadge'
import { ticketLabelsMessages } from '../../../lib/ticketLabels.messages'
import { customerTicketDetailMessages } from '../CustomerTicketDetailPage.messages'

export function TicketOverview({ ticket }: { ticket: SupportTicketDto }) {
  const { t, locale } = useI18n(customerTicketDetailMessages)
  const { t: labels } = useI18n(ticketLabelsMessages)
  const category =
    labels.category[ticket.category as keyof typeof labels.category] ??
    ticket.category
  const priorityLabel = labels.priority[ticket.priority] ?? ticket.priority
  const urgent = ticket.priority === 'URGENT' || ticket.priority === 'HIGH'

  return (
    <Card>
      <div className="td-head">
        <div>
          <div className="td-badges">
            <TicketStatusBadge status={ticket.status} />
            <Tag>{category}</Tag>
            <StatusTag tone={urgent ? 'danger' : 'neutral'}>
              {t.priority(priorityLabel)}
            </StatusTag>
          </div>
          <h2 className="td-subject">{ticket.subject}</h2>
        </div>
        <div className="sp-muted">
          {t.openedAt(fmtDateTime(ticket.openedAt, locale))}
        </div>
      </div>

      {(ticket.orderId || ticket.missionId) && (
        <div className="td-context">
          {ticket.orderId && (
            <div>
              {t.relatedOrder}:{' '}
              <a
                href={customerHref({
                  screen: 'orderDetail',
                  orderId: ticket.orderId,
                })}
              >
                {t.viewOrder}
              </a>
            </div>
          )}
          {ticket.missionId && (
            <div>
              {t.relatedMission}:{' '}
              <a
                href={customerHref({
                  screen: 'live',
                  orderId: ticket.orderId || ticket.missionId,
                })}
              >
                {t.viewMission}
              </a>
            </div>
          )}
          {ticket.assignedStaffName && (
            <div>
              {t.assignedStaff}: <strong>{ticket.assignedStaffName}</strong>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
