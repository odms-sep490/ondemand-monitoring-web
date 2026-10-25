import type { OrderDetail } from '../../../types/orders'
import type { OrderReviewMessages } from '../OrderReviewPage.messages'
import { formatVn } from '../../../components/common/format'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { StatusBadge, toUiTone } from '../../../../../shared/components/ui'
import {
  getOrderStatusLabel,
  orderStatusTone,
} from '../../../../../shared/lib/statusTone'

export function OrderStatusCard({
  order,
  t,
  locale,
}: {
  order: OrderDetail
  t: OrderReviewMessages
  locale: 'vi-VN' | 'en-US'
}) {
  // The detail payload has no "updated at" field, so no such row is shown.
  const rows = [
    {
      icon: 'calendar' as const,
      label: t.createdAt,
      value: order.submittedAt ? formatVn(order.submittedAt, locale) : '—',
    },
  ]

  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="target" size={18} />
          {t.orderStatus}
        </span>
        <StatusBadge
          tone={toUiTone(
            order.status === 'PENDING'
              ? 'yellow'
              : orderStatusTone[order.status],
          )}
        >
          {getOrderStatusLabel(order.status, locale === 'en-US' ? 'en' : 'vi')}
        </StatusBadge>
      </header>
      <dl className="odm-or-card-body odm-or-status-list">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>
              <OrderIcon name={row.icon} size={16} />
              {row.label}
            </dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
