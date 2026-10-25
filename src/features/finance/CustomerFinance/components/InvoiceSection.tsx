import { invoiceStatusLabels } from '../customerFinanceHelpers'
import { pricingLabel } from '../../../../shared/lib/pricingPresentation'
import { PaymentStat } from './PaymentStat'
import type { Invoice } from '../../types'

export function InvoiceSection({
  invoice,
  legalReady,
  busy,
  pay,
  completeTestDeposit,
  testPaymentLabel,
}: {
  invoice: Invoice
  legalReady: boolean
  busy: boolean
  pay: (type: 'deposit' | 'final') => Promise<void>
  completeTestDeposit: () => Promise<void>
  testPaymentLabel: string
}) {
  return (
    <div className="customer-invoice">
      <div className="customer-invoice-title">
        <div>
          <h3>Hóa đơn {invoice.invoiceNumber}</h3>
          <p>
            Khoản đặt cọc được xác nhận qua IPN VNPAY trước khi nhiệm vụ bắt
            đầu.
          </p>
        </div>
        <span className={`finance-status is-${invoice.status.toLowerCase()}`}>
          {invoiceStatusLabels[invoice.status] ?? pricingLabel(invoice.status)}
        </span>
      </div>
      <div className="customer-payment-stats">
        <PaymentStat label="Tổng" value={invoice.totalAmount} />
        <PaymentStat label="Tiền đặt cọc (30%)" value={invoice.depositAmount} />
        <PaymentStat label="Đã thanh toán" value={invoice.paidAmount} />
        <PaymentStat label="Còn lại" value={invoice.remainingAmount} />
      </div>
      {invoice.paidAmount < invoice.depositAmount ? (
        <div className="customer-deposit-notice">
          <b>Đang chờ đặt cọc</b>
          <span>
            Kế hoạch thực hiện và Mission sẽ được mở sau khi khoản đặt cọc được
            xác nhận.
          </span>
        </div>
      ) : invoice.status !== 'PAID' ? (
        <div className="customer-deposit-notice is-ready">
          <b>Đã nhận tiền đặt cọc</b>
          <span>Nhiệm vụ đã được mở khóa cho quy trình vận hành.</span>
        </div>
      ) : null}
      <div className="finance-actions customer-payment-actions">
        {invoice.paidAmount < invoice.depositAmount && legalReady ? (
          <>
            <button
              className="odm-btn odm-btn-p"
              type="button"
              disabled={busy}
              onClick={() => void pay('deposit')}
            >
              Thanh toán đặt cọc
            </button>
            {import.meta.env.DEV ? (
              <button
                className="odm-btn"
                type="button"
                disabled={busy}
                onClick={() => void completeTestDeposit()}
              >
                {testPaymentLabel}
              </button>
            ) : null}
          </>
        ) : null}
        {invoice.finalPaymentAllowed &&
        invoice.paidAmount >= invoice.depositAmount &&
        invoice.remainingAmount > 0 ? (
          <button
            className="odm-btn odm-btn-p"
            type="button"
            disabled={busy}
            onClick={() => void pay('final')}
          >
            Thanh toán phần còn lại
          </button>
        ) : null}
      </div>
    </div>
  )
}
