import { StatisticComponent } from '../../../../../shared/components/antd'
import { useI18n, useLanguage } from '../../../../../shared/i18n'
import { getOrderStatusMeta } from '../../../lib/orderStatus'
import type { OrderStats } from '../../../lib/orders/types'
import { ordersStatsMessages } from './OrdersStats.messages'

export function OrdersStats({ stats }: { stats: OrderStats }) {
  const { t } = useI18n(ordersStatsMessages)
  const { lang } = useLanguage()
  const label = (status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') =>
    getOrderStatusMeta(status, lang).label
  return (
    <div className="cus-kpi-grid ord-stats">
      <StatisticComponent
        className="ord-stat-total"
        index={0}
        tone="blue"
        title={t.total}
        value={stats.total}
      />
      <StatisticComponent
        className="ord-stat-pending"
        index={1}
        tone={stats.pending > 0 ? 'amber' : 'blue'}
        title={label('PENDING')}
        value={stats.pending}
      />
      <StatisticComponent
        className="ord-stat-progress"
        index={2}
        tone="violet"
        title={label('IN_PROGRESS')}
        value={stats.inProgress}
      />
      <StatisticComponent
        className="ord-stat-completed"
        index={3}
        tone={stats.completed > 0 ? 'green' : 'blue'}
        title={label('COMPLETED')}
        value={stats.completed}
      />
    </div>
  )
}
