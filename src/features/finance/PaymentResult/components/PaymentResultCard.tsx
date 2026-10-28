import { Button } from 'antd'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import type { Payment } from '../../types'

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
  return (
    <section className="payment-result-card" aria-live="polite">
      <div
        className={`payment-result-icon ${success ? 'is-success' : cancelled ? 'is-cancelled' : ''}`}
        aria-hidden="true"
      >
        {success ? '✓' : cancelled ? '×' : '…'}
      </div>
      <h1>
        {success
          ? 'Thanh toán thành công'
          : cancelled
            ? 'Thanh toán đã hủy'
            : checking
              ? 'Đang kiểm tra thanh toán'
              : 'Thanh toán đang được xác nhận'}
      </h1>
      <p>
        {success
          ? payment?.type === 'DEPOSIT'
            ? 'Tiền đặt cọc đã được ghi nhận. Kế hoạch thực hiện đang được chuẩn bị.'
            : 'Thanh toán đã hoàn tất. Đang chờ quản lý bàn giao dữ liệu.'
          : cancelled
            ? 'Chưa có khoản thu nào được xác nhận từ lần quay lại này.'
            : 'Hệ thống đang xác minh trạng thái giao dịch với VNPAY.'}
      </p>
      {payment ? (
        <dl className="payment-result-detail">
          <div>
            <dt>Mã thanh toán</dt>
            <dd>{payment.transactionReference}</dd>
          </div>
          <div>
            <dt>Số tiền</dt>
            <dd>{formatVnd(payment.amount)}</dd>
          </div>
        </dl>
      ) : null}
      {error ? (
        <p className="finance-alert is-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="payment-result-actions">
        {!success && !checking ? (
          <Button type="primary" onClick={() => void check()}>
            Làm mới trạng thái
          </Button>
        ) : null}
        {cancelled && payment && !success ? (
          <Button onClick={() => void retryPayment()}>Thử lại</Button>
        ) : null}
        <Button href="#portal/customer/orders">Về danh sách đơn</Button>
      </div>
    </section>
  )
}
