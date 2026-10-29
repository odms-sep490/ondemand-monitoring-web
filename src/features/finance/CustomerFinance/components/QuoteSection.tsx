import { Alert, Button } from 'antd'
import { useI18n } from '../../../../shared/i18n'
import { customerFinanceSectionsMessages } from '../CustomerFinanceSections.messages'
import { QuoteLines } from './QuoteLines'
import { Summary } from './Summary'
import type { CustomerQuote, Invoice } from '../../types'

export function QuoteSection({
  quote,
  legalReady,
  legalStatus,
  invoice,
  busy,
  accept,
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
}) {
  const { t } = useI18n(customerFinanceSectionsMessages)
  return (
    <div className="customer-quote-body">
      <QuoteLines items={quote.items} />
      <dl className="finance-summary customer-summary">
        <Summary label={t.estimated} value={quote.estimatedBaseAmount} />
        <Summary
          label={t.additional}
          value={quote.approvedAdditionalServiceAmount}
        />
        <Summary label={t.orderTotal} value={quote.finalOrderAmount} total />
      </dl>
      <p className="co-estimate-notice">{t.estimateNotice}</p>
      {!legalReady ? (
        <Alert
          className="customer-deposit-notice"
          type={legalStatus === 'REJECTED' ? 'error' : 'warning'}
          showIcon
          message={
            legalStatus === 'REJECTED'
              ? t.legalRejectedTitle
              : t.legalCheckingTitle
          }
          description={
            legalStatus === 'REJECTED'
              ? t.legalRejectedBody
              : t.legalCheckingBody
          }
        />
      ) : legalStatus === 'PENDING_PERMIT' ? (
        <Alert
          className="customer-deposit-notice"
          type="info"
          showIcon
          message={t.permitTitle}
          description={t.permitBody}
        />
      ) : null}
      {quote.status === 'APPROVED' && !invoice && legalReady ? (
        <Button type="primary" disabled={busy} onClick={() => void accept()}>
          {t.accept}
        </Button>
      ) : null}
    </div>
  )
}
