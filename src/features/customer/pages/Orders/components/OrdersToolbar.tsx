import { Icon } from '../../../../../shared/components/Icon'
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

/** Status chips (server-side filter) and a client-side search box. */
export function OrdersToolbar({ status, query, stats, onStatus, onQuery }: Props) {
  const { t } = useI18n(ordersToolbarMessages)
  const { lang } = useLanguage()
  const chips: Array<{ value: OrderStatus | ''; label: string; count?: number }> = [
    { value: '', label: t.all, count: stats?.total },
    ...ORDER_FILTERS.map((value) => ({
      value,
      label: getOrderStatusMeta(value, lang).label,
      count: stats?.[STAT_KEY[value as keyof typeof STAT_KEY]],
    })),
  ]

  return (
    <div className="ord-toolbar">
      <div className="ord-chips" role="group" aria-label={t.filterLabel}>
        {chips.map((chip) => (
          <button
            key={chip.value || 'all'}
            type="button"
            className={`ord-chip${status === chip.value ? ' is-active' : ''}`}
            aria-pressed={status === chip.value}
            onClick={() => onStatus(chip.value)}
          >
            {chip.label}
            {chip.count !== undefined && (
              <span className="ord-chip-count" aria-hidden="true">
                {chip.count}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="ord-search-wrap">
        <Icon className="ord-search-icon" name="search" width={16} height={16} aria-hidden="true" />
        <input
          type="search"
          className="ord-search"
          value={query}
          aria-label={t.searchLabel}
          placeholder={t.searchPlaceholder}
          onChange={(e) => onQuery(e.target.value)}
        />
      </div>
    </div>
  )
}
