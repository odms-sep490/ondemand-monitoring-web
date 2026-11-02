import { Alert, Button, Empty, Progress, Skeleton } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../shared/api/httpClient'
import { useI18n } from '../../shared/i18n'
import { formatVnd } from '../../shared/lib/formatVnd'
import { financeApi } from '../finance/api'
import { deliveryApi } from './api'
import { customerDeliveryPanelMessages } from './customerDeliveryPanel.messages'
import { CustomerResultReview } from './CustomerResultReview'
import { DeliveryProgress, DeliveryStatusPill } from './DeliveryProgress'
import type { Delivery, DeliveryPanelLoadState } from './types'
import './delivery.css'
import { env } from '../../config/env'

export function CustomerDeliveryPanel({
  orderId,
  initialDelivery = null,
  onStateChange,
  onFinalPaymentActionChange,
}: {
  orderId: string
  initialDelivery?: Delivery | null
  onStateChange?: (
    delivery: Delivery | null,
    state: DeliveryPanelLoadState,
  ) => void
  onFinalPaymentActionChange?: (action: (() => Promise<void>) | null) => void
}) {
  const { t } = useI18n(customerDeliveryPanelMessages)
  const [delivery, setDelivery] = useState<Delivery | null>(initialDelivery)
  const [loadState, setLoadState] = useState<DeliveryPanelLoadState>(
    initialDelivery ? 'ready' : 'loading',
  )
  const [busy, setBusy] = useState(false)
  const [testPaying, setTestPaying] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [submittedTicket, setSubmittedTicket] = useState<{
    id: string
    code: string
  } | null>(null)

  const payFinal = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const invoice = await financeApi.getInvoice(orderId)
      const payment = await financeApi.createFinalPayment(invoice.id)
      if (!payment.paymentUrl) throw new Error(t.noVnpayUrl)
      window.location.assign(payment.paymentUrl)
    } catch (cause) {
      setError(cause)
      setBusy(false)
    }
  }, [orderId, t.noVnpayUrl])

  const load = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setLoadState('loading')
        setError(null)
      }
      try {
        const summary = await deliveryApi.get(orderId)
        let detailed = summary
        try {
          if (summary.deliveryStatus === 'DELIVERED') {
            detailed = await deliveryApi.originals(orderId)
          } else if (summary.previewReleasedAt) {
            detailed = await deliveryApi.previews(orderId)
          }
        } catch (cause) {
          // Keep the real summary status visible if the optional asset endpoint
          // has no files for this delivery state yet.
          if (!isNotReady(cause)) throw cause
        }
        setDelivery(detailed)
        setLoadState('ready')
        setError(null)
      } catch (cause) {
        if (isNotReady(cause)) {
          setDelivery(null)
          setLoadState('unavailable')
          setError(null)
          return
        }
        setLoadState('error')
        setError(cause)
      }
    },
    [orderId],
  )

  useEffect(() => {
    void load()
    const interval = window.setInterval(() => void load(), 15_000)
    const refreshWhenVisible = () =>
      document.visibilityState === 'visible' && void load()
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [load])

  useEffect(() => {
    onStateChange?.(delivery, loadState)
  }, [delivery, loadState, onStateChange])

  useEffect(() => {
    onFinalPaymentActionChange?.(
      delivery?.deliveryStatus === 'FINAL_PAYMENT_PENDING' ? payFinal : null,
    )
    return () => onFinalPaymentActionChange?.(null)
  }, [delivery?.deliveryStatus, onFinalPaymentActionChange, payFinal])

  if (!delivery) {
    return (
      <section
        id="customer-delivery-panel"
        className="ui-card delivery-shell delivery-customer delivery-empty-state"
        aria-labelledby="delivery-title"
        aria-busy={loadState === 'loading'}
        tabIndex={-1}
      >
        <header className="delivery-hero">
          <div className="delivery-hero__copy">
            <span className="delivery-eyebrow">{t.eyebrow}</span>
            <h2 id="delivery-title">{t.title}</h2>
            <p>{t.subtitle}</p>
          </div>
        </header>
        {loadState === 'loading' ? (
          <div className="delivery-empty-state__body" role="status">
            <Skeleton active paragraph={{ rows: 2 }} />
            <span className="odm-visually-hidden">{t.loading}</span>
          </div>
        ) : loadState === 'unavailable' ? (
          <div className="delivery-empty-state__body">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t.noDelivery}
            />
          </div>
        ) : (
          <div className="delivery-empty-state__body">
            <Alert
              type="error"
              showIcon
              message={message(error, t)}
              action={
                <Button type="link" onClick={() => void load(true)}>
                  {t.retry}
                </Button>
              }
            />
          </div>
        )}
      </section>
    )
  }

  async function completeTestFinal() {
    if (busy) return
    setBusy(true)
    setTestPaying(true)
    setError(null)
    try {
      const invoice = await financeApi.getInvoice(orderId)
      await financeApi.completeTestFinal(invoice.id)
      await load()
    } catch (cause) {
      setError(cause)
    } finally {
      setTestPaying(false)
      setBusy(false)
    }
  }
  const canReview = delivery.deliveryStatus === 'CUSTOMER_REVIEW'
  const paymentPercent =
    delivery.totalAmount > 0
      ? Math.min(
          100,
          Math.round((delivery.paidAmount / delivery.totalAmount) * 100),
        )
      : 0

  return (
    <section
      id="customer-delivery-panel"
      className="ui-card delivery-shell delivery-customer"
      aria-labelledby="delivery-title"
      aria-busy={loadState === 'loading'}
      tabIndex={-1}
    >
      <header className="delivery-hero">
        <div className="delivery-hero__copy">
          <span className="delivery-eyebrow">{t.eyebrow}</span>
          <h2 id="delivery-title">{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
        <span role="status" aria-live="polite">
          <DeliveryStatusPill status={delivery.deliveryStatus} />
        </span>
      </header>
      <DeliveryProgress status={delivery.deliveryStatus} />
      <div className="delivery-content">
        {delivery.assets.length > 0 ? (
          <section
            className="delivery-section"
            aria-labelledby="customer-assets-title"
          >
            <div className="delivery-section__head">
              <div>
                <h3 id="customer-assets-title">
                  {delivery.deliveryStatus === 'DELIVERED'
                    ? t.originals
                    : t.previews}
                </h3>
                <p>
                  {delivery.deliveryStatus === 'DELIVERED'
                    ? t.filesReady(delivery.assets.length)
                    : t.filesCheck(delivery.assets.length)}
                </p>
              </div>
              <span
                className={`delivery-access-badge${delivery.deliveryStatus === 'DELIVERED' ? ' is-original' : ''}`}
              >
                {delivery.deliveryStatus === 'DELIVERED'
                  ? t.badgeOriginal
                  : t.badgePreview}
              </span>
            </div>
            <div className="delivery-grid">
              {delivery.assets.map((asset) => (
                <article key={asset.id} className="delivery-asset">
                  {asset.type.toUpperCase().includes('VIDEO') ? (
                    <video controls preload="metadata" src={asset.url} />
                  ) : (
                    <img src={asset.url} alt={asset.fileName} loading="lazy" />
                  )}
                  <div className="delivery-asset__meta">
                    <strong title={asset.fileName}>{asset.fileName}</strong>
                    <small>
                      {asset.type.toUpperCase().includes('VIDEO')
                        ? t.video
                        : t.image}{' '}
                      · {formatBytes(asset.size, t.unknownSize)}
                    </small>
                  </div>
                  {asset.downloadable ? (
                    <Button
                      className="delivery-download"
                      href={asset.url}
                      download
                    >
                      {t.download}
                    </Button>
                  ) : (
                    <span className="delivery-preview-note">
                      {t.previewNote}
                    </span>
                  )}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {delivery.assets.length === 0 ? (
          <div className="delivery-empty-state__body" role="status">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t.noAssets}
            />
          </div>
        ) : null}

        {delivery.deliveryNotes ? (
          <div className="delivery-manager-note">
            <span>{t.managerNote}</span>
            <p>{delivery.deliveryNotes}</p>
          </div>
        ) : null}
        <section
          className="delivery-payment-card"
          aria-labelledby="payment-summary-title"
        >
          <div className="delivery-payment-card__head">
            <div>
              <span className="delivery-eyebrow">{t.payment}</span>
              <h3 id="payment-summary-title">{t.costOverview}</h3>
            </div>
            <strong>{paymentPercent}%</strong>
          </div>
          <Progress
            percent={paymentPercent}
            showInfo={false}
            aria-label={t.paidPercent(paymentPercent)}
          />
          <div className="delivery-payment">
            <div>
              <span>{t.total}</span>
              <strong>{formatVnd(delivery.totalAmount)}</strong>
            </div>
            <div>
              <span>{t.paid}</span>
              <strong className="is-paid">
                {formatVnd(delivery.paidAmount)}
              </strong>
            </div>
            <div className="is-remaining">
              <span>{t.remaining}</span>
              <strong>{formatVnd(delivery.remainingAmount)}</strong>
            </div>
          </div>
        </section>

        {submittedTicket ? (
          <Alert
            type="success"
            showIcon
            message={t.revisionSentTitle}
            description={
              <a
                href={`#help/tickets/${encodeURIComponent(submittedTicket.id)}`}
              >
                {t.viewSubmittedTicket(submittedTicket.code)}
              </a>
            }
          />
        ) : null}
        {canReview ? (
          <CustomerResultReview
            orderId={orderId}
            onComplete={() => void load()}
            onSubmitted={setSubmittedTicket}
          />
        ) : null}

        {delivery.deliveryStatus === 'PROCESSING' ? (
          <StatusBanner title={t.processingTitle} text={t.processingText} />
        ) : null}
        {delivery.deliveryStatus === 'READY_FOR_MANAGER_REVIEW' ? (
          <StatusBanner
            title={t.managerReviewTitle}
            text={t.managerReviewText}
          />
        ) : null}
        {delivery.deliveryStatus === 'REVISION_REQUESTED' ? (
          <StatusBanner
            tone="warning"
            title={t.revisionSentTitle}
            text={t.revisionSentText}
          />
        ) : null}
        {delivery.deliveryStatus === 'FINAL_PAYMENT_PENDING' ? (
          <div className="delivery-payment-action">
            <div>
              <span
                className="delivery-payment-action__icon"
                aria-hidden="true"
              >
                ₫
              </span>
              <div>
                <b>{t.payToGet}</b>
                <span>
                  {t.amountLeft}:{' '}
                  <strong>{formatVnd(delivery.remainingAmount)}</strong>
                </span>
              </div>
            </div>
            <div className="delivery-actions">
              <Button
                type="primary"
                className="delivery-primary-action"
                disabled={busy}
                onClick={() => void payFinal()}
              >
                {busy && !testPaying ? t.redirecting : t.payVnpay}
              </Button>
              {env.testPaymentsEnabled ? (
                <Button
                  disabled={busy}
                  loading={testPaying}
                  onClick={() => void completeTestFinal()}
                >
                  {t.testPayment}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
        {delivery.deliveryStatus === 'READY_FOR_DELIVERY' ||
        delivery.deliveryStatus === 'PAYMENT_CONFIRMED' ? (
          <StatusBanner
            tone="success"
            title={t.paymentConfirmedTitle}
            text={t.paymentConfirmedText}
          />
        ) : null}
        {delivery.deliveryStatus === 'DELIVERED' ? (
          <StatusBanner
            tone="success"
            title={t.deliveredTitle}
            text={t.deliveredText(delivery.assets.length)}
          />
        ) : null}
        {error ? (
          <Alert
            type="error"
            showIcon
            message={message(error, t)}
            action={
              <Button type="link" onClick={() => void load(true)}>
                {t.retry}
              </Button>
            }
          />
        ) : null}
      </div>
    </section>
  )
}

function isNotReady(cause: unknown) {
  return cause instanceof ApiError && [404, 409].includes(cause.status ?? 0)
}

function StatusBanner({
  title,
  text,
  tone = 'info',
}: {
  title: string
  text: string
  tone?: 'info' | 'warning' | 'success'
}) {
  return <Alert type={tone} showIcon message={title} description={text} />
}

function formatBytes(bytes: number, unknown: string) {
  if (!Number.isFinite(bytes) || bytes <= 0) return unknown
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function message(
  cause: unknown,
  t: { networkError: string; genericError: string },
) {
  if (typeof cause === 'string') return cause
  if (cause instanceof ApiError && cause.code === 'NETWORK_ERROR')
    return t.networkError
  return cause instanceof Error ? cause.message : t.genericError
}
