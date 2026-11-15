import { PageHeader, StatusTag } from '../../../../../shared/components/antd'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { MaintenanceTicketDto } from '../../../api/maintenanceTicketApi'

export function MaintenanceHeader({
  myOpenCount,
  allTickets,
}: {
  myOpenCount: number
  allTickets: MaintenanceTicketDto[]
}) {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <PageHeader
      title={t.headerTitle}
      description={t.headerSubtitle}
      actions={
        <>
          <StatusTag tone="warning">
            {t.needsAction}: {myOpenCount}
          </StatusTag>
          <StatusTag tone="info">
            {t.totalTickets}: {allTickets.length}
          </StatusTag>
        </>
      }
    />
  )
}
