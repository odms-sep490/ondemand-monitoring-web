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
  const depositStatus = invoice.depositStatus ??
    (invoice.paidAmount >= invoice.depositAmount ? 'DEPOSIT_PAID' : 'WAITING_DEPOSIT')

  return (
    <section
      className="customer-invoice-summary"
      aria-label={t.invoice(invoice.invoiceNumber)}
    >
      <div className="customer-invoice-summary-title">
        <h3>{t.invoice(invoice.invoiceNumber)}</h3>
        <StatusTag tone={INVOICE_TONE[invoice.status] ?? 'neutral'}>
          {t.invoiceStatus[invoice.status] ?? pricingLabel(invoice.status)}
        </StatusTag>
        {invoice.status !== 'CANCELLED' && invoice.status !== 'REFUNDED' ? (
          <StatusTag tone={depositStatus === 'DEPOSIT_PAID' ? 'success' : 'warning'}>
            {t.depositPaymentStatus[depositStatus]}
          </StatusTag>
        ) : null}
      </div>
      <div className="customer-payment-stats">
        <PaymentStat label={t.total} value={invoice.totalAmount} />
        <PaymentStat label={t.deposit} value={invoice.depositAmount} />
        <PaymentStat label={t.paid} value={invoice.paidAmount} />
        <PaymentStat label={t.remaining} value={invoice.remainingAmount} />
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
  completeTestFinal,
  testPaymentLabel,
  refreshExpired,
}: {
  invoice: Invoice
  legalReady: boolean
  busy: boolean
  pay: (type: 'deposit' | 'final') => Promise<void>
  completeTestDeposit: () => Promise<void>
  completeTestFinal: () => Promise<void>
  testPaymentLabel: string
  refreshExpired?: () => void
}) {
  const { t, locale } = useI18n(customerFinanceSectionsMessages)
  const [expiredDeadlineKey, setExpiredDeadlineKey] = useState<string | null>(
    null,
  )
  const deadlineKey = `${invoice.id}:${invoice.depositExpiresAt ?? ''}`
  const depositIssuedAt = Date.parse(invoice.issuedAt)
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
  return (
    <div className="customer-invoice customer-invoice-actions">
      {invoice.depositExpiresAt &&
      invoice.paidAmount < invoice.depositAmount ? (
        hasValidDepositDeadline ? (
          <DeadlineCountdown
            expired={depositExpired}
            label={depositExpired ? t.depositExpired : t.depositCountdownLabel}
            deadline={invoice.depositExpiresAt}
            startAt={Number.isFinite(depositIssuedAt) ? invoice.issuedAt : null}
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
          <span>{t.awaitingDepositBody}</span>
        </div>
      ) : invoice.status !== 'PAID' ? (
        <div className="customer-deposit-notice is-ready">
          <b>{t.depositReceived}</b>
          <span>{t.depositReceivedBody}</span>
        </div>
      ) : null}
      <div className="finance-actions customer-payment-actions">
        {invoice.paidAmount < invoice.depositAmount &&
        legalReady &&
        !depositExpired &&
        invoice.status !== 'CANCELLED' ? (
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
        {invoice.finalPaymentAllowed &&
        invoice.paidAmount >= invoice.depositAmount &&
        invoice.remainingAmount > 0 ? (
          <>
            <Button
              type="primary"
              disabled={busy}
              onClick={() => void pay('final')}
            >
              {t.payRemaining}
            </Button>
            {env.testPaymentsEnabled ? (
              <Button disabled={busy} onClick={() => void completeTestFinal()}>
                {testPaymentLabel}
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
