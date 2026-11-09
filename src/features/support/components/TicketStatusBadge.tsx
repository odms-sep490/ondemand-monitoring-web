import { StatusTag } from '../../../shared/components/antd'
import { useI18n } from '../../../shared/i18n'
import { ticketLabelsMessages } from '../lib/ticketLabels.messages'
import { TICKET_STATUS_TONE, type TicketStatus } from '../lib/ticketStatus'

/** Ticket status shown with the shared badge; unknown BE values fall back to the raw code. */
export function TicketStatusBadge({ status }: { status: string }) {
  const { t } = useI18n(ticketLabelsMessages)
  const known = status in TICKET_STATUS_TONE
  return (
    <StatusTag tone={known ? TICKET_STATUS_TONE[status as TicketStatus] : 'neutral'}>
      {known ? t.status[status as TicketStatus] : status}
    </StatusTag>
  )
}
