import { PageHeader } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import { OrderStatusBadge } from '../../../components/common/OrderStatusBadge'
import type { OrderDetailView } from '../../../lib/orders/types'
import { customerHref } from '../../../routes'
import { CopyButton } from './CopyButton'
import { OrderActions } from './OrderActions'
import { orderHeaderMessages } from './OrderHeader.messages'

export function OrderHeader({ order }: { order: OrderDetailView }) {
  const { t } = useI18n(orderHeaderMessages)
  const title = getDisplayTitle(order, t.orderTitleFallback)
  return (
    <PageHeader
      back={
        <a className="cus-back" href={customerHref({ screen: 'orders' })}>
          {t.backToOrders}
        </a>
      }
      title={title}
      actions={<OrderActions order={order} />}
      subtitle={
        <span className="od-meta">
          <OrderStatusBadge
            status={order.status}
            label={
              order.status === 'COMPLETED' ? t.missionCompleted : undefined
            }
          />
          <span className="od-code">
            <span>{`${t.codeLabel}:`}</span>
            <span className="od-mono">{order.code}</span>
            <CopyButton value={order.code} label={t.copyId} />
          </span>
        </span>
      }
    />
  )
}

export function getDisplayTitle(order: OrderDetailView, fallbackLabel: string) {
  const title = order.title.trim()
  const isMeaningful =
    Array.from(title).length >= 2 && /[\p{L}\p{N}]/u.test(title)

  if (isMeaningful) return title

  const code = order.code?.trim()
  const context = [order.serviceName, order.address, code ? `#${code}` : '']
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))

  return context.length ? context.join(' · ') : fallbackLabel
}
