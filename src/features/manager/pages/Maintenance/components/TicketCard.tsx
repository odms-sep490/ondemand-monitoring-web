import { CheckOutlined } from '@ant-design/icons'
import { Popover } from 'antd'
import { useState } from 'react'
import type { KeyboardEvent } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { getTicketSeverityLabel } from '../../../../../shared/lib/statusTone'
import { mgrPopupContainer } from '../../../components/common/mgrPopupContainer'
import { formatTicketTitle } from '../../../lib/ticketText'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { formatAge, handoverState } from '../maintenanceHelpers'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { TicketDetailContent } from './DetailPanel'
import { TicketSeverityTag } from './TicketTags'

export type TicketCardProps = {
  ticket: MaintenanceTicket
  onSelect: (ticket: MaintenanceTicket) => void
  selected: boolean
}

export function TicketCard({ ticket, onSelect, selected }: TicketCardProps) {
  const { t, lang } = useI18n(maintenancePageMessages)
  const [hoverOpen, setHoverOpen] = useState(false)
  const handover = handoverState(ticket)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      setHoverOpen(false)
      onSelect(ticket)
    }
  }

  const card = (
    <div
      className={`mgr-ticket-card mgr-ticket-card--${ticket.priority.toLowerCase()}${selected ? ' is-selected' : ''}`}
      tabIndex={0}
      aria-label={`${ticket.code} · ${getTicketSeverityLabel(ticket.priority, lang)}`}
      onClick={() => {
        setHoverOpen(false)
        onSelect(ticket)
      }}
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

      <div className="mgr-ticket-card-footer">
        <div className={`mgr-ticket-op ${handover === 'NEEDS_HANDOVER' ? 'is-warn' : 'is-ok'}`}>
          <span className="mgr-ticket-op-dot" aria-hidden="true" />
          {ticket.assignedTo && handover !== 'NEEDS_HANDOVER' && handover !== 'AWAITING_CLAIM' ? (
            <span>
              {t.card.operatorLabel}
              <b>{ticket.assignedTo}</b>
            </span>
          ) : (
            <span>{handover === 'AWAITING_CLAIM' ? t.card.awaitingClaim : t.card.unassigned}</span>
          )}
        </div>


        {ticket.status === 'RESOLVED' && (
          <div className="mgr-ticket-done">
            <CheckOutlined aria-hidden="true" /> {t.card.resolved}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Popover
      content={<TicketDetailContent ticket={ticket} preview />}
      trigger={['hover', 'focus']}
      placement="rightTop"
      mouseEnterDelay={0.3}
      mouseLeaveDelay={0.05}
      open={hoverOpen}
      onOpenChange={setHoverOpen}
      getPopupContainer={mgrPopupContainer}
      rootClassName="mgr-ticket-pop"
      destroyOnHidden
      arrow={false}
      autoAdjustOverflow
    >
      {card}
    </Popover>
  )
}
