import { useMemo, useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import type { OrderStatus } from '../../../../../shared/types/domain'
import { customerApi } from '../../../api/customerApi'
import {
  paginate,
  searchOrders,
  sortNewestFirst,
} from '../../../lib/orders/filterOrders'
import { toOrderRow } from '../../../lib/orders/mapOrder'
import { computeOrderStats } from '../../../lib/orders/orderStats'

export const ORDERS_PAGE_SIZE = 10

/**
 * `GET /api/orders/mine`: the status filter is sent to the BE; search and
 * paging are client-side because the endpoint returns every order at once.
 */
export function useOrdersList() {
  const [status, setStatusState] = useState<OrderStatus | ''>('')
  const [query, setQueryState] = useState('')
  const [page, setPage] = useState(0)

  const orders = useApiQuery(
    (signal) =>
      customerApi
        .listMyOrders({ status: status || undefined, signal })
        .then((rows) => sortNewestFirst(rows.map(toOrderRow))),
    [status],
  )

  // Unfiltered list for the stats row and chip counts; declared after the filtered query so that one stays the last call.
  const all = useApiQuery(
    (signal) =>
      customerApi.listMyOrders({ signal }).then((rows) => rows.map(toOrderRow)),
    [],
  )
  const stats = useMemo(
    () => (all.data ? computeOrderStats(all.data) : undefined),
    [all.data],
  )

  const view = useMemo(
    () =>
      paginate(searchOrders(orders.data ?? [], query), page, ORDERS_PAGE_SIZE),
    [orders.data, query, page],
  )

  return {
    status,
    query,
    view,
    stats,
    loading: orders.loading,
    error: orders.error,
    reload: orders.reload,
    filtered: Boolean(status || query.trim()),
    setStatus: (next: OrderStatus | '') => {
      setStatusState(next)
      setPage(0)
    },
    setQuery: (next: string) => {
      setQueryState(next)
      setPage(0)
    },
    setPage,
    clear: () => {
      setStatusState('')
      setQueryState('')
      setPage(0)
    },
  }
}
