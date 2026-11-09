import { useI18n } from '../../../../../shared/i18n'
import type { OrderStats } from '../../../lib/orders/types'
import { dashboardStatsMessages } from './DashboardStats.messages'

export function DashboardStats({ stats }: { stats: OrderStats }) {
  const { t } = useI18n(dashboardStatsMessages)
  return (
    <dl className="cus-kpi-grid">
      <div className="cus-kpi">
        <dt>{t.total}</dt>
        <dd>{stats.total}</dd>
      </div>
      <div className="cus-kpi">
        <dt>{t.pending}</dt>
        <dd>{stats.pending}</dd>
      </div>
      <div className="cus-kpi">
        <dt>{t.inProgress}</dt>
        <dd>{stats.inProgress}</dd>
      </div>
      <div className="cus-kpi">
        <dt>{t.completed}</dt>
        <dd>{stats.completed}</dd>
      </div>
    </dl>
  )
}
