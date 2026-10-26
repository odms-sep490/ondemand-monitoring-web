import { AlertOutlined, CheckCircleOutlined, UserDeleteOutlined } from '@ant-design/icons'

import { StatisticComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { maintenancePageMessages } from '../MaintenancePage.messages'

type Props = {
  unassignedCount: number
  urgentCount: number
  resolvedCount: number
}

export function MaintenanceKpis({ unassignedCount, urgentCount, resolvedCount }: Props) {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <div className="mgr-kpi-strip">
      <StatisticComponent
        index={0}
        tone={unassignedCount > 0 ? 'red' : 'blue'}
        icon={<UserDeleteOutlined />}
        title={t.page.unassignedStat}
        value={unassignedCount}
      />
      <StatisticComponent
        index={1}
        tone={urgentCount > 0 ? 'amber' : 'blue'}
        icon={<AlertOutlined />}
        title={t.page.urgentStat}
        value={urgentCount}
      />
      <StatisticComponent
        index={2}
        tone="green"
        icon={<CheckCircleOutlined />}
        title={t.page.resolvedStat}
        value={resolvedCount}
      />
    </div>
  )
}
