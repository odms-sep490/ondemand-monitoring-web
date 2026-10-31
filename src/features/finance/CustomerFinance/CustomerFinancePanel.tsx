import { Alert, Button } from 'antd'
import { ApiError } from '../../../shared/api/httpClient'
import { guidanceMessages } from '../ManagerPricing/guidance.messages'
import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../../../shared/i18n'
import { financeApi } from '../api'
import { customerFinancePanelMessages } from './CustomerFinancePanel.messages'
import type { CustomerQuote, Invoice } from '../types'
import '../finance.css'
import { CardComponent } from '../../../shared/components/antd'
import { OrderIcon } from '../../manager/components/common/OrderIcon'
import { isNotFound, messageOf } from './customerFinanceHelpers'
import { QuoteSection } from './components/QuoteSection'
import { InvoiceSection } from './components/InvoiceSection'

export type CustomerFinanceState = {
  quote: CustomerQuote | null
  invoice: Invoice | null
  loading: boolean
}

export function CustomerFinancePanel({
  orderId,
  legalStatus,
  onStateChange,
  refreshKey,
}: {
  orderId: string
  legalStatus?:
    'NOT_REVIEWED' | 'NOT_REQUIRED' | 'PENDING_PERMIT' | 'APPROVED' | 'REJECTED'
  onStateChange?: (state: CustomerFinanceState) => void
  refreshKey?: number | string
}) {
  const legalReady =
    legalStatus == null ||
    legalStatus === 'NOT_REQUIRED' ||
    legalStatus === 'APPROVED' ||
    legalStatus === 'PENDING_PERMIT'
  const { t } = useI18n(customerFinancePanelMessages)
  const { t: g } = useI18n(guidanceMessages)
  const [quoteStale, setQuoteStale] = useState(false)
  const [quote, setQuote] = useState<CustomerQuote | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setQuoteStale(false)
    setError(null)
    const [quoteResult, invoiceResult] = await Promise.allSettled([
      financeApi.getQuote(orderId),
      financeApi.getInvoice(orderId),
    ])
    if (quoteResult.status === 'fulfilled') setQuote(quoteResult.value)
    else if (isNotFound(quoteResult.reason)) setQuote(null)
    else {
      setQuote(null)
      setError(messageOf(quoteResult.reason, t))
    }
    if (invoiceResult.status === 'fulfilled') setInvoice(invoiceResult.value)
    else if (isNotFound(invoiceResult.reason)) setInvoice(null)
    else setError(messageOf(invoiceResult.reason, t))
    setLoading(false)
  }, [orderId, refreshKey, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    onStateChange?.({ quote, invoice, loading })
  }, [invoice, loading, onStateChange, quote])

  async function accept() {
    if (!quote || quoteStale) return
    setBusy(true)
    setError(null)
    try {
      setInvoice(await financeApi.acceptQuote(orderId, quote.id))
      await load()
    } catch (cause) {
      setError(messageOf(cause, t))
      if (cause instanceof ApiError && cause.status === 409) setQuoteStale(true)
    } finally {
      setBusy(false)
    }
  }

  async function pay(type: 'deposit' | 'final') {
    if (!invoice) return
    setBusy(true)
    setError(null)
    try {
      const payment =
        type === 'deposit'
          ? await financeApi.createDeposit(invoice.id)
          : await financeApi.createFinalPayment(invoice.id)
      if (!payment.paymentUrl) throw new Error(t.missingPaymentUrl)
      window.location.assign(payment.paymentUrl)
    } catch (cause) {
      setError(messageOf(cause, t))
      setBusy(false)
    }
  }

  async function completeTestPayment(type: 'deposit' | 'final') {
    if (!invoice) return
    setBusy(true)
    setError(null)
    try {
      if (type === 'deposit') await financeApi.completeTestDeposit(invoice.id)
      else await financeApi.completeTestFinal(invoice.id)
      await load()
    } catch (cause) {
      setError(messageOf(cause, t))
    } finally {
      setBusy(false)
    }
  }

  if (loading && !quote && !invoice)
    return (
      <CardComponent
        className="customer-finance-card"
        title={t.title}
        icon={<OrderIcon name="tag" size={16} />}
      >
        <p className="customer-finance-desc">{t.loading}</p>
      </CardComponent>
    )
  if (!quote && !invoice && !error)
    return (
      <CardComponent
        className="customer-finance-card"
        title={t.title}
        icon={<OrderIcon name="tag" size={16} />}
      >
        <p className="customer-finance-desc">{t.noFinancialData}</p>
      </CardComponent>
    )

  return (
    <CardComponent
      className="customer-finance-card"
      title={t.title}
      icon={<OrderIcon name="tag" size={16} />}
      extra={
        quote ? (
          <span className="finance-status">
            {t.quoteVersion(quote.version)}
          </span>
        ) : null
      }
    >
      <p className="customer-finance-desc">{t.description}</p>

      {quote ? (
        <QuoteSection
          quote={quote}
          legalReady={legalReady}
          legalStatus={legalStatus}
          invoice={invoice}
          busy={busy || quoteStale}
          accept={accept}
          refreshExpired={() => void load()}
        />
      ) : null}

      {invoice ? (
        <InvoiceSection
          invoice={invoice}
          legalReady={legalReady}
          busy={busy}
          pay={pay}
          completeTestDeposit={() => completeTestPayment('deposit')}
          completeTestFinal={() => completeTestPayment('final')}
          testPaymentLabel={t.testPayment}
          refreshExpired={() => void load()}
        />
      ) : null}
      {quoteStale ? (
        <Button disabled={busy || loading} onClick={() => void load()}>
          {g.reload}
        </Button>
      ) : null}
      {error ? (
        <Alert
          className="finance-alert-box"
          type="error"
          showIcon
          message={error}
        />
      ) : null}
    </CardComponent>
  )
}
