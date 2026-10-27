import { CloseOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { formatIssueType, formatTicketDescription, formatTicketTitle } from '../../../lib/ticketText'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { TicketSeverityTag, TicketStatusTag } from './TicketTags'

export type DetailPanelProps = {
  ticket: MaintenanceTicket
  onClose: () => void
  onAssignClick: (ticket: MaintenanceTicket) => void
}

/** Ticket details docked beside the board, with the assign action and history below the facts. */
export function DetailPanel({ ticket, onClose, onAssignClick }: DetailPanelProps) {
  const { t, locale } = useI18n(maintenancePageMessages)
  const open = ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'
  // The API reuses the long description as the title; lead with the issue type instead of repeating it.
  const heading =
    ticket.issueType && ticket.title === ticket.description
      ? formatIssueType(ticket.issueType)
      : formatTicketTitle(ticket.title)
  return (
    <CardComponent className="mgr-ticket-panel" aria-label={ticket.code}>
      <div className="mgr-ticket-panel-top">
        <span className="mgr-code mgr-ticket-panel-code">{ticket.code}</span>
        <Button
          shape="circle"
          size="small"
          icon={<CloseOutlined />}
          onClick={onClose}
          aria-label={t.detail.close}
        />
      </div>

      <h2 className="mgr-ticket-heading">{heading}</h2>

      <div className="mgr-ticket-tags">
        <TicketStatusTag status={ticket.status} />
        <TicketSeverityTag severity={ticket.priority} />
      </div>

      <div className="mgr-ticket-body">
        <div>
          <span className="mgr-ticket-key">{t.detail.device}</span>
          <b>{ticket.droneCode}</b>
        </div>
        {ticket.issueType && (
          <div>
            <span className="mgr-ticket-key">{t.detail.issueType}</span>
            <b>{formatIssueType(ticket.issueType)}</b>
          </div>
        )}
        {ticket.description && (
          <div>
            <span className="mgr-ticket-key is-block">{t.detail.description}</span>
            <div className="mgr-ticket-text">{formatTicketDescription(ticket.description)}</div>
          </div>
        )}
        {ticket.reportedBy && (
          <div>
            <span className="mgr-ticket-key">{t.detail.reportedBy}</span>
            <span>{ticket.reportedBy}</span>
          </div>
        )}
        <div>
          <span className="mgr-ticket-key">{t.detail.assignedOperator}</span>
          {ticket.assignedTo ? (
            <b className="mgr-ticket-ok">{ticket.assignedTo}</b>
          ) : (
            <b className="mgr-ticket-warn">{t.detail.unassigned}</b>
          )}
        </div>
        {ticket.resolutionNotes && (
          <div className="mgr-ticket-resolution">
            <span className="mgr-ticket-resolution-title">{t.detail.resolutionReport}</span>
            <span className="mgr-ticket-resolution-text">{ticket.resolutionNotes}</span>
          </div>
        )}
      </div>

      {open && (
        <Button type="primary" size="large" block onClick={() => onAssignClick(ticket)}>
          {ticket.assignedTo ? t.detail.changeOperator : t.detail.assignOperator}
        </Button>
      )}
      {ticket.status === 'RESOLVED' && <div className="mgr-ticket-done">{t.detail.resolvedDone}</div>}

      <div className="mgr-ticket-history">
        <div className="mgr-ticket-history-title">{t.detail.history}</div>
        <div>
          <span className="mgr-ticket-key">{t.detail.createdAt}</span>
          <span>{new Date(ticket.openedAt).toLocaleString(locale)}</span>
        </div>
        {ticket.resolvedAt && (
          <div>
            <span className="mgr-ticket-key">{t.detail.resolvedAt}</span>
            <span>{new Date(ticket.resolvedAt).toLocaleString(locale)}</span>
          </div>
        )}
      </div>
    </CardComponent>
  )
}
