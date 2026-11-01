import { useState, type ReactNode } from 'react'
import { QuoteGuidance } from './QuoteGuidance'
import { Button } from 'antd'
import { useI18n } from '../../../../shared/i18n'
import { customerFinanceSectionsMessages } from '../CustomerFinanceSections.messages'
import { QuoteLines } from './QuoteLines'
import { Summary } from './Summary'
import { DeadlineCountdown } from './DeadlineCountdown'
import type { CustomerQuote, Invoice } from '../../types'
import { OrderIcon } from '../../../manager/components/common/OrderIcon'

export function QuoteSection({
  quote,
  legalReady,
  legalStatus,
  invoice,
  busy,
  accept,
  refreshExpired,
  paymentContent,
  paymentSummaryContent,
}: {
  quote: CustomerQuote
  legalReady: boolean
  legalStatus:
    | 'NOT_REVIEWED'
    | 'NOT_REQUIRED'
    | 'PENDING_PERMIT'
    | 'APPROVED'
    | 'REJECTED'
    | undefined
  invoice: Invoice | null
  busy: boolean
  accept: () => Promise<void>
  refreshExpired?: () => void
  paymentContent?: ReactNode
  paymentSummaryContent?: ReactNode
}) {
  const { t, locale } = useI18n(customerFinanceSectionsMessages)
  const acceptancePending = quote.status === 'APPROVED'
  const [expiredDeadlineKey, setExpiredDeadlineKey] = useState<string | null>(
    null,
  )
  const deadlineKey = `${quote.id}:${quote.version}:${quote.expiresAt ?? ''}`
  const approvedAt = quote.approvedAt
    ? Date.parse(quote.approvedAt)
    : Number.NaN
  const expiresAt = quote.expiresAt ? Date.parse(quote.expiresAt) : Number.NaN
  const hasValidExpiry = Number.isFinite(expiresAt)
  const deadlineReached = hasValidExpiry && expiresAt <= Date.now()
  const expired =
    quote.status === 'EXPIRED' ||
    (acceptancePending &&
      (deadlineReached || expiredDeadlineKey === deadlineKey))
  return (
    <div className="customer-quote-body">
      <div className="customer-quote-layout">
        <div className="customer-quote-main">
          <section
            className="customer-quote-services"
            aria-label={t.serviceColumn}
          >
            <div className="customer-quote-table-head" aria-hidden="true">
              <span>{t.serviceColumn}</span>
              <span>{t.priceColumn}</span>
              <span>{t.priceDetails}</span>
            </div>
            <QuoteLines items={quote.items} />
          </section>
          <QuoteGuidance quote={quote} />
          <div className="customer-quote-financial-summary">
            <section
              className="customer-quote-summary-section"
              aria-label={t.summaryLabel}
            >
              <h3>{t.summaryLabel}</h3>
              <dl className="finance-summary customer-summary">
                <Summary
                  label={t.estimated}
                  value={quote.estimatedBaseAmount}
                />
                <Summary
                  label={t.additional}
                  value={quote.approvedAdditionalServiceAmount}
                />
                <Summary
                  label={t.orderTotal}
                  value={quote.finalOrderAmount}
                  total
                />
              </dl>
            </section>
            {paymentSummaryContent ? (
              <div className="customer-quote-payment-summary">
                {paymentSummaryContent}
              </div>
            ) : null}
          </div>
        </div>

        <aside className="customer-quote-actions" aria-label={t.actionsLabel}>
          {quote.expiresAt &&
          hasValidExpiry &&
          (acceptancePending || quote.status === 'EXPIRED') ? (
            <DeadlineCountdown
              expired={expired}
              label={expired ? t.quoteExpired : t.quoteExpiresLabel}
              deadline={quote.expiresAt}
              startAt={Number.isFinite(approvedAt) ? quote.approvedAt : null}
              deadlineLabel={t.quoteDeadlineAt(
                new Date(quote.expiresAt).toLocaleString(locale, {
                  dateStyle: 'short',
                  timeStyle: 'medium',
                }),
              )}
              dayLabel={t.dayUnit}
              hourLabel={t.hourUnit}
              minuteLabel={t.minuteUnit}
              secondLabel={t.secondUnit}
              clockLabel={t.clockLabel}
              onExpire={
                acceptancePending
                  ? () => {
                      setExpiredDeadlineKey(deadlineKey)
                      refreshExpired?.()
                    }
                  : undefined
              }
            />
          ) : null}

          {quote.status === 'ACCEPTED_BY_CUSTOMER' ? (
            <div className="customer-quote-state is-accepted">
              <strong>{t.quoteAccepted}</strong>
              {quote.acceptedAt ? (
                <span>
                  {t.acceptedAt(
                    new Date(quote.acceptedAt).toLocaleString(locale, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }),
                  )}
                </span>
              ) : null}
            </div>
          ) : null}
          {acceptancePending && !hasValidExpiry ? (
            <div className="customer-quote-state">
              <strong>{t.noQuoteDeadline}</strong>
            </div>
          ) : null}

          <p className="co-estimate-notice">{t.estimateNotice}</p>
          {quote.orderCancellationReason === 'QUOTATION_EXPIRED' ? (
            <div className="customer-deposit-notice">
              <b>{t.orderCancelledQuoteTimeout}</b>
            </div>
          ) : null}
          {!legalReady ? (
            <div className="customer-deposit-notice">
              <b>
                {legalStatus === 'REJECTED'
                  ? t.legalRejectedTitle
                  : t.legalCheckingTitle}
              </b>
              <span>
                {legalStatus === 'REJECTED'
                  ? t.legalRejectedBody
                  : t.legalCheckingBody}
              </span>
            </div>
          ) : legalStatus === 'PENDING_PERMIT' ? (
            <div className="customer-deposit-notice">
              <b>{t.permitTitle}</b>
              <span>{t.permitBody}</span>
            </div>
          ) : null}
          {paymentContent ? (
            <div className="customer-quote-payment-content">
              {paymentContent}
            </div>
          ) : null}
          {quote.status === 'APPROVED' && !invoice && legalReady && !expired ? (
            <Button
              type="primary"
              disabled={busy}
              onClick={() => void accept()}
            >
              <OrderIcon name="check" size={16} />
              {t.accept}
            </Button>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
