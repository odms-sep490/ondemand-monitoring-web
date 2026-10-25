import { StatusBadge, toUiTone } from '../../../../../shared/components/ui'
import {
  getOrderStatusLabel,
  orderStatusTone,
} from '../../../../../shared/lib/statusTone'
import type { OrderDetail } from '../../../types/orders'
import { formatOrderCode } from '../../../components/common/format'
import { OrderIcon } from '../../../components/common/OrderIcon'

/** Order code + status shown at the right of the compact service bar. */
export function OrderBannerMeta({
  order,
  locale,
}: {
  order: Pick<OrderDetail, 'code' | 'status'>
  locale: 'vi-VN' | 'en-US'
}) {
  const pending = order.status === 'PENDING'
  return (
    <>
      <span className="odm-osb-code">{formatOrderCode(order.code)}</span>
      <StatusBadge
        tone={toUiTone(pending ? 'yellow' : orderStatusTone[order.status])}
      >
        {pending ? <OrderIcon name="clock" size={13} /> : null}
        {getOrderStatusLabel(order.status, locale === 'en-US' ? 'en' : 'vi')}
      </StatusBadge>
    </>
  )
}
