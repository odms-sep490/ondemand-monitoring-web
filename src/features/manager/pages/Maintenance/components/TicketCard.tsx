import { Button } from 'antd'
import type { KeyboardEvent } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { getTicketSeverityLabel } from '../../../../../shared/lib/statusTone'
import { formatTicketTitle } from '../../../lib/ticketText'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { formatAge } from '../maintenanceHelpers'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { TicketSeverityTag } from './TicketTags'

export type TicketCardProps = {
  ticket: MaintenanceTicket
  onSelect: (ticket: MaintenanceTicket) => void
  onAssignClick: (ticket: MaintenanceTicket) => void
  selected: boolean
}

export function TicketCard({ ticket, onSelect, onAssignClick, selected }: TicketCardProps) {
  const { t, lang } = useI18n(maintenancePageMessages)
  const open = ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onSelect(ticket)
    }
  }

  return (
    <div
      className={`mgr-ticket-card is-${ticket.priority.toLowerCase()}${selected ? ' is-selected' : ''}`}
      tabIndex={0}
      aria-label={`${ticket.code} · ${getTicketSeverityLabel(ticket.priority, lang)}`}
      onClick={() => onSelect(ticket)}
      onKeyDown={handleKeyDown}
    >
      <div className="mgr-ticket-card-top">
        <span className="mgr-code mgr-ticket-card-code">{ticket.code}</span>
        <span className="mgr-ticket-card-age">{formatAge(ticket.openedAt, t.age)}</span>
      </div>

      <div className="mgr-ticket-card-title">{formatTicketTitle(ticket.title)}</div>

      <div className="mgr-ticket-card-tags">
        <TicketSeverityTag severity={ticket.priority} />
        <span className="mgr-ticket-drone">{ticket.droneCode}</span>
      </div>

      <div className={`mgr-ticket-op ${ticket.assignedTo ? 'is-ok' : 'is-warn'}`}>
        <span className="mgr-ticket-op-dot" aria-hidden="true" />
        {ticket.assignedTo ? (
          <span>
            {t.card.operatorLabel}
            <b>{ticket.assignedTo}</b>
          </span>
        ) : (
          <span>{t.card.unassigned}</span>
        )}
      </div>

      {open && (
        <Button
          size="small"
          className="mgr-ticket-card-action"
          onClick={(event) => {
            event.stopPropagation()
            onAssignClick(ticket)
          }}
        >
          {ticket.assignedTo ? t.card.changeOperator : t.card.assignOperator}
        </Button>
      )}

      {ticket.status === 'RESOLVED' && <div className="mgr-ticket-done">{t.card.resolved}</div>}
    </div>
  )
}
