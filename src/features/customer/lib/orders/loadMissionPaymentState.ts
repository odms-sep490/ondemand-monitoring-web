import { financeApi } from '../../../finance/api'
import type { OrderRow } from './types'

const OUTSTANDING_MISSION_PAYMENT_STATUSES = new Set(['UNPAID', 'PENDING', 'EXPIRED'])

/** Adds a customer-facing payment reminder when a handed-over Mission is unpaid. */
export async function loadMissionPaymentState(
  rows: OrderRow[],
  signal?: AbortSignal,
  eligibleOrderIds?: ReadonlySet<string>,
): Promise<OrderRow[]> {
  return Promise.all(
    rows.map(async (row) => {
      if (
        (eligibleOrderIds && !eligibleOrderIds.has(row.id)) ||
        !['APPROVED', 'IN_PROGRESS'].includes(row.status)
      ) {
        return row
      }

      try {
        const allocation = await financeApi.getCustomerMissionPaymentAllocations(row.id, signal)
        return allocation.milestones.some((milestone) =>
          OUTSTANDING_MISSION_PAYMENT_STATUSES.has(milestone.status),
        )
          ? { ...row, missionPaymentState: 'ACTION_REQUIRED' as const }
          : row
      } catch {
        // An order can be approved before payment milestones exist; keep the list usable.
        return row
      }
    }),
  )
}
