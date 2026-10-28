import { Card } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import { OrderStatusBadge } from '../../../components/common/OrderStatusBadge'
import type { OrderRow } from '../../../lib/orders/types'
import { customerHref } from '../../../routes'
import { liveOrderCardMessages } from './LiveOrderCard.messages'

export function LiveOrderCard({ order }: { order: OrderRow }) {
  const { t } = useI18n(liveOrderCardMessages)
  return (
    <Card>
      <div className="lh-card">
        <div className="lh-card-main">
          <div className="lh-card-head">
            <span className="lh-live">{t.live}</span>
            <strong className="lh-title">{order.title}</strong>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="lh-sub">
            {[order.code, order.address].filter(Boolean).join(' · ')}
          </div>
        </div>
        <a
          className="odm-btn odm-btn-p"
          href={customerHref({ screen: 'live', orderId: order.id })}
        >
          {t.enter}
        </a>
      </div>
    </Card>
  )
}
