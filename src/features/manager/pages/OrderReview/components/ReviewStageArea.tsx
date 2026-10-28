import { ReadOnlyScope } from './ReadOnlyScope'
import { OrderAreaCheck } from './OrderAreaCheck'
import { ReviewStageActions } from './ReviewStageActions'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import { reviewStageAreaMessages } from './ReviewStageArea.messages'
import type { OrderDetail, LegalReviewStatus } from '../../../types/orders'
import type { Dispatch, SetStateAction } from 'react'
import type { ReviewStep } from '../reviewTypes'

export function ReviewStageArea({
  readOnly,
  order,
  setAreaReviewStatus,
  goToStep,
  areaReviewStatus,
}: {
  readOnly: boolean
  order: OrderDetail
  setAreaReviewStatus: Dispatch<SetStateAction<LegalReviewStatus | null>>
  goToStep: (step: ReviewStep) => void
  areaReviewStatus: LegalReviewStatus | null
}) {
  const { t } = useI18n(orderReviewPageMessages)
  const { t: ts } = useI18n(reviewStageAreaMessages)
  return (
    <div className="odm-or-review-stage" aria-label={ts.areaCheck}>
      <ReadOnlyScope on={readOnly}>
        <OrderAreaCheck
          order={order}
          t={t}
          onReviewSaved={setAreaReviewStatus}
        />
      </ReadOnlyScope>
      <ReviewStageActions
        step={2}
        onBack={() => goToStep(1)}
        onNext={() => goToStep(3)}
        nextLabel={ts.nextLabel}
        nextDisabled={
          areaReviewStatus !== 'NOT_REQUIRED' && areaReviewStatus !== 'APPROVED'
        }
        hint={
          areaReviewStatus == null
            ? ts.hintNeedReview
            : areaReviewStatus === 'REJECTED'
              ? ts.hintRejected
              : null
        }
      />
    </div>
  )
}
