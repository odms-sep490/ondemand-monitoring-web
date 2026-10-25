import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../shared/api/httpClient'
import { Modal } from '../../shared/components/ui'
import { useLanguage } from '../../shared/i18n'
import { formatVnd } from '../../shared/lib/formatVnd'
import { financeApi } from '../finance/api'
import { deliveryApi } from './api'
import { DeliveryProgress, DeliveryStatusPill } from './DeliveryProgress'
import type { Delivery } from './types'
import './delivery.css'

export function CustomerDeliveryPanel({ orderId }: { orderId: string }) {
  const { lang } = useLanguage()
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
      <p className="delivery-error" role="alert">
        {message(error, lang)}
      </p>
    ) : null

  async function accept() {
    await act(() => deliveryApi.accept(orderId))
    setAcceptOpen(false)
  }
  async function revise() {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do yêu cầu chỉnh sửa.')
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
      if (!payment.paymentUrl)
        throw new Error('VNPAY chưa trả về đường dẫn thanh toán.')
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
          <span className="delivery-eyebrow">Kết quả nhiệm vụ</span>
          <h2 id="delivery-title">Kết quả giám sát của bạn</h2>
          <p>
            Theo dõi quá trình duyệt, thanh toán và nhận dữ liệu gốc tại một
            nơi.
          </p>
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
                    ? 'Dữ liệu gốc'
                    : 'Bản xem trước'}
                </h3>
                <p>
                  {delivery.assets.length} tệp ·{' '}
                  {delivery.deliveryStatus === 'DELIVERED'
                    ? 'Sẵn sàng tải xuống'
                    : 'Vui lòng kiểm tra trước khi xác nhận'}
                </p>
              </div>
              <span
                className={`delivery-access-badge${delivery.deliveryStatus === 'DELIVERED' ? ' is-original' : ''}`}
              >
                {delivery.deliveryStatus === 'DELIVERED'
                  ? 'Bản gốc'
                  : 'Preview'}
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
                        ? 'Video'
                        : 'Hình ảnh'}{' '}
                      · {formatBytes(asset.size)}
                    </small>
                  </div>
                  {asset.downloadable ? (
                    <a
                      className="odm-btn delivery-download"
                      href={asset.url}
                      download
                    >
                      Tải bản gốc
                    </a>
                  ) : (
                    <span className="delivery-preview-note">
                      Bản xem trước · chưa thể tải bản gốc
                    </span>
                  )}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {delivery.deliveryNotes ? (
          <div className="delivery-manager-note">
            <span>Ghi chú từ Manager</span>
            <p>{delivery.deliveryNotes}</p>
          </div>
        ) : null}
        <section
          className="delivery-payment-card"
          aria-labelledby="payment-summary-title"
        >
          <div className="delivery-payment-card__head">
            <div>
              <span className="delivery-eyebrow">Thanh toán</span>
              <h3 id="payment-summary-title">Tổng quan chi phí</h3>
            </div>
            <strong>{paymentPercent}%</strong>
          </div>
          <div
            className="delivery-payment-progress"
            aria-label={`Đã thanh toán ${paymentPercent}%`}
          >
            <span style={{ width: `${paymentPercent}%` }} />
          </div>
          <div className="delivery-payment">
            <div>
              <span>Tổng giá trị</span>
              <strong>{formatVnd(delivery.totalAmount)}</strong>
            </div>
            <div>
              <span>Đã thanh toán</span>
              <strong className="is-paid">
                {formatVnd(delivery.paidAmount)}
              </strong>
            </div>
            <div className="is-remaining">
              <span>Còn lại</span>
              <strong>{formatVnd(delivery.remainingAmount)}</strong>
            </div>
          </div>
        </section>

        {canReview ? (
          <div className="delivery-review-card">
            <div>
              <span className="delivery-review-card__icon" aria-hidden="true">
                ✓
              </span>
              <div>
                <b>Bản preview đã sẵn sàng</b>
                <span>
                  Hãy kiểm tra các tệp phía trên và cho chúng tôi biết lựa chọn
                  của bạn.
                </span>
              </div>
            </div>
            <div className="delivery-actions">
              <button
                type="button"
                className="odm-btn"
                onClick={() => setRevisionOpen(true)}
                disabled={busy}
              >
                Yêu cầu chỉnh sửa
              </button>
              <button
                type="button"
                className="odm-btn odm-btn-p delivery-primary-action"
                onClick={() => setAcceptOpen(true)}
                disabled={busy}
              >
                {busy ? 'Đang xác nhận…' : 'Chấp nhận kết quả'}
              </button>
            </div>
          </div>
        ) : null}
        {acceptOpen ? (
          <Modal
            title="Chấp nhận kết quả"
            subtitle="Xác nhận đã kiểm tra bản preview"
            icon="shield"
            width={480}
            onClose={() => !busy && setAcceptOpen(false)}
            footer={
              <>
                <button
                  type="button"
                  className="odm-btn odm-btn-gh"
                  onClick={() => setAcceptOpen(false)}
                  disabled={busy}
                >
                  Xem lại
                </button>
                <button
                  type="button"
                  className="odm-btn odm-btn-p"
                  onClick={() => void accept()}
                  disabled={busy}
                >
                  {busy ? 'Đang xác nhận…' : 'Xác nhận chấp nhận'}
                </button>
              </>
            }
          >
            <p>
              Tôi xác nhận đã xem các bản preview và chấp nhận kết quả giám sát
              được bàn giao.
            </p>
            {error ? <p className="delivery-error" role="alert">{message(error, lang)}</p> : null}
          </Modal>
        ) : null}
        {revisionOpen ? (
          <div className="delivery-revision">
            <div className="delivery-field-head">
              <label htmlFor="revision-reason">
                Nội dung cần chỉnh sửa <em>*</em>
              </label>
              <span>{reason.length}/2000</span>
            </div>
            <textarea
              id="revision-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={2000}
              placeholder="Mô tả cụ thể vị trí, tệp hoặc nội dung bạn muốn điều chỉnh…"
              autoFocus
            />
            <div className="delivery-actions">
              <button
                type="button"
                className="odm-btn"
                onClick={() => setRevisionOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="odm-btn odm-btn-p"
                disabled={busy || !reason.trim()}
                onClick={() => void revise()}
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        ) : null}

        {delivery.deliveryStatus === 'PROCESSING' ? (
          <StatusBanner
            title="Kết quả đang được xử lý"
            text="Trang sẽ tự động cập nhật khi dữ liệu sẵn sàng."
          />
        ) : null}
        {delivery.deliveryStatus === 'READY_FOR_MANAGER_REVIEW' ? (
          <StatusBanner
            title="Nhiệm vụ đã hoàn thành"
            text="Manager đang kiểm tra chất lượng dữ liệu trước khi gửi bản preview cho bạn."
          />
        ) : null}
        {delivery.deliveryStatus === 'REVISION_REQUESTED' ? (
          <StatusBanner
            tone="warning"
            title="Đã gửi yêu cầu chỉnh sửa"
            text="Manager sẽ cập nhật và gửi lại bản preview mới cho bạn."
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
                <b>Hoàn tất thanh toán để nhận bản gốc</b>
                <span>
                  Số tiền còn lại:{' '}
                  <strong>{formatVnd(delivery.remainingAmount)}</strong>
                </span>
              </div>
            </div>
            <button
              type="button"
              className="odm-btn odm-btn-p delivery-primary-action"
              disabled={busy}
              onClick={() => void payFinal()}
            >
              {busy ? 'Đang chuyển đến VNPAY…' : 'Thanh toán qua VNPAY'}
            </button>
          </div>
        ) : null}
        {delivery.deliveryStatus === 'READY_FOR_DELIVERY' ||
        delivery.deliveryStatus === 'PAYMENT_CONFIRMED' ? (
          <StatusBanner
            tone="success"
            title="Thanh toán đã được xác nhận"
            text="Manager đang chuẩn bị phát hành dữ liệu gốc cho bạn."
          />
        ) : null}
        {delivery.deliveryStatus === 'DELIVERED' ? (
          <StatusBanner
            tone="success"
            title="Bàn giao hoàn tất"
            text={`${delivery.assets.length} tệp gốc đã sẵn sàng để tải xuống.`}
          />
        ) : null}
        {error ? (
          <p className="delivery-error" role="alert">
            {message(error, lang)}
          </p>
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

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Không rõ dung lượng'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function message(cause: unknown, lang: 'vi' | 'en') {
  if (typeof cause === 'string') return cause
  if (cause instanceof ApiError && cause.code === 'NETWORK_ERROR') {
    return lang === 'en'
      ? 'Unable to reach the server. Please try again.'
      : 'Không thể kết nối tới máy chủ. Vui lòng thử lại.'
  }
  return cause instanceof Error
    ? cause.message
    : lang === 'en'
      ? 'Unable to process the request.'
      : 'Không thể xử lý yêu cầu.'
}
