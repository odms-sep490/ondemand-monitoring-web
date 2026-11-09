import { FilterOutlined } from '@ant-design/icons'
import { Select } from 'antd'

import { FilterBar } from '../../../../../shared/components/antd'
import { useLanguage, useI18n } from '../../../../../shared/i18n'
import type { OrderStats } from '../../../lib/orders/types'
import type { OrderStatus } from '../../../../../shared/types/domain'
import { getOrderStatusMeta } from '../../../lib/orderStatus'
import { ordersToolbarMessages } from './OrdersToolbar.messages'

/** Statuses the BE `GET /api/orders/mine?status=` accepts. */
export const ORDER_FILTERS: readonly OrderStatus[] = [
  'PENDING',
  'UNDER_REVIEW',
  'NEEDS_INFO',
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
]

const STAT_KEY = {
  PENDING: 'pending',
  UNDER_REVIEW: 'underReview',
  NEEDS_INFO: 'needsInfo',
  APPROVED: 'approved',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const satisfies Partial<Record<OrderStatus, keyof OrderStats>>

type Props = {
  status: OrderStatus | ''
  query: string
  stats?: OrderStats
  onStatus: (status: OrderStatus | '') => void
  onQuery: (query: string) => void
}

/** Server-side status filter and client-side search box. */
export function OrdersToolbar({
  status,
  query,
  stats,
  onStatus,
  onQuery,
}: Props) {
  const { t } = useI18n(ordersToolbarMessages)
  const { lang } = useLanguage()
  const options: Array<{
    value: OrderStatus | ''
    label: string
    count?: number
  }> = [
    { value: '', label: t.all, count: stats?.total },
    ...ORDER_FILTERS.map((value) => ({
      value,
      label: getOrderStatusMeta(value, lang).label,
      count: stats?.[STAT_KEY[value as keyof typeof STAT_KEY]],
    })),
  ]

  return (
    <FilterBar
      start={
        <Select
          className="cus-orders-status-filter"
          size="large"
          aria-label={t.filterLabel}
          value={status || 'all'}
          prefix={<FilterOutlined aria-hidden="true" />}
          options={options.map((option) => ({
            value: option.value || 'all',
            label: (
              <span className="cus-order-filter-option">
                <span>{option.label}</span>
                {option.count !== undefined ? (
                  <span className="cus-order-filter-count">{option.count}</span>
                ) : null}
              </span>
            ),
          }))}
          onChange={(value: string) =>
            onStatus(value === 'all' ? '' : (value as OrderStatus))
          }
        />
      }
      search={{
        value: query,
        onChange: onQuery,
        placeholder: t.searchPlaceholder,
        ariaLabel: t.searchLabel,
      }}
    />
  )
}
