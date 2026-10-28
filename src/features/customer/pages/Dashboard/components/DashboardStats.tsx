import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  ShoppingOutlined,
} from '@ant-design/icons'

import { StatisticComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { OrderStats } from '../../../lib/orders/types'
import { customerHref } from '../../../routes'
import { dashboardStatsMessages } from './DashboardStats.messages'

export function DashboardStats({ stats }: { stats: OrderStats }) {
  const { t } = useI18n(dashboardStatsMessages)
  const orders = customerHref({ screen: 'orders' })
  return (
    <div className="cus-kpi-grid">
      <a className="cus-kpi" href={orders}>
        <StatisticComponent
          index={0}
          tone="blue"
          icon={<ShoppingOutlined />}
          title={t.total}
          value={stats.total}
          hint={t.unit}
        />
      </a>
      <a className="cus-kpi" href={orders}>
        <StatisticComponent
          index={1}
          tone={stats.pending > 0 ? 'amber' : 'blue'}
          icon={<ClockCircleOutlined />}
          title={t.pending}
          value={stats.pending}
          hint={t.unit}
        />
      </a>
      <a className="cus-kpi" href={orders}>
        <StatisticComponent
          index={2}
          tone="violet"
          icon={<RocketOutlined />}
          title={t.inProgress}
          value={stats.inProgress}
          hint={t.unit}
        />
      </a>
      <a className="cus-kpi" href={orders}>
        <StatisticComponent
          index={3}
          tone="green"
          icon={<CheckCircleOutlined />}
          title={t.completed}
          value={stats.completed}
          hint={t.unit}
        />
      </a>
    </div>
  )
}
