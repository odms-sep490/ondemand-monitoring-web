import { useMemo } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerApi } from '../../../api/customerApi'
import { loadFinalPaymentState } from '../../../lib/orders/loadFinalPaymentState'
import { toOrderRow } from '../../../lib/orders/mapOrder'
import { computeOrderStats, recentOrders } from '../../../lib/orders/orderStats'

export const RECENT_LIMIT = 5

/**
 * The BE has no customer dashboard endpoint: KPIs come from
 * `GET /api/orders/mine`.
 */
export function useDashboardData() {
  const orders = useApiQuery(
    async (signal) => {
      const rows = (await customerApi.listMyOrders({ signal })).map(toOrderRow)
      const recentIds = new Set(
        recentOrders(rows, RECENT_LIMIT).map((order) => order.id),
      )
      return loadFinalPaymentState(rows, signal, recentIds)
    },
    [],
  )
  const stats = useMemo(() => computeOrderStats(orders.data ?? []), [orders.data])
  const recent = useMemo(
    () => recentOrders(orders.data ?? [], RECENT_LIMIT),
    [orders.data],
  )

  return { orders, stats, recent }
}
