import { useState } from 'react'
import { Button } from 'antd'
import {
  CheckOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  CopyOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  HomeOutlined,
  LoadingOutlined,
  ReloadOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import type { Payment } from '../../types'

type ResultState =
  | 'success'
  | 'refunded'
  | 'failed'
  | 'cancelled'
  | 'checking'
  | 'pending'
  | 'review'
  | 'unavailable'

export function PaymentResultCard({
  success,
  cancelled,
  checking,
  payment,
  error,
  check,
  retryPayment,
}: {
  success: boolean
  cancelled: boolean
  checking: boolean
  payment: Payment | null
  error: string | null
  check: () => Promise<void>
  retryPayment: () => Promise<void>
}) {
  const [copied, setCopied] = useState(false)
  const failed = payment?.status === 'FAILED'
  const paymentCancelled = payment?.status === 'CANCELLED'
  const refunded = payment?.status === 'REFUNDED'
  const inReview = payment?.status === 'REQUIRES_REVIEW'
  const unavailable = !payment && !checking && Boolean(error)
  const state: ResultState = success
    ? 'success'
    : refunded
      ? 'refunded'
      : failed
        ? 'failed'
        : paymentCancelled || (cancelled && !payment)
          ? 'cancelled'
          : inReview
            ? 'review'
            : checking
              ? 'checking'
              : unavailable
                ? 'unavailable'
                : 'pending'

  const canRetry = Boolean(
    payment &&
    !success &&
    (payment.type === 'DEPOSIT' || payment.type === 'MISSION_PAYMENT') &&
    (payment.status === 'FAILED' || payment.status === 'CANCELLED'),
  )
  const details = getResultCopy(state, payment)
  const Icon =
    state === 'success' || state === 'refunded'
      ? CheckCircleFilled
      : state === 'failed' || state === 'cancelled' || state === 'unavailable'
        ? CloseCircleFilled
        : state === 'checking'
          ? LoadingOutlined
          : ClockCircleFilled
  const SymbolIcon =
    state === 'success' || state === 'refunded' ? CheckOutlined : Icon

  async function copyReference() {
    if (!payment?.transactionReference || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(payment.transactionReference)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section
      className={`payment-result-card is-${state}`}
      aria-live="polite"
      aria-labelledby="payment-result-title"
    >
      <div className="payment-result-card__topline">
        <span className="payment-result-card__eyebrow">
          <FileTextOutlined aria-hidden="true" />
          Kết quả giao dịch
        </span>
        <span className="payment-result-status">
          <Icon spin={state === 'checking'} aria-hidden="true" />
          {details.statusLabel}
        </span>
      </div>

      <div className="payment-result-symbol" aria-hidden="true">
        <span className="payment-result-symbol__halo" />
        <span className="payment-result-symbol__icon">
          <SymbolIcon spin={state === 'checking'} />
        </span>
      </div>

      <h1 id="payment-result-title">{details.title}</h1>
      <p className="payment-result-lead">{details.description}</p>

      {payment ? (
        <div className="payment-result-summary">
          <div className="payment-result-summary__item">
            <span className="payment-result-summary__icon" aria-hidden="true">
              <CreditCardOutlined />
            </span>
            <div className="payment-result-summary__content">
              <span className="payment-result-summary__label">
                Mã thanh toán
              </span>
              <div className="payment-result-reference">
                <strong>{payment.transactionReference}</strong>
                <button
                  type="button"
                  onClick={() => void copyReference()}
                  aria-label={
                    copied
                      ? 'Đã sao chép mã thanh toán'
                      : 'Sao chép mã thanh toán'
                  }
                  title={copied ? 'Đã sao chép' : 'Sao chép mã thanh toán'}
                  disabled={!navigator.clipboard}
                >
                  <CopyOutlined aria-hidden="true" />
                </button>
              </div>
              {copied ? (
                <span className="payment-result-copied">Đã sao chép mã</span>
              ) : null}
            </div>
          </div>
          <div className="payment-result-summary__item is-amount">
            <span className="payment-result-summary__icon" aria-hidden="true">
              <WalletOutlined />
            </span>
            <div className="payment-result-summary__content">
              <span className="payment-result-summary__label">Số tiền</span>
              <strong className="payment-result-amount">
                {formatVnd(payment.amount)}
              </strong>
            </div>
          </div>
        </div>
      ) : null}

      <div className="payment-result-notice" role="status">
        <span className="payment-result-notice__icon" aria-hidden="true">
          <Icon spin={state === 'checking'} />
        </span>
        <span className="payment-result-notice__message">{details.notice}</span>
        {payment?.paidAt ? (
          <time dateTime={payment.paidAt}>
            {formatPaymentDate(payment.paidAt)}
          </time>
        ) : null}
      </div>

      {error ? (
        <p className="payment-result-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="payment-result-actions">
        {canRetry ? (
          <Button
            type="primary"
            icon={<CreditCardOutlined />}
            loading={checking}
            onClick={() => void retryPayment()}
          >
            Thử thanh toán lại
          </Button>
        ) : null}
        {!success && state !== 'refunded' && !checking ? (
          <Button
            type={canRetry ? 'default' : 'primary'}
            icon={<ReloadOutlined />}
            onClick={() => void check()}
          >
            Kiểm tra lại trạng thái
          </Button>
        ) : null}
        <Button
          type={
            success || state === 'refunded' || (!canRetry && !checking)
              ? 'primary'
              : 'default'
          }
          icon={<HomeOutlined />}
          href="#portal/customer/orders"
        >
          Về danh sách đơn
        </Button>
      </div>
    </section>
  )
}

function getResultCopy(state: ResultState, payment: Payment | null) {
  if (state === 'success') {
    return {
      statusLabel: 'Thanh toán thành công',
      title: 'Thanh toán thành công!',
      description:
        payment?.type === 'DEPOSIT'
          ? 'Tiền đặt cọc đã được ghi nhận. Kế hoạch thực hiện đang được chuẩn bị.'
          : payment?.type === 'MISSION_PAYMENT'
            ? 'Khoản thanh toán Mission đã được ghi nhận. Các Mission còn lại vẫn thanh toán riêng theo tiến độ bàn giao.'
            : 'Thanh toán đã hoàn tất. Đang chờ quản lý bàn giao dữ liệu.',
      notice: 'Giao dịch đã được xử lý thành công',
    }
  }
  if (state === 'refunded') {
    return {
      statusLabel: 'Đã hoàn tiền',
      title: 'Khoản thanh toán đã được hoàn',
      description:
        'Khoản tiền này đã được hoàn lại. Bạn có thể xem thông tin đơn hàng để theo dõi cập nhật mới nhất.',
      notice: 'Giao dịch đã được hoàn tiền',
    }
  }
  if (state === 'failed') {
    return {
      statusLabel: 'Thanh toán thất bại',
      title: 'Thanh toán chưa thành công',
      description:
        'Giao dịch chưa được ghi nhận. Bạn có thể thử thanh toán lại hoặc kiểm tra trạng thái.',
      notice: 'Chưa ghi nhận khoản thanh toán này',
    }
  }
  if (state === 'cancelled') {
    return {
      statusLabel: 'Thanh toán đã hủy',
      title: 'Bạn đã hủy thanh toán',
      description:
        'Chưa có khoản thu nào được xác nhận. Bạn có thể quay lại đơn hàng để tiếp tục khi sẵn sàng.',
      notice: 'Giao dịch chưa được ghi nhận',
    }
  }
  if (state === 'review') {
    return {
      statusLabel: 'Cần kiểm tra thêm',
      title: 'Giao dịch đang được kiểm tra',
      description:
        'Vui lòng chờ xác nhận trước khi thanh toán lại để tránh phát sinh giao dịch trùng.',
      notice: 'Giao dịch cần được đối soát thêm',
    }
  }
  if (state === 'checking') {
    return {
      statusLabel: 'Đang xác minh',
      title: 'Đang kiểm tra thanh toán',
      description:
        'Hệ thống đang xác minh trạng thái giao dịch trực tiếp với cổng thanh toán.',
      notice: 'Đang chờ phản hồi từ cổng thanh toán',
    }
  }
  if (state === 'unavailable') {
    return {
      statusLabel: 'Chưa thể xác minh',
      title: 'Chưa thể xác minh giao dịch',
      description:
        'Hãy kiểm tra lại trạng thái sau ít phút. Nếu đã bị trừ tiền, vui lòng liên hệ bộ phận hỗ trợ.',
      notice: 'Chưa có xác nhận cuối cùng từ cổng thanh toán',
    }
  }
  return {
    statusLabel: 'Đang chờ xác nhận',
    title: 'Thanh toán đang được xác nhận',
    description:
      'Cổng thanh toán đang xử lý giao dịch. Bạn có thể kiểm tra lại trạng thái sau ít phút.',
    notice: 'Giao dịch đang chờ VNPAY xác nhận',
  }
}

function formatPaymentDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date)
}
