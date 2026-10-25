import type { ExecutionPlan } from '../../../types/planning'
import type { MissionResponse } from '../../../types/missions'
import type { OrderDetail } from '../../../types/orders'
import type { Invoice } from '../../../../finance/types'

export function PlanningPaymentGate({
  checkingPayment,
  checkPayment,
  data,
}: {
  checkingPayment: boolean
  checkPayment: () => Promise<void>
  data: {
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    invoice: Invoice | null
  }
}) {
  return (
    <div className="odm-planning-payment-gate" role="status">
      <div className="odm-gate-head">
        <strong>Đang chờ khách hàng thanh toán đặt cọc</strong>
        <button
          type="button"
          className="odm-btn"
          disabled={checkingPayment}
          onClick={() => void checkPayment()}
        >
          {checkingPayment ? 'Đang kiểm tra…' : 'Kiểm tra thanh toán'}
        </button>
      </div>
      <p>
        Tạo Mission và chốt kế hoạch sẽ được mở sau khi hệ thống xác nhận khoản
        đặt cọc.
      </p>
      {data.invoice ? (
        <div className="odm-gate-deposit">
          <div
            className="odm-gate-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={data.invoice.depositAmount}
            aria-valuenow={data.invoice.paidAmount}
          >
            <span
              style={{
                width: `${Math.min(
                  100,
                  data.invoice.depositAmount > 0
                    ? (data.invoice.paidAmount / data.invoice.depositAmount) *
                        100
                    : 0,
                )}%`,
              }}
            />
          </div>
          <span>
            Đã thanh toán {data.invoice.paidAmount.toLocaleString('vi-VN')} /{' '}
            {data.invoice.depositAmount.toLocaleString('vi-VN')} ₫ tiền đặt cọc
          </span>
        </div>
      ) : (
        <span>
          Khách hàng chưa chấp nhận báo giá hoặc chưa phát hành hóa đơn.
        </span>
      )}
    </div>
  )
}
