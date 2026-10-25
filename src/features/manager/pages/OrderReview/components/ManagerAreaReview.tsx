import type { OrderDetail } from '../../../types/orders'
import type { SavedAreaReview } from '../areaTypes'
import { usePlanningConfirmation } from '../../../components/common/usePlanningConfirmation'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { areaReviewLabel, resolveUnsuitable } from '../areaHelpers'

export function ManagerAreaReview({
  order,
  review,
  onEdit,
}: {
  order: OrderDetail
  review: SavedAreaReview | null
  onEdit: () => void
}) {
  const confirmation = usePlanningConfirmation()
  // Once the order is rejected/cancelled/sent back, the review is history: no more actions.
  const decided = order.status !== 'PENDING'
  return (
    <>
      <div
        className={`odm-or-area-manager-review${review ? ` is-${review.status.toLowerCase()}` : ''}`}
      >
        {review ? (
          <>
            <span className="odm-or-area-review-label">
              Đánh giá của Manager
            </span>
            <strong
              className={`odm-or-area-verdict is-${review.status.toLowerCase()}`}
            >
              <OrderIcon
                name={
                  review.status === 'REJECTED'
                    ? 'x'
                    : review.status === 'PENDING_PERMIT'
                      ? 'alert'
                      : 'shield'
                }
                size={20}
              />
              {areaReviewLabel(review.status)}
            </strong>
            {review.reason ? (
              <p className="odm-or-area-reason">
                <span>Lý do</span>
                {review.reason}
              </p>
            ) : null}
            {review.note ? (
              <p className="odm-or-area-reason">
                <span>Ghi chú</span>
                {review.note}
              </p>
            ) : null}
            <small>
              {review.reviewer ?? 'Manager'}
              {review.reviewedAt
                ? ` · ${new Intl.DateTimeFormat('vi-VN', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date(review.reviewedAt))}`
                : ''}
            </small>
            {decided ? null : (
              <button
                type="button"
                className="odm-or-area-edit"
                onClick={onEdit}
              >
                <OrderIcon name="edit" size={18} />
                <span>Chỉnh sửa đánh giá</span>
                <OrderIcon name="chevron-right" size={18} />
              </button>
            )}
            {review.status === 'REJECTED' ? (
              <div className="odm-or-area-contact">
                <OrderIcon name="phone" size={20} />
                <div>
                  <span>Liên hệ khách hàng</span>
                  <strong>{order.customer.fullName}</strong>
                  {order.customer.phone ? (
                    <a href={`tel:${order.customer.phone.replace(/\s+/g, '')}`}>
                      {order.customer.phone}
                    </a>
                  ) : (
                    <em>Chưa có số điện thoại</em>
                  )}
                </div>
              </div>
            ) : null}
            {review.status === 'REJECTED' && !decided ? (
              <div className="odm-or-area-secondary-actions">
                <button
                  type="button"
                  onClick={() =>
                    void resolveUnsuitable(
                      order,
                      review,
                      'NEED_INFO',
                      confirmation.confirm,
                    )
                  }
                >
                  <OrderIcon name="swap" size={16} />
                  Yêu cầu khách đổi khu vực
                </button>
                <button
                  type="button"
                  className="is-danger"
                  onClick={() =>
                    void resolveUnsuitable(
                      order,
                      review,
                      'REJECTED',
                      confirmation.confirm,
                    )
                  }
                >
                  <OrderIcon name="x" size={16} />
                  Từ chối đơn hàng
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <p>Chưa có đánh giá của Manager.</p>
            {decided ? null : (
              <button
                type="button"
                className="odm-btn odm-btn-p"
                onClick={onEdit}
              >
                Đánh giá khu vực
              </button>
            )}
            <a href="#portal/manager/support">Cần trợ giúp? Liên hệ hỗ trợ</a>
          </>
        )}
      </div>
      {confirmation.dialog}
    </>
  )
}
