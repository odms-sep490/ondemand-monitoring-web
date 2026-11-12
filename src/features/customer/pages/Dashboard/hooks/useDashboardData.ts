import { useMemo } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerApi } from '../../../api/customerApi'
import {
  customerMissionReportApi,
  type CustomerMissionSummary,
} from '../../../api/customerMissionReportApi'
import { loadMissionPaymentState } from '../../../lib/orders/loadMissionPaymentState'
import { toOrderRow } from '../../../lib/orders/mapOrder'
import type { OrderRow } from '../../../lib/orders/types'
import { computeOrderStats, recentOrders } from '../../../lib/orders/orderStats'

export const RECENT_LIMIT = 5
export const MISSION_ORDER_LIMIT = 5

export type DashboardMissionItem = {
  order: OrderRow
  mission: CustomerMissionSummary
}

export type DashboardMissionData = {
  items: DashboardMissionItem[]
  orderIds: string[]
  unavailableOrderCount: number
}

function missionOrders(orders: OrderRow[] | undefined) {
  return recentOrders(
    (orders ?? []).filter((order) =>
      ['APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(
        order.status,
      ),
    ),
    MISSION_ORDER_LIMIT,
  )
}

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
      return loadMissionPaymentState(rows, signal, recentIds)
    },
    [],
  )
  const stats = useMemo(
    () => computeOrderStats(orders.data ?? []),
    [orders.data],
  )
  const recent = useMemo(
    () => recentOrders(orders.data ?? [], RECENT_LIMIT),
    [orders.data],
  )
  const eligibleMissionOrders = useMemo(
    () => missionOrders(orders.data),
    [orders.data],
  )
  const missionData = useApiQuery<DashboardMissionData>(
    async (signal) => {
      const results = await Promise.allSettled(
        eligibleMissionOrders.map(async (order) => ({
          order,
          missions: await customerMissionReportApi.list(order.id, signal),
        })),
      )

      return {
        orderIds: eligibleMissionOrders.map((order) => order.id),
        items: results.flatMap((result) =>
          result.status === 'fulfilled'
            ? result.value.missions.map((mission) => ({
                order: result.value.order,
                mission,
              }))
            : [],
        ),
        unavailableOrderCount: results.filter(
          (result) => result.status === 'rejected',
        ).length,
      }
    },
    [eligibleMissionOrders],
  )
  const missionDataLoading =
    missionData.loading ||
    missionData.data?.orderIds.join('|') !==
      eligibleMissionOrders.map((order) => order.id).join('|')

  return { orders, stats, recent, missionData, missionDataLoading }
}
