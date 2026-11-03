import { financeApi } from '../../../finance/api'
import type { OrderRow } from './types'

/** Enriches payable orders from the invoice API without failing the order list. */
export async function loadFinalPaymentState(
  rows: OrderRow[],
  signal?: AbortSignal,
  eligibleOrderIds?: ReadonlySet<string>,
): Promise<OrderRow[]> {
  return Promise.all(
    rows.map(async (row) => {
      if (
        (eligibleOrderIds && !eligibleOrderIds.has(row.id)) ||
        !['APPROVED', 'IN_PROGRESS'].includes(row.status) ||
        row.depositState === 'ACTION_REQUIRED' ||
        row.depositState === 'PAID_IN_FULL'
      ) {
        return row
      }

      try {
        const invoice = await financeApi.getInvoice(row.id, signal)
        return invoice.finalPaymentAllowed && invoice.remainingAmount > 0
          ? { ...row, finalPaymentState: 'ACTION_REQUIRED' as const }
          : row
      } catch {
        // Invoice may not exist yet; keep the order list usable if finance is unavailable.
        return row
      }
    }),
  )
}
