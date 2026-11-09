import { useI18n } from '../../../../../shared/i18n'
import {
  getTicketSeverityLabel,
  getTicketStatusLabel,
  ticketSeverityTone,
  ticketStatusTone,
} from '../../../../../shared/lib/statusTone'
import type { TicketSeverity, TicketStatus } from '../../../../../shared/types/domain'
import { StatusTag } from '../../../components/common/StatusTag'
import { maintenancePageMessages } from '../MaintenancePage.messages'

export function TicketStatusTag({ status }: { status: TicketStatus }) {
  const { lang } = useI18n(maintenancePageMessages)
  return <StatusTag tone={ticketStatusTone[status]}>{getTicketStatusLabel(status, lang)}</StatusTag>
}

export function TicketSeverityTag({ severity }: { severity: TicketSeverity }) {
  const { lang } = useI18n(maintenancePageMessages)
  return (
    <StatusTag tone={ticketSeverityTone[severity]}>{getTicketSeverityLabel(severity, lang)}</StatusTag>
  )
}
