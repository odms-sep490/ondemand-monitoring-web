import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Button, Drawer } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { formatIssueType, formatTicketDescription, formatTicketTitle } from '../../../lib/ticketText'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { mgrPopupContainer } from '../../../components/common/mgrPopupContainer'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { TicketSeverityTag, TicketStatusTag } from './TicketTags'

export type DetailPanelProps = {
  ticket: MaintenanceTicket
  onClose: () => void
  onAssignClick: (ticket: MaintenanceTicket) => void
  /** true: sticky panel beside the board; false: drawer over the page. */
  docked: boolean
}

function CloseIcon({ label }: { label: string }) {
  return <CloseOutlined aria-label={label} />
}

function PanelBody({ ticket, onAssignClick }: Pick<DetailPanelProps, 'ticket' | 'onAssignClick'>) {
  const { t, locale } = useI18n(maintenancePageMessages)
  const open = ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'
  // The API reuses the long description as the title; lead with the issue type instead of repeating it.
  const heading =
    ticket.issueType && ticket.title === ticket.description
      ? formatIssueType(ticket.issueType)
      : formatTicketTitle(ticket.title)
  return (
    <div className="mgr-ticket-panel">
      <h2 className="mgr-ticket-heading">{heading}</h2>

      <div className="mgr-ticket-tags">
        <TicketStatusTag status={ticket.status} />
        <TicketSeverityTag severity={ticket.priority} />
      </div>

      <dl className="mgr-ticket-facts">
        <dt className="mgr-ticket-key">{t.detail.device}</dt>
        <dd>
          <b>{ticket.droneCode}</b>
        </dd>
        {ticket.issueType && (
          <>
            <dt className="mgr-ticket-key">{t.detail.issueType}</dt>
            <dd>{formatIssueType(ticket.issueType)}</dd>
          </>
        )}
        {ticket.reportedBy && (
          <>
            <dt className="mgr-ticket-key">{t.detail.reportedBy}</dt>
            <dd>{ticket.reportedBy}</dd>
          </>
        )}
        <dt className="mgr-ticket-key">{t.detail.assignedOperator}</dt>
        <dd>
          {ticket.assignedTo ? (
            <b className="mgr-ticket-ok">{ticket.assignedTo}</b>
          ) : (
            <b className="mgr-ticket-warn">{t.detail.unassigned}</b>
          )}
        </dd>
      </dl>

      {ticket.description && (
        <div>
          <div className="mgr-ticket-key is-block">{t.detail.description}</div>
          <div className="mgr-ticket-text">{formatTicketDescription(ticket.description)}</div>
        </div>
      )}

      {ticket.resolutionNotes && (
        <div className="mgr-ticket-resolution">
          <span className="mgr-ticket-resolution-title">{t.detail.resolutionReport}</span>
          <span className="mgr-ticket-resolution-text">{ticket.resolutionNotes}</span>
        </div>
      )}

      {open && (
        <Button type="primary" size="large" block onClick={() => onAssignClick(ticket)}>
          {ticket.assignedTo ? t.detail.changeOperator : t.detail.assignOperator}
        </Button>
      )}
      {ticket.status === 'RESOLVED' && (
        <div className="mgr-ticket-done">
          <CheckOutlined aria-hidden="true" /> {t.detail.resolvedDone}
        </div>
      )}

      <div className="mgr-ticket-history">
        <div className="mgr-ticket-history-title">{t.detail.history}</div>
        <div className="mgr-ticket-history-row">
          <span className="mgr-ticket-key">{t.detail.createdAt}</span>
          <span>{new Date(ticket.openedAt).toLocaleString(locale)}</span>
        </div>
        {ticket.resolvedAt && (
          <div className="mgr-ticket-history-row">
            <span className="mgr-ticket-key">{t.detail.resolvedAt}</span>
            <span>{new Date(ticket.resolvedAt).toLocaleString(locale)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/** Ticket details: docked beside the board on wide screens, a drawer below that. */
export function DetailPanel({ ticket, onClose, onAssignClick, docked }: DetailPanelProps) {
  const { t } = useI18n(maintenancePageMessages)
  const code = <span className="mgr-code mgr-ticket-panel-code">{ticket.code}</span>

  if (docked) {
    return (
      <aside className="mgr-maint-dock" aria-label={ticket.code}>
        <CardComponent className="mgr-maint-dock-card">
          <div className="mgr-maint-dock-head">
            {code}
            <Button type="text" size="small" onClick={onClose} aria-label={t.detail.close} icon={<CloseOutlined />} />
          </div>
          <PanelBody ticket={ticket} onAssignClick={onAssignClick} />
        </CardComponent>
      </aside>
    )
  }
  return (
    <Drawer
      open
      getContainer={mgrPopupContainer}
      placement="right"
      width="min(420px, 100vw)"
      onClose={onClose}
      className="mgr-ticket-drawer mgr-maint-drawer"
      aria-label={ticket.code}
      closeIcon={<CloseIcon label={t.detail.close} />}
      title={code}
    >
      <PanelBody ticket={ticket} onAssignClick={onAssignClick} />
    </Drawer>
  )
}
