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
  return (
    <div className="customer-quote-body">
      <QuoteLines items={quote.items} />
      <dl className="finance-summary customer-summary">
        <Summary label="Chi phí dự kiến" value={quote.estimatedBaseAmount} />
        <Summary
          label="Dịch vụ bổ sung"
          value={quote.approvedAdditionalServiceAmount}
        />
        <Summary label="Tổng đơn hàng" value={quote.finalOrderAmount} total />
      </dl>
      <p className="co-estimate-notice">
        Báo giá dự kiến chưa bao gồm dịch vụ theo yêu cầu.
      </p>
      {!legalReady ? (
        <div className="customer-deposit-notice">
          <b>
            {legalStatus === 'REJECTED'
              ? 'Đơn hàng không thể thực hiện'
              : 'Đang xác minh điều kiện khu vực bay'}
          </b>
          <span>
            {legalStatus === 'REJECTED'
              ? 'Đơn hàng không thể thực hiện do điều kiện khu vực bay.'
              : 'Chúng tôi đang xác minh các điều kiện cần thiết trước khi đơn hàng có thể tiếp tục.'}
          </span>
        </div>
      ) : legalStatus === 'PENDING_PERMIT' ? (
        <div className="customer-deposit-notice">
          <b>Đang xác minh giấy phép bay</b>
          <span>
            Bạn vẫn có thể tiếp tục. Chúng tôi sẽ cập nhật khi giấy phép được
            xác nhận.
          </span>
        </div>
      ) : null}
      {quote.status === 'APPROVED' && !invoice && legalReady ? (
        <button
          className="odm-btn odm-btn-p"
          type="button"
          disabled={busy}
          onClick={() => void accept()}
        >
          Chấp nhận báo giá
        </button>
      ) : null}
    </div>
  )
}
