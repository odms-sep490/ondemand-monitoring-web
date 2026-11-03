import { ReadOnlyScope } from './ReadOnlyScope'
import { OrderCustomerRequestDetails } from '../../../components/common/OrderCustomerRequestDetails'
import { ReviewStageActions } from './ReviewStageActions'
import { OrderLocationCard } from './OrderLocationCard'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import { reviewStageRequestMessages } from './ReviewStageRequest.messages'
import type { OrderDetail } from '../../../types/orders'
import type { ReviewStep } from '../reviewTypes'

export function ReviewStageRequest({
  readOnly,
  order,
  goToStep,
  startingReview,
  startReviewError,
}: {
  readOnly: boolean
  order: OrderDetail
  goToStep: (step: ReviewStep) => void | Promise<void>
  startingReview: boolean
  startReviewError: string | null
}) {
  const { t } = useI18n(orderReviewPageMessages)
  const { t: tr } = useI18n(reviewStageRequestMessages)
  return (
    <div className="odm-or-review-stage" aria-label={tr.orderInfo}>
      <ReadOnlyScope on={readOnly}>
        <OrderLocationCard order={order} t={t} overview />
        <OrderCustomerRequestDetails order={order} t={t} />
      </ReadOnlyScope>
      <ReviewStageActions
        step={1}
        onNext={() => void goToStep(2)}
        nextDisabled={startingReview || readOnly}
        hint={startReviewError}
      />
    </div>
  )
}
