import { Button, useConfirm, useToast } from '../../shared/components/ui'
import { useI18n } from '../../shared/i18n'
import { managerDeliveryFeedbackMessages } from './managerDelivery.messages'
import { managerDeliveryPanelMessages } from './managerDeliveryPanel.messages'
import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../shared/api/httpClient'
import { deliveryApi } from './api'
import { DeliveryProgress, DeliveryStatusPill } from './DeliveryProgress'
import type { Delivery } from './types'
import './delivery.css'

export function ManagerDeliveryPanel({
  orderId,
  refreshKey = 0,
}: {
  orderId: string
  refreshKey?: number
}) {
  const { t: fb } = useI18n(managerDeliveryFeedbackMessages)
  const { t } = useI18n(managerDeliveryPanelMessages)
  const toast = useToast()
  const confirm = useConfirm()
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const value = await deliveryApi.managerGet(orderId)
      setDelivery(value)
      setSelected(value.assets.map((asset) => asset.id))
      setError(null)
    } catch (cause) {
      if (!(
        cause instanceof ApiError && [404, 409].includes(cause.status ?? 0)
      ))
        setError(cause instanceof Error ? cause.message : t.loadFailed)
    }
  }, [orderId, refreshKey, t])

  useEffect(() => void load(), [load])
  if (!delivery)
    return error ? (
      <p className="delivery-error" role="alert">
        {error}
      </p>
    ) : null

  async function run(action: () => Promise<Delivery>, successMessage?: string) {
    setBusy(true)
    setError(null)
    try {
      setDelivery(await action())
      await load()
      if (successMessage) toast.success(successMessage)
    } catch (cause) {
      const failure = cause instanceof Error ? cause.message : t.actionFailed
      setError(failure)
      toast.error(failure)
    } finally {
      setBusy(false)
    }
  }

  const canReleasePreview = [
    'READY_FOR_MANAGER_REVIEW',
    'REVISION_REQUESTED',
  ].includes(delivery.deliveryStatus)
  const allSelected =
    delivery.assets.length > 0 && selected.length === delivery.assets.length

  return (
    <section
      className="odm-or-card delivery-shell delivery-manager"
      aria-labelledby="manager-delivery-title"
    >
      <header className="delivery-hero">
        <div className="delivery-hero__copy">
          <span className="delivery-eyebrow">{t.eyebrow}</span>
          <h2 id="manager-delivery-title">{t.title}</h2>
          <p>{t.intro}</p>
        </div>
        <DeliveryStatusPill status={delivery.deliveryStatus} />
      </header>
      <DeliveryProgress status={delivery.deliveryStatus} />
      <div className="delivery-content">
        {delivery.revisionReason ? (
          <StatusBanner
            tone="warning"
            title={t.revisionTitle}
            text={delivery.revisionReason}
          />
        ) : null}
        {delivery.deliveryStatus === 'PROCESSING' ? (
          <StatusBanner title={t.processingTitle} text={t.processingText} />
        ) : null}
        {canReleasePreview && delivery.assets.length === 0 ? (
          <StatusBanner
            tone="warning"
            title={t.noMediaTitle}
            text={t.noMediaText}
          />
        ) : null}

        {delivery.assets.length > 0 ? (
          <section
            className="delivery-section"
            aria-labelledby="manager-assets-title"
          >
            <div className="delivery-section__head">
              <div>
                <h3 id="manager-assets-title">{t.mediaHeading}</h3>
                <p>
                  {t.selectedCount(selected.length, delivery.assets.length)}
                </p>{' '}
              </div>
              {canReleasePreview ? (
                <button
                  type="button"
                  className="delivery-text-button"
                  onClick={() =>
                    setSelected(
                      allSelected
                        ? []
                        : delivery.assets.map((asset) => asset.id),
                    )
                  }
                >
                  {allSelected ? t.deselectAll : t.selectAll}
                </button>
              ) : null}
            </div>
            <div className="delivery-grid">
              {delivery.assets.map((asset, index) => {
                const checked = selected.includes(asset.id)
                return (
                  <label
                    key={asset.id}
                    className={`delivery-asset delivery-select${checked ? ' is-selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!canReleasePreview}
                      onChange={(event) =>
                        setSelected((ids) =>
                          event.target.checked
                            ? [...ids, asset.id]
                            : ids.filter((id) => id !== asset.id),
                        )
                      }
                    />
                    <span className="delivery-asset__check" aria-hidden="true">
                      ✓
                    </span>
                    <MediaPreview asset={asset} />
                    <span className="delivery-asset__meta">
                      <strong title={asset.fileName}>{asset.fileName}</strong>
                      <small>
                        {asset.type.toUpperCase().includes('VIDEO')
                          ? t.video
                          : t.image}{' '}
                        · {t.fileNumber(index + 1)}
                      </small>
                    </span>
                  </label>
                )
              })}
            </div>
          </section>
        ) : null}

        {canReleasePreview && delivery.assets.length > 0 ? (
          <section
            className="delivery-composer"
            aria-labelledby="delivery-note-title"
          >
            <div className="delivery-field-head">
              <label id="delivery-note-title" htmlFor="delivery-notes">
                {t.notesLabel}
              </label>
              <span>{notes.length}/1000</span>
            </div>
            <textarea
              id="delivery-notes"
              placeholder={t.notesPlaceholder}
              value={notes}
              maxLength={1000}
              onChange={(event) => setNotes(event.target.value)}
            />
            <div className="delivery-action-bar">
              <div>
                <b>{t.filesCount(selected.length)}</b>
                <span>{t.willBeSentAsPreview}</span>
              </div>
              <Button
                type="button"
                variant="primary"
                className="delivery-primary-action"
                disabled={busy || selected.length === 0}
                title={selected.length === 0 ? t.selectAtLeastOne : undefined}
                onClick={() =>
                  void run(
                    () => deliveryApi.releasePreview(orderId, selected, notes),
                    fb.previewReleased,
                  )
                }
              >
                {busy ? t.sending : t.sendResults(selected.length)}
              </Button>
            </div>
          </section>
        ) : null}

        {delivery.deliveryStatus === 'CUSTOMER_REVIEW' ? (
          <StatusBanner title={t.sentTitle} text={t.sentText} />
        ) : null}
        {delivery.deliveryStatus === 'FINAL_PAYMENT_PENDING' ? (
          <StatusBanner
            tone="warning"
            title={t.acceptedTitle}
            text={t.acceptedText}
          />
        ) : null}
        {delivery.deliveryStatus === 'READY_FOR_DELIVERY' ||
        delivery.deliveryStatus === 'PAYMENT_CONFIRMED' ? (
          <div className="delivery-next-action">
            <div>
              <span className="delivery-next-action__icon" aria-hidden="true">
                ✓
              </span>
              <div>
                <b>{t.paymentConfirmed}</b>
                <span>{t.originalsReady}</span>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              className="delivery-primary-action"
              disabled={busy}
              onClick={async () => {
                const ok = await confirm({
                  title: fb.releaseOriginalsTitle,
                  description: fb.releaseOriginalsBody,
                  confirmLabel: fb.releaseOriginalsAction,
                  tone: 'danger',
                })
                if (ok)
                  void run(
                    () => deliveryApi.releaseOriginals(orderId),
                    fb.originalsReleased,
                  )
              }}
            >
              {busy ? t.delivering : t.deliverOriginals}
            </Button>
          </div>
        ) : null}
        {delivery.deliveryStatus === 'DELIVERED' ? (
          <StatusBanner
            tone="success"
            title={t.deliveredTitle}
            text={t.deliveredText(delivery.assets.length)}
          />
        ) : null}
        {error ? (
          <p className="delivery-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  )
}

function MediaPreview({ asset }: { asset: Delivery['assets'][number] }) {
  return asset.type.toUpperCase().includes('VIDEO') ? (
    <video controls preload="metadata" src={asset.url} />
  ) : (
    <img src={asset.url} alt={asset.fileName} loading="lazy" />
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
  return (
    <div className={`delivery-banner delivery-banner--${tone}`} role="status">
      <span className="delivery-banner__icon" aria-hidden="true">
        {tone === 'success' ? '✓' : tone === 'warning' ? '!' : 'i'}
      </span>
      <div>
        <b>{title}</b>
        <span>{text}</span>
      </div>
    </div>
  )
}
