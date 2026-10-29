import { FilterBar, FilterSegments } from '../../../../../shared/components/antd'
import { useLanguage, useI18n } from '../../../../../shared/i18n'
import type { OrderStats } from '../../../lib/orders/types'
import type { OrderStatus } from '../../../../../shared/types/domain'
import { getOrderStatusMeta } from '../../../lib/orderStatus'
import { ordersToolbarMessages } from './OrdersToolbar.messages'

/** Statuses the BE `GET /api/orders/mine?status=` accepts. */
export const ORDER_FILTERS: readonly OrderStatus[] = [
  'PENDING',
  'NEEDS_INFO',
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
]

const STAT_KEY = {
  PENDING: 'pending',
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

/** Status segments (server-side filter) and a client-side search box. */
export function OrdersToolbar({ status, query, stats, onStatus, onQuery }: Props) {
  const { t } = useI18n(ordersToolbarMessages)
  const { lang } = useLanguage()
  const options: Array<{ value: OrderStatus | ''; label: string; count?: number }> = [
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
        <FilterSegments<string>
          ariaLabel={t.filterLabel}
          options={options.map((o) => ({ ...o, value: o.value || 'all' }))}
          value={status || 'all'}
          onChange={(v) => onStatus(v === 'all' ? '' : (v as OrderStatus))}
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
