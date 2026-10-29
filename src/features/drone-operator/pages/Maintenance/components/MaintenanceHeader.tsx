import { FileTextOutlined, ToolOutlined } from '@ant-design/icons'

import {
  PageHeader,
  StatisticComponent,
} from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { MaintenanceTicketDto } from '../../../api/maintenanceTicketApi'
import { maintenancePageMessages } from '../MaintenancePage.messages'

export function MaintenanceHeader({
  myOpenCount,
  allTickets,
}: {
  myOpenCount: number
  allTickets: MaintenanceTicketDto[]
}) {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <>
      <PageHeader title={t.headerTitle} description={t.headerSubtitle} />
      <div className="mgr-kpi-strip">
        <StatisticComponent
          index={0}
          tone="amber"
          icon={<ToolOutlined />}
          title={t.needsAction}
          value={myOpenCount}
        />
        <StatisticComponent
          index={1}
          tone="blue"
          icon={<FileTextOutlined />}
          title={t.totalTickets}
          value={allTickets.length}
        />
      </div>
    </>
  )
}
