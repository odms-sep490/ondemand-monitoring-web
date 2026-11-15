import { ApiError } from '../../shared/api/httpClient'
import { errorMessage } from '../finance/ManagerPricing/pricingHelpers'
import { useState } from 'react'
import { Alert, Button } from 'antd'
import { useI18n } from '../../shared/i18n'
import { financeApi } from '../finance/api'
import type { Quote } from '../finance/types'
import { OrderContractPanel } from './OrderContractPanel'
import { contractMessages } from './contract.messages'

/** The persisted quote is frozen on screen while its immutable document is prepared. */
export function QuoteContractPreparation({
  orderId,
  quote,
  blockedReason,
  onSent,
  onEdit,
}: {
  orderId: string
  quote: Quote
  blockedReason?: string | null
  onSent: () => void
  onEdit: () => void
}) {
  const { t, locale } = useI18n(contractMessages)
  const [prepared, setPrepared] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const sent = quote.status === 'APPROVED'
  async function send() {
    if (!prepared || busy || sent || blockedReason) return
    setBusy(true)
    setError(null)
    try {
      await financeApi.approveQuote(orderId, quote.id)
      onSent()
    } catch (cause) {
      setError(cause)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="order-contract-preparation">
      <header className="order-contract-preparation__header">
        <div>
          <h2>{t.prepareQuote}</h2>
          <p>{sent ? t.sentHint : t.preparedHint}</p>
        </div>
        <div className="order-contract-preparation__amount">
          <span>{t.quoteAmount}</span>
          <strong>
            {new Intl.NumberFormat(locale, {
              style: 'currency',
              currency: 'VND',
            }).format(quote.totalAmount)}
          </strong>
        </div>
      </header>
      <OrderContractPanel
        embedded
        orderId={orderId}
        quoteId={quote.id}
        pricingRevision={quote.pricingRevision ?? 0}
        mode="manager"
        onPrepared={() => setPrepared(true)}
      />
      {blockedReason && (
        <Alert type="warning" showIcon message={blockedReason} />
      )}
      {error != null && (
        <Alert
          type="error"
          showIcon
          message={
            error instanceof ApiError && error.code && t.errors[error.code]
              ? t.errors[error.code]
              : errorMessage(error)
          }
        />
      )}
      <footer>
        <p className="order-contract-preparation__readiness" role="status">
          {sent ? t.sent : prepared ? t.readyToSend : t.saveBeforeSend}
        </p>
        <div className="order-contract-preparation__buttons">
          <Button disabled={busy} onClick={onEdit}>
            {t.editQuote}
          </Button>
          {!sent && (
            <Button
              type="primary"
              disabled={!prepared || busy || Boolean(blockedReason)}
              loading={busy}
              onClick={() => void send()}
            >
              {busy ? t.sending : t.sendTogether}
            </Button>
          )}
        </div>
      </footer>
    </section>
  )
}
