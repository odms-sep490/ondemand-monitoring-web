import { QuoteGuidance } from './QuoteGuidance'
import { Button } from 'antd'
import { useI18n } from '../../../../shared/i18n'
import { customerFinanceSectionsMessages } from '../CustomerFinanceSections.messages'
import { QuoteLines } from './QuoteLines'
import { Summary } from './Summary'
import type { CustomerQuote, Invoice } from '../../types'
import { useDeadline } from '../useDeadline'
import { OrderIcon } from '../../../manager/components/common/OrderIcon'

export function QuoteSection({
  quote,
  legalReady,
  legalStatus,
  invoice,
  busy,
  accept,
  refreshExpired,
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
}) {
  const { t, locale } = useI18n(customerFinanceSectionsMessages)
  const acceptancePending = quote.status === 'APPROVED'
  const deadline = useDeadline(
    acceptancePending ? quote.expiresAt : null,
    refreshExpired,
  )
  const expired =
    quote.status === 'EXPIRED' || (acceptancePending && deadline.expired)
  const approvedAt = quote.approvedAt
    ? Date.parse(quote.approvedAt)
    : Number.NaN
  const expiresAt = quote.expiresAt ? Date.parse(quote.expiresAt) : Number.NaN
  const hasValidExpiry = Number.isFinite(expiresAt)
  const remainingMs = expired ? 0 : deadline.remainingMs
  const remainingSeconds = Math.ceil((deadline.remainingMs ?? 0) / 1000)
  const countdownDays = Math.floor(remainingSeconds / 86_400)
  const countdownHours = Math.floor((remainingSeconds % 86_400) / 3_600)
  const countdownMinutes = Math.floor((remainingSeconds % 3_600) / 60)
  const countdownSeconds = remainingSeconds % 60
  const countdownText =
    deadline.remainingMs == null
      ? '—'
      : t.quoteCountdown(
          countdownDays,
          countdownHours,
          countdownMinutes,
          countdownSeconds,
        )
  const progress =
    Number.isFinite(approvedAt) &&
    Number.isFinite(expiresAt) &&
    expiresAt > approvedAt &&
    remainingMs != null
      ? Math.max(0, Math.min(1, 1 - remainingMs / (expiresAt - approvedAt)))
      : null
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
          <section
            className="customer-quote-summary-section"
            aria-label={t.summaryLabel}
          >
            <h3>{t.summaryLabel}</h3>
            <dl className="finance-summary customer-summary">
              <Summary label={t.estimated} value={quote.estimatedBaseAmount} />
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
        </div>

        <aside className="customer-quote-actions" aria-label={t.actionsLabel}>
          {quote.expiresAt &&
          hasValidExpiry &&
          (acceptancePending || quote.status === 'EXPIRED') ? (
            <div
              className={`customer-quote-countdown${expired ? ' is-expired' : ''}`}
            >
              <div className="customer-quote-countdown-ring" aria-hidden="true">
                <svg viewBox="0 0 84 84" focusable="false">
                  <circle
                    className="customer-quote-ring-track"
                    cx="42"
                    cy="42"
                    r="35"
                  />
                  {progress != null ? (
                    <circle
                      className="customer-quote-ring-progress"
                      cx="42"
                      cy="42"
                      r="35"
                      style={{ strokeDashoffset: 220 * (1 - progress) }}
                    />
                  ) : null}
                </svg>
                <span className="customer-quote-ring-icon">
                  <OrderIcon name="clock" size={30} />
                </span>
              </div>
              <div>
                <span className="customer-quote-countdown-label">
                  {expired ? t.quoteExpired : t.quoteExpiresLabel}
                </span>
                {!expired ? <strong>{countdownText}</strong> : null}
                <small>
                  {t.deadlineAt(
                    new Date(quote.expiresAt).toLocaleString(locale),
                  )}
                </small>
              </div>
            </div>
          ) : null}

          {quote.status === 'ACCEPTED_BY_CUSTOMER' ? (
            <div className="customer-quote-state is-accepted">
              <strong>{t.quoteAccepted}</strong>
              {quote.acceptedAt ? (
                <span>
                  {t.acceptedAt(
                    new Date(quote.acceptedAt).toLocaleString(locale),
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
