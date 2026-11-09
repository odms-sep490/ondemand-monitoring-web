import { Button } from 'antd'
import { useState, type Dispatch, type SetStateAction } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import type { TicketStatus } from '../../../../../shared/types/domain'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { COLUMNS } from '../maintenanceHelpers'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { TicketCard } from './TicketCard'
import { TicketStatusTag } from './TicketTags'

type Props = {
  byColumn: Record<TicketStatus, MaintenanceTicket[]>
  selectedTicket: MaintenanceTicket | null
  setSelectedTicket: Dispatch<SetStateAction<MaintenanceTicket | null>>
  setAssignTicket: Dispatch<SetStateAction<MaintenanceTicket | null>>
}

const LANE_PREVIEW = 5

/** Status lanes side by side in one row; each lane scrolls on its own. */
export function TicketBoard({
  byColumn,
  selectedTicket,
  setSelectedTicket,
  setAssignTicket,
}: Props) {
  const { t } = useI18n(maintenancePageMessages)
  const [expanded, setExpanded] = useState<
    Partial<Record<TicketStatus, boolean>>
  >({})
  return (
    <div className="mgr-maint-board">
      {COLUMNS.map((col) => {
        const all = byColumn[col]
        const open = !!expanded[col]
        const shown = open ? all : all.slice(0, LANE_PREVIEW)
        const hidden = all.length - LANE_PREVIEW
        return (
          <section key={col} className="mgr-maint-col">
            <div className="mgr-maint-col-head">
              <TicketStatusTag status={col} />
              <span className="mgr-maint-col-count">
                {byColumn[col].length}
              </span>
            </div>
            <div className="mgr-maint-col-list">
              {byColumn[col].length === 0 && (
                <div className="mgr-maint-col-empty">{t.page.noTickets}</div>
              )}
              {shown.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  selected={selectedTicket?.id === ticket.id}
                  onSelect={setSelectedTicket}
                  onAssignClick={setAssignTicket}
                />
              ))}
              {hidden > 0 && (
                <Button
                  size="small"
                  type="link"
                  className="mgr-maint-more"
                  aria-expanded={open}
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [col]: !open }))
                  }
                >
                  {open ? t.page.showLess : t.page.showMore(hidden)}
                </Button>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
