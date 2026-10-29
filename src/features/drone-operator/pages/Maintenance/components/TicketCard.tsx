import { Button } from 'antd'
import type { Dispatch, SetStateAction } from 'react'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { formatTicketTitle } from '../../../../manager/lib/ticketText'
import type { MaintenanceTicketDto } from '../../../api/maintenanceTicketApi'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { maintenanceDeviceLabel } from '../maintenanceHelpers'

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
  const high = ticket.severity === 'HIGH' || ticket.severity === 'CRITICAL'
  const done = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
  return (
    <CardComponent className="stf-ticket">
      <div className="stf-stack-sm">
        <div className="stf-row" style={{ justifyContent: 'space-between' }}>
          <span className="stf-mono" style={{ fontWeight: 700 }}>
            {ticket.ticketCode}
          </span>
          <StatusTag tone={high ? 'danger' : 'warning'}>
            {ticket.severity || 'MEDIUM'}
          </StatusTag>
        </div>

        <h3 className="stf-ticket-title">
          {formatTicketTitle(
            ticket.description || ticket.issueType || t.defaultIssue,
          )}
        </h3>

        <div className="stf-stack-sm" style={{ fontSize: 13 }}>
          <div>
            <span className="stf-muted">{t.droneLabel}</span>{' '}
            <b>{maintenanceDeviceLabel(ticket)}</b>
          </div>
          <div>
            <span className="stf-muted">{t.technicianLabel}</span>{' '}
            <b>{ticket.assignedTechnicianName || t.unassigned}</b>
          </div>
          {ticket.resolutionNotes && (
            <div className="stf-metric">
              <b>{t.reportLabel}</b> {ticket.resolutionNotes}
            </div>
          )}
        </div>

        <div className="stf-row stf-ticket-foot">
          <span className="stf-muted" style={{ fontSize: 12 }}>
            {ticket.openedAt
              ? new Date(ticket.openedAt).toLocaleDateString(locale)
              : ''}
          </span>
          <span className="stf-spacer" />
          {done ? (
            <StatusTag tone="success">{t.resolved}</StatusTag>
          ) : (
            <Button
              type="primary"
              onClick={() => {
                setSelectedTicket(ticket)
                setError(null)
              }}
            >
              {t.updateAndRestore}
            </Button>
          )}
        </div>
      </div>
    </CardComponent>
  )
}
