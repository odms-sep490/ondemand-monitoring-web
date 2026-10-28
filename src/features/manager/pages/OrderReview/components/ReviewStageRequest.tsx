import { ReadOnlyScope } from './ReadOnlyScope'
import { OrderServiceInfo } from '../../../components/common/OrderServiceInfo'
import { OrderCustomerRequestDetails } from '../../../components/common/OrderCustomerRequestDetails'
import { ReviewStageActions } from './ReviewStageActions'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import { reviewStageRequestMessages } from './ReviewStageRequest.messages'
import type { OrderDetail } from '../../../types/orders'
import type { ReviewStep } from '../reviewTypes'

export function ReviewStageRequest({
  readOnly,
  order,
  goToStep,
}: {
  readOnly: boolean
  order: OrderDetail
  goToStep: (step: ReviewStep) => void
}) {
  const { t } = useI18n(orderReviewPageMessages)
  const { t: tr } = useI18n(reviewStageRequestMessages)
  return (
    <div className="odm-or-review-stage" aria-label={tr.orderInfo}>
      <ReadOnlyScope on={readOnly}>
        <OrderServiceInfo order={order} t={t} hideService />
        <OrderCustomerRequestDetails order={order} t={t} />
      </ReadOnlyScope>
      <ReviewStageActions step={1} onNext={() => goToStep(2)} />
    </div>
  )
}
