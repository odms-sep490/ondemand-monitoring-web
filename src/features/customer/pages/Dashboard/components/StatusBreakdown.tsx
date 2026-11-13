import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { OrderStats } from '../../../lib/orders/types'
import { OrderStatusTag } from './OrderStatusTag'
import { statusBreakdownMessages } from './StatusBreakdown.messages'

const ROWS = [
  ['PENDING', 'pending'],
  ['UNDER_REVIEW', 'underReview'],
  ['APPROVED', 'approved'],
  ['IN_PROGRESS', 'inProgress'],
  ['COMPLETED', 'completed'],
  ['REJECTED', 'rejected'],
  ['CANCELLED', 'cancelled'],
] as const

/** Counts per BE order status, computed from `GET /api/orders/mine`. */
export function StatusBreakdown({ stats }: { stats: OrderStats }) {
  const { t } = useI18n(statusBreakdownMessages)
  return (
    <CardComponent title={t.title} className="cus-status-card">
      <ul className="cus-breakdown">
        {ROWS.filter(([, key]) => (stats[key] ?? 0) > 0).map(([status, key]) => (
          <li key={status}>
            <OrderStatusTag status={status} />
            <strong>{stats[key]}</strong>
          </li>
        ))}
      </ul>
    </CardComponent>
  )
}
