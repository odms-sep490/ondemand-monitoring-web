import { Card, EmptyState } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { OrderStatusBadge } from '../../../components/common/OrderStatusBadge'
import { formatDateRange } from '../../../lib/orders/format'
import type { OrderRow } from '../../../lib/orders/types'
import { customerHref } from '../../../routes'
import { recentOrdersMessages } from './RecentOrdersCard.messages'

export function RecentOrdersCard({ orders }: { orders: OrderRow[] }) {
  const { t, locale } = useI18n(recentOrdersMessages)
  return (
    <Card
      title={t.title}
      actions={<a href={customerHref({ screen: 'orders' })}>{t.viewAll}</a>}
    >
      {orders.length === 0 ? (
        <EmptyState
          title={t.emptyTitle}
          description={t.emptyDescription}
          action={
            <a className="odm-btn odm-btn-p" href={customerHref({ screen: 'createOrder' })}>
              {t.emptyAction}
            </a>
          }
        />
      ) : (
        <ul className="dash-list">
          {orders.map((order) => (
            <li key={order.id}>
              <div className="dash-list-main">
                <a
                  className="dash-list-title"
                  href={customerHref({ screen: 'orderDetail', orderId: order.id })}
                >
                  {order.title}
                </a>
                <div className="dash-list-sub">
                  {[order.address, formatDateRange(order.dateFrom, order.dateTo, locale)]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
              <div className="dash-order-status">
                <OrderStatusBadge status={order.status} />
                {order.depositState === 'ACTION_REQUIRED' ? (
                  <span className="dash-deposit-required">
                    <span aria-hidden="true" />
                    {t.depositRequired}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
