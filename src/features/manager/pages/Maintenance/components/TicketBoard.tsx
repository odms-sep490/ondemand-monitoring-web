import type { Dispatch, SetStateAction } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import type { TicketStatus } from '../../../../../shared/types/domain'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { COLUMNS } from '../maintenanceHelpers'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { DetailPanel } from './DetailPanel'
import { TicketCard } from './TicketCard'
import { TicketStatusTag } from './TicketTags'

type Props = {
  byColumn: Record<TicketStatus, MaintenanceTicket[]>
  selectedTicket: MaintenanceTicket | null
  setSelectedTicket: Dispatch<SetStateAction<MaintenanceTicket | null>>
  setAssignTicket: Dispatch<SetStateAction<MaintenanceTicket | null>>
}

/** Kanban columns (one per status) with the detail panel docked on the right. */
export function TicketBoard({ byColumn, selectedTicket, setSelectedTicket, setAssignTicket }: Props) {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <div className="mgr-maint-body">
      <div className="mgr-maint-board">
        {COLUMNS.map((col) => (
          <section key={col} className="mgr-maint-col">
            <div className="mgr-maint-col-head">
              <TicketStatusTag status={col} />
              <span className="mgr-maint-col-count">{byColumn[col].length}</span>
            </div>
            <div className="mgr-maint-col-list">
              {byColumn[col].length === 0 && <div className="mgr-maint-col-empty">{t.page.noTickets}</div>}
              {byColumn[col].map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  selected={selectedTicket?.id === ticket.id}
                  onSelect={setSelectedTicket}
                  onAssignClick={setAssignTicket}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {selectedTicket && (
        <DetailPanel
          key={selectedTicket.id}
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onAssignClick={setAssignTicket}
        />
      )}
    </div>
  )
}
