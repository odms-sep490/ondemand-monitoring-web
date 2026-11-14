import { OrderContractPanel } from '../../../../contract/OrderContractPanel'
import type { ExecutionPlan } from '../../../types/planning'
import type { MissionResponse } from '../../../types/missions'
import type { OrderDetail } from '../../../types/orders'
import type { Invoice } from '../../../../finance/types'
import { Button } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { planningPaymentGateMessages } from './PlanningPaymentGate.messages'

/** Deposit gate shown as a clear banner above the mission cards. */
export function PlanningPaymentGate({
  checkingPayment,
  checkPayment,
  onContractUpdated,
  data,
}: {
  checkingPayment: boolean
  checkPayment: () => Promise<void>
  onContractUpdated?: () => void
  data: {
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    invoice: Invoice | null
  }
}) {
  const { t, locale } = useI18n(planningPaymentGateMessages)
  const waitingContract =
    data.invoice?.contractRequired && !data.invoice.contractConfirmedAt
  return (
    <>
      {data.invoice?.contractRequired && (
        <OrderContractPanel
          orderId={data.order.id}
          mode="manager"
          onUpdated={onContractUpdated ?? (() => void checkPayment())}
        />
      )}
      <div className="mgr-banner mgr-plan-gate" role="status">
        <div className="mgr-plan-gate-text">
          <strong>
            {!data.invoice
              ? t.waitingCustomer
              : waitingContract
                ? t.waitingContract
                : t.waiting}
          </strong>
          {!data.invoice ? (
            <span>{t.customerNote}</span>
          ) : (
            waitingContract && <span>{t.contractNote}</span>
          )}
          {data.invoice ? (
            <>
              <progress
                className="mgr-plan-progress"
                max={Math.max(data.invoice.depositAmount, 1)}
                value={Math.min(
                  data.invoice.paidAmount,
                  Math.max(data.invoice.depositAmount, 1),
                )}
                aria-label={t.waiting}
              />
              <span>
                {t.paid(
                  data.invoice.paidAmount.toLocaleString(locale),
                  data.invoice.depositAmount.toLocaleString(locale),
                )}
              </span>
            </>
          ) : null}
        </div>
        <Button
          type="button"
          disabled={checkingPayment}
          onClick={() => void checkPayment()}
        >
          {checkingPayment
            ? t.checking
            : !data.invoice
              ? t.refreshStatus
              : t.checkPayment}
        </Button>
      </div>
    </>
  )
}
