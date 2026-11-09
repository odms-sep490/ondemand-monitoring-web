import { PageHeader } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import { OrderStatusBadge } from '../../../components/common/OrderStatusBadge'
import type { OrderRow } from '../../../lib/orders/types'
import { customerHref } from '../../../routes'
import { liveHeaderMessages } from './LiveHeader.messages'

export function LiveHeader({ order }: { order: OrderRow }) {
  const { t } = useI18n(liveHeaderMessages)
  return (
    <PageHeader
      back={<a className="cus-back" href={customerHref({ screen: 'orderDetail', orderId: order.id })}>{t.backToOrder}</a>}
      title={t.title}
      subtitle={order.title}
      actions={<OrderStatusBadge status={order.status} />}
    />
  )
}
