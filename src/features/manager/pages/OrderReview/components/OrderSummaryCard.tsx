import { ProfileOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { preferredRangeLabel } from '../../../lib/viLabels'
import { formatVn } from '../../../components/common/format'
import { resolveOrderGpsCenter } from '../../../components/common/orderGps'
import type { OrderDetail } from '../../../types/orders'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'

/** Compact key/value digest of the order, shown with the active review stage. */
export function OrderSummaryCard({
  order,
  compact = false,
  actionSlot,
}: {
  order: OrderDetail
  compact?: boolean
  actionSlot?: ReactNode
}) {
  const { t, locale } = useI18n(orderReviewPageMessages)
  const preferred =
    preferredRangeLabel(
      order.preferredDateFrom ?? order.preferredDate,
      order.preferredDateTo ?? order.preferredDateFrom ?? order.preferredDate,
      order.preferredTimeName,
      order.preferredWindow,
    ) || '—'
  const gps = resolveOrderGpsCenter(order.center)
  const location =
    order.addressText ?? (gps ? `${gps.center.lat}, ${gps.center.lon}` : '—')
  const rows: Array<[string, string]> = [
    [t.service, order.serviceName],
    [t.preferredWindow, preferred],
    [t.locationLabel, location],
    [t.createdAt, order.submittedAt ? formatVn(order.submittedAt, locale) : '—'],
  ]
  return (
    <CardComponent
      icon={<ProfileOutlined />}
      title={t.summaryTitle}
      extra={actionSlot}
      className={
        compact
          ? 'mgr-order-summary-card is-compact'
          : 'mgr-order-summary-card'
      }
    >
      <dl className={`mgr-kv${compact ? ' is-compact' : ''}`}>
        {rows.map(([label, value]) => (
          <div className="mgr-kv-row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </CardComponent>
  )
}
