import { ReadOnlyScope } from './ReadOnlyScope'
import { OrderAreaCheck } from './OrderAreaCheck'
import { ReviewStageActions } from './ReviewStageActions'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'
import { useI18n } from '../../../../../shared/i18n'
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
  return (
    <div className="odm-or-review-stage" aria-label="Kiểm tra vùng giám sát">
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
        nextLabel="Tiếp: Điều kiện duyệt"
        nextDisabled={
          areaReviewStatus !== 'NOT_REQUIRED' && areaReviewStatus !== 'APPROVED'
        }
        hint={
          areaReviewStatus == null
            ? 'Manager cần đánh giá khu vực trước khi tiếp tục'
            : areaReviewStatus === 'REJECTED'
              ? 'Hãy yêu cầu khách đổi khu vực hoặc từ chối đơn'
              : null
        }
      />
    </div>
  )
}
