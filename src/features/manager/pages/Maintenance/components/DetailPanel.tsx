import { CloseOutlined } from '@ant-design/icons'
import { Button, Drawer } from 'antd'
import type { ReactNode } from 'react'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { mgrPopupContainer } from '../../../components/common/mgrPopupContainer'
import { formatTicketDescription, formatTicketTitle } from '../../../lib/ticketText'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { TicketSeverityTag, TicketStatusTag } from './TicketTags'

export type DetailPanelProps = {
  ticket: MaintenanceTicket
  onClose: () => void
  onAssignClick: (ticket: MaintenanceTicket) => void
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mgr-ticket-fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/** Ticket details in a right-hand drawer, with the assign action in the footer. */
export function DetailPanel({ ticket, onClose, onAssignClick }: DetailPanelProps) {
  const { t, locale } = useI18n(maintenancePageMessages)
  const open = ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'
  return (
    <Drawer
      open
      getContainer={mgrPopupContainer}
      width={440}
      onClose={onClose}
      closeIcon={<CloseOutlined aria-label={t.detail.close} />}
      title={<span className="mgr-code">{ticket.code}</span>}
      className="mgr-ticket-drawer"
      footer={
        open ? (
          <Button type="primary" block onClick={() => onAssignClick(ticket)}>
            {ticket.assignedTo ? t.detail.changeOperator : t.detail.assignOperator}
          </Button>
        ) : ticket.status === 'RESOLVED' ? (
          <div className="mgr-ticket-done">{t.detail.resolvedDone}</div>
        ) : null
      }
    >
      <div className="mgr-ticket-stack">
        <div>
          <h2 className="mgr-ticket-heading">{formatTicketTitle(ticket.title)}</h2>
          <div className="mgr-ticket-tags">
            <TicketStatusTag status={ticket.status} />
            <TicketSeverityTag severity={ticket.priority} />
          </div>
        </div>

        <CardComponent size="small">
          <dl className="mgr-ticket-facts">
            <Fact label={t.detail.device}>
              <b>{ticket.droneCode}</b>
            </Fact>
            {ticket.issueType ? <Fact label={t.detail.issueType}>{ticket.issueType}</Fact> : null}
            {ticket.reportedBy ? <Fact label={t.detail.reportedBy}>{ticket.reportedBy}</Fact> : null}
            <Fact label={t.detail.assignedOperator}>
              {ticket.assignedTo ? (
                <b className="mgr-ticket-ok">{ticket.assignedTo}</b>
              ) : (
                <b className="mgr-ticket-warn">{t.detail.unassigned}</b>
              )}
            </Fact>
          </dl>
        </CardComponent>

        {ticket.description ? (
          <CardComponent size="small" title={t.detail.description.replace(/:$/, '')}>
            <div className="mgr-ticket-text">{formatTicketDescription(ticket.description)}</div>
          </CardComponent>
        ) : null}

        {ticket.resolutionNotes ? (
          <CardComponent size="small" title={t.detail.resolutionReport.replace(/:$/, '')}>
            <div className="mgr-ticket-text">{ticket.resolutionNotes}</div>
          </CardComponent>
        ) : null}

        <CardComponent size="small" title={t.detail.history}>
          <dl className="mgr-ticket-facts">
            <Fact label={t.detail.createdAt}>{new Date(ticket.openedAt).toLocaleString(locale)}</Fact>
            {ticket.resolvedAt ? (
              <Fact label={t.detail.resolvedAt}>{new Date(ticket.resolvedAt).toLocaleString(locale)}</Fact>
            ) : null}
          </dl>
        </CardComponent>
      </div>
    </Drawer>
  )
}
