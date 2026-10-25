import type { MaintenanceTicket } from '../../../types/maintenance'
import { useI18n } from '../../../../../shared/i18n'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import {
  formatTicketTitle,
  formatTicketDescription,
} from '../../../lib/ticketText'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import {
  ticketStatusTone,
  getTicketStatusLabel,
  ticketSeverityTone,
  getTicketSeverityLabel,
} from '../../../../../shared/lib/statusTone'

export type DetailPanelProps = {
  ticket: MaintenanceTicket
  onClose: () => void
  onAssignClick: (ticket: MaintenanceTicket) => void
}

export function DetailPanel({
  ticket,
  onClose,
  onAssignClick,
}: DetailPanelProps) {
  const { t, lang, locale } = useI18n(maintenancePageMessages)
  return (
    <div
      style={{
        width: 380,
        borderLeft: '1px solid #e2e8f0',
        padding: 20,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        flexShrink: 0,
        background: '#ffffff',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          className="odm-mono"
          style={{ fontWeight: 700, fontSize: 14, color: '#475569' }}
        >
          {ticket.code}
        </span>
        <button
          type="button"
          className="odm-btn"
          onClick={onClose}
          aria-label={t.detail.close}
          style={{ padding: '2px 8px', borderRadius: '50%' }}
        >
          ✕
        </button>
      </div>

      <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
        {formatTicketTitle(ticket.title)}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <StatusBadge tone={ticketStatusTone[ticket.status]}>
          {getTicketStatusLabel(ticket.status, lang)}
        </StatusBadge>
        <StatusBadge tone={ticketSeverityTone[ticket.priority]}>
          {getTicketSeverityLabel(ticket.priority, lang)}
        </StatusBadge>
      </div>

      <div
        style={{
          fontSize: 13.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div>
          <span style={{ color: '#64748b' }}>{t.detail.device}</span>
          <span>
            <b style={{ color: '#0f172a' }}>{ticket.droneCode}</b>
            {ticket.droneName ? ` (${ticket.droneName})` : ''}
          </span>
        </div>
        {ticket.issueType && (
          <div>
            <span style={{ color: '#64748b' }}>{t.detail.issueType}</span>
            <span style={{ fontWeight: 600 }}>{ticket.issueType}</span>
          </div>
        )}
        {ticket.description && (
          <div>
            <span
              style={{ color: '#64748b', display: 'block', marginBottom: 4 }}
            >
              {t.detail.description}
            </span>
            <div
              style={{
                background: '#f8fafc',
                padding: 12,
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                border: '1px solid #e2e8f0',
                color: '#334155',
                lineHeight: 1.5,
              }}
            >
              {formatTicketDescription(ticket.description)}
            </div>
          </div>
        )}
        {ticket.reportedBy && (
          <div>
            <span style={{ color: '#64748b' }}>{t.detail.reportedBy}</span>
            <span>{ticket.reportedBy}</span>
          </div>
        )}
        <div>
          <span style={{ color: '#64748b' }}>{t.detail.assignedOperator}</span>
          <span>
            {ticket.assignedTo ? (
              <b style={{ color: '#059669' }}>{ticket.assignedTo}</b>
            ) : (
              <b style={{ color: '#d97706' }}>{t.detail.unassigned}</b>
            )}
          </span>
        </div>
        {ticket.resolutionNotes && (
          <div
            style={{
              background: '#f0fdf4',
              padding: 14,
              borderRadius: 10,
              border: '1px solid #bbf7d0',
              marginTop: 4,
            }}
          >
            <span
              style={{
                color: '#166534',
                fontWeight: 700,
                display: 'block',
                marginBottom: 4,
              }}
            >
              {t.detail.resolutionReport}
            </span>
            <span
              style={{ color: '#15803d', whiteSpace: 'pre-wrap', fontSize: 13 }}
            >
              {ticket.resolutionNotes}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginTop: 8,
        }}
      >
        {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && (
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => onAssignClick(ticket)}
            style={{
              width: '100%',
              height: 42,
              fontWeight: 600,
              borderRadius: 10,
            }}
          >
            {ticket.assignedTo
              ? t.detail.changeOperator
              : t.detail.assignOperator}
          </button>
        )}

        {ticket.status === 'RESOLVED' && (
          <div
            style={{
              background: '#f0fdf4',
              padding: 12,
              borderRadius: 10,
              border: '1px solid #bbf7d0',
              textAlign: 'center',
              color: '#15803d',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {t.detail.resolvedDone}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div
        style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: 14,
          fontSize: 12.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          marginTop: 'auto',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 2, color: '#475569' }}>
          {t.detail.history}
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>{t.detail.createdAt}</span>
          <span>{new Date(ticket.openedAt).toLocaleString(locale)}</span>
        </div>
        {ticket.resolvedAt && (
          <div>
            <span style={{ color: '#94a3b8' }}>{t.detail.resolvedAt}</span>
            <span>{new Date(ticket.resolvedAt).toLocaleString(locale)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
