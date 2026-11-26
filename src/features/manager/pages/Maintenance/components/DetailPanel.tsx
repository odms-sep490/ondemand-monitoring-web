import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Button, Drawer } from 'antd'
import type { ReactNode } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { formatIssueType, formatTicketDescription, formatTicketTitle } from '../../../lib/ticketText'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { mgrPopupContainer } from '../../../components/common/mgrPopupContainer'
import { formatStamp } from '../maintenanceHelpers'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { maintenanceWorkflowMessages } from '../../../../maintenance-workflow/messages'
import { TicketSeverityTag, TicketStatusTag } from './TicketTags'

export type DetailPanelProps = {
  ticket: MaintenanceTicket
  onClose: () => void
  onAssignClick: (ticket: MaintenanceTicket) => void
  onOpenWorkflow?: (ticket: MaintenanceTicket) => void
}

function CloseIcon({ label }: { label: string }) {
  return <CloseOutlined aria-label={label} />
}

/** Ticket facts shared by the hover preview (`preview`) and the full drawer body. */
export function TicketDetailContent({
  ticket,
  preview = false,
  actions,
}: {
  ticket: MaintenanceTicket
  preview?: boolean
  actions?: ReactNode
}) {
  const { t, locale } = useI18n(maintenancePageMessages)
  // The API reuses the long description as the title; lead with the issue type instead of repeating it.
  const heading =
    ticket.issueType && ticket.title === ticket.description
      ? formatIssueType(ticket.issueType)
      : formatTicketTitle(ticket.title)
  return (
    <div className="mgr-ticket-panel">
      <h2 className="mgr-ticket-heading">{heading}</h2>

      <div className="mgr-ticket-tags">
        <TicketStatusTag status={ticket.status} />
        <TicketSeverityTag severity={ticket.priority} />
      </div>

      <section className="mgr-ticket-section">
      {!preview && <h3 className="mgr-ticket-section-title">{t.detail.overview}</h3>}
      <dl className="mgr-ticket-facts">
        <dt className="mgr-ticket-key">{t.detail.device}</dt>
        <dd>
          <b>{ticket.droneCode}</b>
        </dd>
        {ticket.issueType && (
          <>
            <dt className="mgr-ticket-key">{t.detail.issueType}</dt>
            <dd>{formatIssueType(ticket.issueType)}</dd>
          </>
        )}
        {ticket.reportedBy && (
          <>
            <dt className="mgr-ticket-key">{t.detail.reportedBy}</dt>
            <dd>{ticket.reportedBy}</dd>
          </>
        )}
        <dt className="mgr-ticket-key">{t.detail.assignedOperator}</dt>
        <dd>
          {ticket.assignedTo ? (
            <b className="mgr-ticket-ok">{ticket.assignedTo}</b>
          ) : (
            <b className="mgr-ticket-warn">{t.detail.unassigned}</b>
          )}
        </dd>
      </dl>
      </section>

      {ticket.description && (
        <section className="mgr-ticket-section">
          <h3 className="mgr-ticket-section-title">{t.detail.description}</h3>
          <div className="mgr-ticket-text">{formatTicketDescription(ticket.description)}</div>
        </section>
      )}

      {!preview && ticket.resolutionNotes && (
        <section className="mgr-ticket-resolution">
          <h3 className="mgr-ticket-resolution-title">{t.detail.resolutionReport}</h3>
          <span className="mgr-ticket-resolution-text">{ticket.resolutionNotes}</span>
        </section>
      )}

      {!preview && actions}

      <section className="mgr-ticket-history">
        {!preview && <h3 className="mgr-ticket-section-title">{t.detail.history}</h3>}
        <div className="mgr-ticket-history-row">
          <span className="mgr-ticket-key">{t.detail.createdAt}</span>
          <span>{formatStamp(ticket.openedAt, locale)}</span>
        </div>
        {!preview && ticket.resolvedAt && (
          <div className="mgr-ticket-history-row">
            <span className="mgr-ticket-key">{t.detail.resolvedAt}</span>
            <span>{formatStamp(ticket.resolvedAt, locale)}</span>
          </div>
        )}
      </section>
    </div>
  )
}

function PanelBody({
  ticket,
  onAssignClick,
  onOpenWorkflow,
}: Pick<DetailPanelProps, 'ticket' | 'onAssignClick' | 'onOpenWorkflow'>) {
  const { t } = useI18n(maintenancePageMessages)
  const { t: wf } = useI18n(maintenanceWorkflowMessages)
  const open = ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'
  return (
    <TicketDetailContent
      ticket={ticket}
      actions={
        <>
          {onOpenWorkflow && (
            <Button
              type="primary"
              size="large"
              block
              style={{ marginBottom: 8 }}
              onClick={() => onOpenWorkflow(ticket)}
            >
              {wf.queues.openWorkflow}
            </Button>
          )}
          {open && (
            <Button size="large" block onClick={() => onAssignClick(ticket)}>
              {ticket.assignedTo ? t.detail.changeOperator : t.detail.assignOperator}
            </Button>
          )}
          {ticket.status === 'RESOLVED' && (
            <div className="mgr-ticket-done">
              <CheckOutlined aria-hidden="true" /> {t.detail.resolvedDone}
            </div>
          )}
        </>
      }
    />
  )
}

/** Ticket details in a drawer over the page. */
export function DetailPanel({
  ticket,
  onClose,
  onAssignClick,
  onOpenWorkflow,
}: DetailPanelProps) {
  const { t } = useI18n(maintenancePageMessages)
  const code = <span className="mgr-code mgr-ticket-panel-code">{ticket.code}</span>
  return (
    <Drawer
      open
      getContainer={mgrPopupContainer}
      placement="right"
      width="min(420px, 100vw)"
      onClose={onClose}
      className="mgr-ticket-drawer mgr-maint-drawer"
      aria-label={ticket.code}
      closeIcon={<CloseIcon label={t.detail.close} />}
      title={code}
    >
      <PanelBody
        ticket={ticket}
        onAssignClick={onAssignClick}
        onOpenWorkflow={onOpenWorkflow}
      />
    </Drawer>
  )
}
