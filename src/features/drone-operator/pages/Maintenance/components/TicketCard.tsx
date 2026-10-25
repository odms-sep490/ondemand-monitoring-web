import { formatTicketTitle } from '../../../../manager/lib/ticketText'
import { maintenanceDeviceLabel } from '../maintenanceHelpers'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { MaintenanceTicketDto } from '../../../api/maintenanceTicketApi'
import type { Dispatch, SetStateAction } from 'react'

export function TicketCard({
  ticket,
  setSelectedTicket,
  setError,
}: {
  ticket: MaintenanceTicketDto
  setSelectedTicket: Dispatch<SetStateAction<MaintenanceTicketDto | null>>
  setError: Dispatch<SetStateAction<string | null>>
}) {
  const { t, locale } = useI18n(maintenancePageMessages)
  return (
    <div
      className="odm-card"
      style={{
        padding: 18,
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 12,
        background: '#ffffff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <span
            className="odm-mono"
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: '#f1f5f9',
              color: '#334155',
            }}
          >
            {ticket.ticketCode}
          </span>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 6,
              background:
                ticket.severity === 'HIGH' || ticket.severity === 'CRITICAL'
                  ? '#fef2f2'
                  : '#fefce8',
              color:
                ticket.severity === 'HIGH' || ticket.severity === 'CRITICAL'
                  ? '#ef4444'
                  : '#b45309',
              border: `1px solid ${ticket.severity === 'HIGH' || ticket.severity === 'CRITICAL' ? '#fecaca' : '#fef08a'}`,
            }}
          >
            {ticket.severity || 'MEDIUM'}
          </span>
        </div>

        <h3
          style={{
            margin: '0 0 8px',
            fontSize: 15,
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          {formatTicketTitle(
            ticket.description || ticket.issueType || t.defaultIssue,
          )}
        </h3>

        <div
          style={{
            fontSize: 13,
            color: '#475569',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div>
            {t.droneLabel} <b>{maintenanceDeviceLabel(ticket)}</b>
          </div>
          <div>
            {t.technicianLabel}{' '}
            <b>{ticket.assignedTechnicianName || t.unassigned}</b>
          </div>
          {ticket.resolutionNotes && (
            <div
              style={{
                background: '#f8fafc',
                padding: '8px 10px',
                borderRadius: 8,
                marginTop: 4,
                fontSize: 12.5,
                border: '1px solid #e2e8f0',
              }}
            >
              <b style={{ color: '#334155' }}>{t.reportLabel}</b>{' '}
              {ticket.resolutionNotes}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #f1f5f9',
          paddingTop: 12,
        }}
      >
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          {ticket.openedAt
            ? new Date(ticket.openedAt).toLocaleDateString(locale)
            : ''}
        </span>

        {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? (
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: '#059669',
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
            {t.resolved}
          </span>
        ) : (
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => {
              setSelectedTicket(ticket)
              setError(null)
            }}
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: 8,
            }}
          >
            {t.updateAndRestore}
          </button>
        )}
      </div>
    </div>
  )
}
