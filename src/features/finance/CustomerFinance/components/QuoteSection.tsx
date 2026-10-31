import { QuoteGuidance } from './QuoteGuidance'
import { Button } from 'antd'
import { useI18n } from '../../../../shared/i18n'
import { customerFinanceSectionsMessages } from '../CustomerFinanceSections.messages'
import { QuoteLines } from './QuoteLines'
import { Summary } from './Summary'
import type { CustomerQuote, Invoice } from '../../types'
import { useDeadline } from '../useDeadline'

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
  const { t } = useI18n(customerFinanceSectionsMessages)
  const acceptancePending = quote.status === 'APPROVED'
  const deadline = useDeadline(
    acceptancePending ? quote.expiresAt : null,
    refreshExpired,
  )
  const expired =
    quote.status === 'EXPIRED' || (acceptancePending && deadline.expired)
  return (
    <div className="customer-quote-body">
      <QuoteLines items={quote.items} />
      <QuoteGuidance quote={quote} />
      <dl className="finance-summary customer-summary">
        <Summary label={t.estimated} value={quote.estimatedBaseAmount} />
        <Summary
          label={t.additional}
          value={quote.approvedAdditionalServiceAmount}
        />
        <Summary label={t.orderTotal} value={quote.finalOrderAmount} total />
      </dl>
      <p className="co-estimate-notice">{t.estimateNotice}</p>
      {quote.expiresAt && (acceptancePending || quote.status === 'EXPIRED') ? (
        <div className={`finance-deadline${expired ? ' is-expired' : ''}`}>
          <b>
            {expired
              ? t.quoteExpired
              : t.quoteExpiresIn(deadline.remaining ?? '')}
          </b>
          <span>
            {t.deadlineAt(new Date(quote.expiresAt).toLocaleString())}
          </span>
        </div>
      ) : null}
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
        <Button type="primary" disabled={busy} onClick={() => void accept()}>
          {t.accept}
        </Button>
      ) : null}
    </div>
  )
}
