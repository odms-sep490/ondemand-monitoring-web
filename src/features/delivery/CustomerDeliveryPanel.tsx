import { Alert, Button, Descriptions, Input, Progress } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../shared/api/httpClient'
import { Modal } from '../customer/components/common/ui'
import { useI18n } from '../../shared/i18n'
import { formatVnd } from '../../shared/lib/formatVnd'
import { financeApi } from '../finance/api'
import { deliveryApi } from './api'
import { customerDeliveryPanelMessages } from './customerDeliveryPanel.messages'
import { DeliveryProgress, DeliveryStatusPill } from './DeliveryProgress'
import type { Delivery } from './types'
import './delivery.css'

export function CustomerDeliveryPanel({ orderId }: { orderId: string }) {
  const { t } = useI18n(customerDeliveryPanelMessages)
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [busy, setBusy] = useState(false)
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [reason, setReason] = useState('')

  const load = useCallback(async () => {
    try {
      const summary = await deliveryApi.get(orderId)
      const detailed =
        summary.deliveryStatus === 'DELIVERED'
          ? await deliveryApi.originals(orderId)
          : summary.previewReleasedAt
            ? await deliveryApi.previews(orderId)
            : summary
      setDelivery(detailed)
      setError(null)
    } catch (cause) {
      if (!(
        cause instanceof ApiError && [404, 409].includes(cause.status ?? 0)
      ))
        setError(cause)
    }
  }, [orderId])

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
  if (!delivery)
    return error ? (
      <Alert type="error" showIcon message={message(error, t)} />
    ) : null

  async function accept() {
    await act(() => deliveryApi.accept(orderId))
    setAcceptOpen(false)
  }
  async function revise() {
    if (!reason.trim()) {
      setError(t.reasonRequired)
      return
    }
    await act(() => deliveryApi.requestRevision(orderId, reason.trim(), []))
    setRevisionOpen(false)
    setReason('')
  }
  async function payFinal() {
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
  }
  async function act(action: () => Promise<Delivery>) {
    setBusy(true)
    setError(null)
    try {
      setDelivery(await action())
      await load()
    } catch (cause) {
      setError(cause)
    } finally {
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
      className="ui-card delivery-shell delivery-customer"
      aria-labelledby="delivery-title"
    >
      <header className="delivery-hero">
        <div className="delivery-hero__copy">
          <span className="delivery-eyebrow">{t.eyebrow}</span>
          <h2 id="delivery-title">{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
        <DeliveryStatusPill status={delivery.deliveryStatus} />
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
          <Descriptions
            className="delivery-payment"
            size="small"
            column={{ xs: 1, sm: 3 }}
            items={[
              {
                key: 't',
                label: t.total,
                children: <strong>{formatVnd(delivery.totalAmount)}</strong>,
              },
              {
                key: 'p',
                label: t.paid,
                children: (
                  <strong className="is-paid">
                    {formatVnd(delivery.paidAmount)}
                  </strong>
                ),
              },
              {
                key: 'r',
                label: t.remaining,
                children: (
                  <strong className="is-remaining">
                    {formatVnd(delivery.remainingAmount)}
                  </strong>
                ),
              },
            ]}
          />
        </section>

        {canReview ? (
          <div className="delivery-review-card">
            <div>
              <span className="delivery-review-card__icon" aria-hidden="true">
                ✓
              </span>
              <div>
                <b>{t.previewReady}</b>
                <span>{t.previewReadyText}</span>
              </div>
            </div>
            <div className="delivery-actions">
              <Button onClick={() => setRevisionOpen(true)} disabled={busy}>
                {t.requestRevision}
              </Button>
              <Button
                type="primary"
                className="delivery-primary-action"
                onClick={() => setAcceptOpen(true)}
                disabled={busy}
              >
                {busy ? t.confirming : t.accept}
              </Button>
            </div>
          </div>
        ) : null}
        {acceptOpen ? (
          <Modal
            title={t.acceptTitle}
            subtitle={t.acceptSubtitle}
            icon="shield"
            width={480}
            onClose={() => !busy && setAcceptOpen(false)}
            footer={
              <>
                <Button onClick={() => setAcceptOpen(false)} disabled={busy}>
                  {t.reviewAgain}
                </Button>
                <Button
                  type="primary"
                  onClick={() => void accept()}
                  disabled={busy}
                >
                  {busy ? t.confirming : t.acceptConfirm}
                </Button>
              </>
            }
          >
            <p>{t.acceptBody}</p>
            {error ? (
              <Alert type="error" showIcon message={message(error, t)} />
            ) : null}
          </Modal>
        ) : null}
        {revisionOpen ? (
          <div className="delivery-revision">
            <div className="delivery-field-head">
              <label htmlFor="revision-reason">
                {t.revisionLabel} <em>*</em>
              </label>
              <span>{reason.length}/2000</span>
            </div>
            <Input.TextArea
              id="revision-reason"
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={2000}
              placeholder={t.revisionPlaceholder}
              autoFocus
            />
            <div className="delivery-actions">
              <Button onClick={() => setRevisionOpen(false)}>{t.cancel}</Button>
              <Button
                type="primary"
                disabled={busy || !reason.trim()}
                onClick={() => void revise()}
              >
                {t.sendRequest}
              </Button>
            </div>
          </div>
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
            <Button
              type="primary"
              className="delivery-primary-action"
              disabled={busy}
              onClick={() => void payFinal()}
            >
              {busy ? t.redirecting : t.payVnpay}
            </Button>
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
          <Alert type="error" showIcon message={message(error, t)} />
        ) : null}
      </div>
    </section>
  )
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
