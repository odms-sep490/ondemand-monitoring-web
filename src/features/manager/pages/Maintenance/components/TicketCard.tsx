import type { MaintenanceTicket } from '../../../types/maintenance'
import { useI18n } from '../../../../../shared/i18n'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import type { TicketSeverity } from '../../../../../shared/types/domain'
import { formatAge } from '../maintenanceHelpers'
import { formatTicketTitle } from '../../../lib/ticketText'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import {
  ticketSeverityTone,
  getTicketSeverityLabel,
} from '../../../../../shared/lib/statusTone'

export type TicketCardProps = {
  ticket: MaintenanceTicket
  onSelect: (ticket: MaintenanceTicket) => void
  onAssignClick: (ticket: MaintenanceTicket) => void
  selected: boolean
}

export function TicketCard({
  ticket,
  onSelect,
  onAssignClick,
  selected,
}: TicketCardProps) {
  const { t, lang } = useI18n(maintenancePageMessages)
  const priorityBorderColor: Record<TicketSeverity, string> = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#94a3b8',
  }

  return (
    <div
      className="odm-card"
      style={{
        padding: 16,
        borderRadius: 12,
        cursor: 'pointer',
        borderLeft: `4px solid ${priorityBorderColor[ticket.priority]}`,
        background: selected ? '#f8fafc' : '#ffffff',
        boxShadow: selected
          ? '0 0 0 2px #2563eb'
          : '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'all 0.15s ease',
      }}
      onClick={() => onSelect(ticket)}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          className="odm-mono"
          style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}
        >
          {ticket.code}
        </span>
        <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
          {formatAge(ticket.openedAt, t.age)}
        </span>
      </div>

      <div
        style={{
          fontWeight: 700,
          fontSize: 14,
          lineHeight: 1.35,
          color: '#0f172a',
          overflowWrap: 'anywhere',
        }}
      >
        {formatTicketTitle(ticket.title)}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <StatusBadge tone={ticketSeverityTone[ticket.priority]}>
          {getTicketSeverityLabel(ticket.priority, lang)}
        </StatusBadge>
        <span
          style={{
            fontSize: 12,
            padding: '2px 8px',
            borderRadius: 6,
            background: '#f1f5f9',
            color: '#475569',
            fontWeight: 600,
          }}
        >
          {ticket.droneCode}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 2,
          fontSize: 12,
        }}
      >
        {ticket.assignedTo ? (
          <div
            style={{
              color: '#059669',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block',
              }}
            />
            <span>
              {t.card.operatorLabel}
              <b>{ticket.assignedTo}</b>
            </span>
          </div>
        ) : (
          <div
            style={{
              color: '#d97706',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#f59e0b',
                display: 'inline-block',
              }}
            />
            <span>{t.card.unassigned}</span>
          </div>
        )}
      </div>

      {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && (
        <button
          type="button"
          className="odm-btn odm-btn-p"
          style={{
            fontSize: 12.5,
            marginTop: 4,
            fontWeight: 600,
            padding: '7px 12px',
            borderRadius: 8,
          }}
          onClick={(e) => {
            e.stopPropagation()
            onAssignClick(ticket)
          }}
        >
          {ticket.assignedTo ? t.card.changeOperator : t.card.assignOperator}
        </button>
      )}

      {ticket.status === 'RESOLVED' && (
        <div
          style={{
            fontSize: 12,
            color: '#059669',
            fontWeight: 600,
            background: '#f0fdf4',
            padding: '5px 10px',
            borderRadius: 6,
            textAlign: 'center',
            marginTop: 2,
          }}
        >
          {t.card.resolved}
        </div>
      )}
    </div>
  )
}
