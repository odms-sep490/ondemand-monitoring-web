import type { OrderDetail } from '../../../types/orders'
import type { SavedAreaReview } from '../areaTypes'
import { usePlanningConfirmation } from '../../../components/common/usePlanningConfirmation'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { areaReviewLabel, resolveUnsuitable } from '../areaHelpers'
import { Button, useToast } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { managerFeedbackMessages } from '../../../feedback.messages'
import { managerAreaReviewMessages } from './ManagerAreaReview.messages'

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
  const { t: fb } = useI18n(managerFeedbackMessages)
  const { t, locale } = useI18n(managerAreaReviewMessages)
  const toast = useToast()
  async function resolve(decision: 'NEED_INFO' | 'REJECTED') {
    if (!review) return
    try {
      const done = await resolveUnsuitable(
        order,
        review,
        decision,
        confirmation.confirm,
      )
      if (done)
        toast.success(
          decision === 'REJECTED' ? fb.orderRejected : fb.infoRequested,
        )
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t.submitFailed)
    }
  }
  // Once the order is rejected/cancelled/sent back, the review is history: no more actions.
  const decided = order.status !== 'PENDING'
  return (
    <>
      <div
        className={`odm-or-area-manager-review${review ? ` is-${review.status.toLowerCase()}` : ''}`}
      >
        {review ? (
          <>
            <span className="odm-or-area-review-label">{t.managerReview}</span>
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
                <span>{t.reason}</span>
                {review.reason}
              </p>
            ) : null}
            {review.note ? (
              <p className="odm-or-area-reason">
                <span>{t.note}</span>
                {review.note}
              </p>
            ) : null}
            <small>
              {review.reviewer ?? 'Manager'}
              {review.reviewedAt
                ? ` · ${new Intl.DateTimeFormat(locale, {
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
                <span>{t.editReview}</span>
                <OrderIcon name="chevron-right" size={18} />
              </button>
            )}
            {review.status === 'REJECTED' ? (
              <div className="odm-or-area-contact">
                <OrderIcon name="phone" size={20} />
                <div>
                  <span>{t.contactCustomer}</span>
                  <strong>{order.customer.fullName}</strong>
                  {order.customer.phone ? (
                    <a href={`tel:${order.customer.phone.replace(/\s+/g, '')}`}>
                      {order.customer.phone}
                    </a>
                  ) : (
                    <em>{t.noPhone}</em>
                  )}
                </div>
              </div>
            ) : null}
            {review.status === 'REJECTED' && !decided ? (
              <div className="odm-or-area-secondary-actions">
                <Button onClick={() => void resolve('NEED_INFO')}>
                  <OrderIcon name="swap" size={16} />
                  {t.requestAreaChange}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => void resolve('REJECTED')}
                >
                  <OrderIcon name="x" size={16} />
                  {t.rejectOrder}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <p>{t.noReview}</p>
            {decided ? null : (
              <Button type="button" onClick={onEdit}>
                {t.reviewArea}
              </Button>
            )}
            <a href="#portal/manager/support">{t.needHelp}</a>
          </>
        )}
      </div>
      {confirmation.dialog}
    </>
  )
}
