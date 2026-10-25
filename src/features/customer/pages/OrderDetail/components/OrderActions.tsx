import { OrderIcon } from '../../../../manager/components/common/OrderIcon'
import { useI18n } from '../../../../../shared/i18n'
import type { OrderDetailView } from '../../../lib/orders/types'
import { customerHref } from '../../../routes'
import { orderActionsMessages } from './OrderActions.messages'

export function OrderActions({ order }: { order: OrderDetailView }) {
  const { t } = useI18n(orderActionsMessages)
  const active = order.status === 'IN_PROGRESS'
  const hasMedia = active || order.status === 'COMPLETED'

  return (
    <div className="od-actions">
      {active && (
        <a className="odm-btn od-btn" href={customerHref({ screen: 'live', orderId: order.id })}>
          <OrderIcon name="locate" size={16} />
          {t.live}
        </a>
      )}
      {hasMedia && (
        <a className="odm-btn od-btn" href={customerHref({ screen: 'media', orderId: order.id })}>
          <OrderIcon name="media" size={16} />
          {t.media}
        </a>
      )}
    </div>
  )
}
