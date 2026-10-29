import { Button } from 'antd'
import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import type { Payment } from '../../types'
import { paymentResultMessages } from '../PaymentResult.messages'

export function PaymentResultCard({
  success,
  cancelled,
  checking,
  payment,
  error,
  check,
  retryPayment,
}: {
  success: boolean
  cancelled: boolean
  checking: boolean
  payment: Payment | null
  error: string | null
  check: () => Promise<void>
  retryPayment: () => Promise<void>
}) {
  const { t } = useI18n(paymentResultMessages)
  return (
    <section className="payment-result-card" aria-live="polite">
      <div
        className={`payment-result-icon ${success ? 'is-success' : cancelled ? 'is-cancelled' : ''}`}
        aria-hidden="true"
      >
        {success ? '✓' : cancelled ? '×' : '…'}
      </div>
      <h1>
        {success
          ? t.titleSuccess
          : cancelled
            ? t.titleCancelled
            : checking
              ? t.titleChecking
              : t.titlePending}
      </h1>
      <p>
        {success
          ? payment?.type === 'DEPOSIT'
            ? t.bodyDeposit
            : t.bodyFinal
          : cancelled
            ? t.bodyCancelled
            : t.bodyPending}
      </p>
      {payment ? (
        <dl className="payment-result-detail">
          <div>
            <dt>{t.reference}</dt>
            <dd>{payment.transactionReference}</dd>
          </div>
          <div>
            <dt>{t.amount}</dt>
            <dd>{formatVnd(payment.amount)}</dd>
          </div>
        </dl>
      ) : null}
      {error ? (
        <p className="finance-alert is-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="payment-result-actions">
        {!success && !checking ? (
          <Button type="primary" onClick={() => void check()}>
            {t.refresh}
          </Button>
        ) : null}
        {cancelled && payment && !success ? (
          <Button onClick={() => void retryPayment()}>{t.retry}</Button>
        ) : null}
        <Button href="#portal/customer/orders">{t.backToOrders}</Button>
      </div>
    </section>
  )
}
