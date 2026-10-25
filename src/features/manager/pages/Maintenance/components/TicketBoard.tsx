import { COLUMNS } from '../maintenanceHelpers'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import {
  ticketStatusTone,
  getTicketStatusLabel,
} from '../../../../../shared/lib/statusTone'
import { TicketCard } from './TicketCard'
import { DetailPanel } from './DetailPanel'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { TicketStatus } from '../../../../../shared/types/domain'
import type { MaintenanceTicket } from '../../../types/maintenance'
import type { Dispatch, SetStateAction } from 'react'

export function TicketBoard({
  byColumn,
  selectedTicket,
  setSelectedTicket,
  setAssignTicket,
}: {
  byColumn: Record<TicketStatus, MaintenanceTicket[]>
  selectedTicket: MaintenanceTicket | null
  setSelectedTicket: Dispatch<SetStateAction<MaintenanceTicket | null>>
  setAssignTicket: Dispatch<SetStateAction<MaintenanceTicket | null>>
}) {
  const { t, lang } = useI18n(maintenancePageMessages)
  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {/* Kanban board */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 14,
          overflowX: 'auto',
          padding: '4px 0',
        }}
      >
        {COLUMNS.map((col) => (
          <div
            key={col}
            style={{
              minWidth: 260,
              flex: '1 1 260px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              background: '#f8fafc',
              padding: 12,
              borderRadius: 14,
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <StatusBadge tone={ticketStatusTone[col]}>
                {getTicketStatusLabel(col, lang)}
              </StatusBadge>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#475569',
                  background: '#ffffff',
                  borderRadius: 10,
                  padding: '2px 8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                {byColumn[col].length}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {byColumn[col].length === 0 && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: '#94a3b8',
                    textAlign: 'center',
                    padding: '24px 12px',
                    background: '#ffffff',
                    borderRadius: 10,
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  {t.page.noTickets}
                </div>
              )}
              {byColumn[col].map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  selected={selectedTicket?.id === ticket.id}
                  onSelect={setSelectedTicket}
                  onAssignClick={(t) => setAssignTicket(t)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selectedTicket && (
        <DetailPanel
          key={selectedTicket.id}
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onAssignClick={(t) => setAssignTicket(t)}
        />
      )}
    </div>
  )
}
