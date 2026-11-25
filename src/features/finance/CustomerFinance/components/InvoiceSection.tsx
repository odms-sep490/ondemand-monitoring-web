import { isContractDepositReady } from '../../contractPaymentEligibility'
import { useState } from 'react'
import { Button } from 'antd'
import { useI18n } from '../../../../shared/i18n'
import { customerFinanceSectionsMessages } from '../CustomerFinanceSections.messages'
import { pricingLabel } from '../../../../shared/lib/pricingPresentation'
import { StatusTag } from '../../../../shared/components/antd'
import { PaymentStat } from './PaymentStat'
import type { Invoice } from '../../types'
import { env } from '../../../../config/env'
import { DeadlineCountdown } from './DeadlineCountdown'
import { formatVnd } from '../../../../shared/lib/formatVnd'

const INVOICE_TONE: Record<
  string,
  'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  ISSUED: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'neutral',
  REFUNDED: 'neutral',
}

export function InvoiceSummary({ invoice }: { invoice: Invoice }) {
  const { t } = useI18n(customerFinanceSectionsMessages)
  const depositStatus =
    invoice.depositStatus ??
    (invoice.paidAmount >= invoice.depositAmount
      ? 'DEPOSIT_PAID'
      : 'WAITING_DEPOSIT')

  return (
    <section
      className="customer-invoice-summary"
      aria-label={t.invoice(invoice.invoiceNumber)}
    >
      <div className="customer-invoice-summary-title">
        <h3>{t.invoice(invoice.invoiceNumber)}</h3>
        <div className="customer-invoice-summary-statuses">
          <StatusTag tone={INVOICE_TONE[invoice.status] ?? 'neutral'}>
            {invoice.status === 'PAID'
              ? t.paymentCompleted
              : t.invoiceStatus[invoice.status] ?? pricingLabel(invoice.status)}
          </StatusTag>
          {!['PAID', 'CANCELLED', 'REFUNDED'].includes(invoice.status) ? (
            <StatusTag
              tone={depositStatus === 'DEPOSIT_PAID' ? 'success' : 'warning'}
            >
              {t.depositStatusLabel}: {t.depositPaymentStatus[depositStatus]}
            </StatusTag>
          ) : null}
        </div>
      </div>
      <div className="customer-payment-stats">
        <PaymentStat label={t.remaining} value={invoice.remainingAmount} />
        <PaymentStat label={t.total} value={invoice.totalAmount} />
        <PaymentStat
          label={t.paid}
          value={invoice.paidAmount}
          detail={
            depositStatus === 'DEPOSIT_PAID'
              ? t.paidIncludesDeposit(formatVnd(invoice.depositAmount))
              : t.depositAwaitingPayment(formatVnd(invoice.depositAmount))
          }
        />
      </div>
    </section>
  )
}

export function InvoiceSection({
  invoice,
  legalReady,
  busy,
  pay,
  completeTestDeposit,
  testPaymentLabel,
  refreshExpired,
  handedOverCount = 0,
  unpaidHandedOverCount = 0,
}: {
  invoice: Invoice
  legalReady: boolean
  busy: boolean
  pay: (type: 'deposit') => Promise<void>
  completeTestDeposit: () => Promise<void>
  testPaymentLabel: string
  refreshExpired?: () => void
  handedOverCount?: number
  unpaidHandedOverCount?: number
}) {
  const { t, locale } = useI18n(customerFinanceSectionsMessages)
  const [expiredDeadlineKey, setExpiredDeadlineKey] = useState<string | null>(
    null,
  )
  const deadlineKey = `${invoice.id}:${invoice.depositExpiresAt ?? ''}`
  const depositStartAt = invoice.contractConfirmedAt ?? invoice.issuedAt
  const depositExpiresAt = invoice.depositExpiresAt
    ? Date.parse(invoice.depositExpiresAt)
    : Number.NaN
  const hasValidDepositDeadline = Number.isFinite(depositExpiresAt)
  const depositReachedDeadline =
    hasValidDepositDeadline && depositExpiresAt <= Date.now()
  const depositExpired =
    invoice.orderCancellationReason === 'DEPOSIT_PAYMENT_EXPIRED' ||
    invoice.status === 'OVERDUE' ||
    depositReachedDeadline ||
    expiredDeadlineKey === deadlineKey
  if (
    invoice.status === 'CANCELLED' ||
    invoice.status === 'REFUNDED' ||
    invoice.orderCancellationReason?.startsWith('CONTRACT_')
  )
    return null
 if (!isContractDepositReady(invoice)) return null
  if (invoice.status === 'PAID') {
    return (
      <div className="customer-invoice customer-invoice-actions">
        <div className="customer-deposit-notice is-ready">
          <b>{t.paymentCompleted}</b>
          <span>{t.paymentCompletedBody(formatVnd(invoice.paidAmount))}</span>
        </div>
      </div>
    )
  }
  const depositDue = Math.max(0, invoice.depositAmount - invoice.paidAmount)
  const depositPercent =
    invoice.totalAmount > 0
      ? Math.round((invoice.depositAmount / invoice.totalAmount) * 100)
      : 30
  const remainingAfterDeposit = Math.max(
    0,
    invoice.totalAmount - invoice.depositAmount,
  )
 return (
    <div className="customer-invoice customer-invoice-actions">
      {invoice.paidAmount < invoice.depositAmount && !depositExpired ? (
        <section
          className="customer-deposit-checkout-box"
          aria-label={t.currentPaymentDueEyebrow}
        >
          <span className="customer-deposit-checkout-eyebrow">
            {t.currentPaymentDueEyebrow}
          </span>
          <div className="customer-deposit-checkout-head">
            <strong>{t.depositItemTitle(depositPercent)}</strong>
            <span className="customer-deposit-checkout-amount">
              {formatVnd(depositDue)}
            </span>
          </div>
          <dl className="customer-deposit-checkout-breakdown">
            <div>
              <dt>{t.depositItemOrderTotal}</dt>
              <dd>{formatVnd(invoice.totalAmount)}</dd>
            </div>
            <div>
              <dt>{t.depositItemRemainingAfter}</dt>
              <dd>{formatVnd(remainingAfterDeposit)}</dd>
            </div>
          </dl>
          <p className="customer-deposit-checkout-note">
            {t.depositItemMilestoneNote}
          </p>
        </section>
      ) : null}
      {invoice.depositExpiresAt &&
      invoice.paidAmount < invoice.depositAmount ? (
        hasValidDepositDeadline ? (
          <DeadlineCountdown
            expired={depositExpired}
            label={depositExpired ? t.depositExpired : t.depositCountdownLabel}
            deadline={invoice.depositExpiresAt}
            startAt={Number.isFinite(Date.parse(depositStartAt)) ? depositStartAt : null}
            deadlineLabel={t.depositDeadlineAt(
              new Date(invoice.depositExpiresAt).toLocaleString(locale, {
                dateStyle: 'short',
                timeStyle: 'medium',
              }),
            )}
            dayLabel={t.dayUnit}
            hourLabel={t.hourUnit}
            minuteLabel={t.minuteUnit}
            secondLabel={t.secondUnit}
            clockLabel={t.clockLabel}
            onExpire={() => {
              setExpiredDeadlineKey(deadlineKey)
              refreshExpired?.()
            }}
          />
        ) : (
          <div className="customer-deposit-notice">
            <b>{t.depositDeadlineInvalid}</b>
          </div>
        )
      ) : null}
      {invoice.orderCancellationReason === 'DEPOSIT_PAYMENT_EXPIRED' ? (
        <div className="customer-deposit-notice">
          <b>{t.orderCancelledPaymentTimeout}</b>
        </div>
      ) : null}
      {invoice.paidAmount < invoice.depositAmount ? (
        <div className="customer-deposit-notice">
          <b>{t.awaitingDeposit}</b>
          <span>
            {invoice.contractRequired
              ? t.awaitingDepositContractBody
              : t.awaitingDepositBody}
          </span>
        </div>
      ) : handedOverCount > 0 ? (
        <div
          className={`customer-deposit-notice${unpaidHandedOverCount === 0 ? ' is-ready' : ''}`}
        >
          <b>
            {unpaidHandedOverCount > 0
              ? t.missionPaymentsReady
              : t.missionPaymentsHandedOverPaid}
          </b>
          <span>
            {unpaidHandedOverCount > 0
              ? t.missionPaymentsReadyBody
              : t.missionPaymentsHandedOverPaidBody}
          </span>
        </div>
      ) : (
        <div className="customer-deposit-notice">
          <b>{t.missionPreparation}</b>
          <span>{t.missionPreparationBody}</span>
        </div>
      )}
      <div className="finance-actions customer-payment-actions">
        {invoice.paidAmount < invoice.depositAmount &&
        legalReady &&
        !depositExpired ? (
          <>
            <Button
              type="primary"
              disabled={busy}
              onClick={() => void pay('deposit')}
            >
              {t.payDeposit}
            </Button>
            {env.testPaymentsEnabled ? (
              <Button
                disabled={busy}
                onClick={() => void completeTestDeposit()}
              >
                {testPaymentLabel}
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
