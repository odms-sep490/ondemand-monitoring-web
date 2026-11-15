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
        border: '1px solid var(--mgr-border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 12,
        background: 'var(--mgr-card)',
        boxShadow: 'var(--mgr-shadow)',
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
              background: 'var(--mgr-card-2)',
              color: 'var(--tx2)',
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
                  ? 'var(--ui-danger-soft)'
                  : 'var(--ui-warning-soft)',
              color:
                ticket.severity === 'HIGH' || ticket.severity === 'CRITICAL'
                  ? 'var(--ui-danger-text)'
                  : 'var(--ui-warning-text)',
              border: `1px solid ${ticket.severity === 'HIGH' || ticket.severity === 'CRITICAL' ? 'var(--ui-danger)' : 'var(--ui-warning)'}`,
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
            color: 'var(--mgr-text)',
          }}
        >
          {formatTicketTitle(
            ticket.description || ticket.issueType || t.defaultIssue,
          )}
        </h3>

        <div
          style={{
            fontSize: 13,
            color: 'var(--mgr-muted)',
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
                background: 'var(--mgr-card-2)',
                padding: '8px 10px',
                borderRadius: 8,
                marginTop: 4,
                fontSize: 12.5,
                border: '1px solid var(--mgr-border)',
              }}
            >
              <b style={{ color: 'var(--tx2)' }}>{t.reportLabel}</b>{' '}
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
          borderTop: '1px solid var(--mgr-border)',
          paddingTop: 12,
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--mgr-muted)' }}>
          {ticket.openedAt
            ? new Date(ticket.openedAt).toLocaleDateString(locale)
            : ''}
        </span>

        {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? (
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--ui-success-text)',
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
                background: 'var(--ui-success)',
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
