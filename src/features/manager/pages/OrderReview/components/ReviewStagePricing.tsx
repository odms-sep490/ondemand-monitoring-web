import { ReadOnlyScope } from './ReadOnlyScope'
import { ManagerPricingPanel } from '../../../../finance/ManagerPricing'
import { ReviewStageActions } from './ReviewStageActions'
import type { OrderDetail } from '../../../types/orders'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { OrderReadiness } from '../../../types/readiness'
import type { ReviewStep } from '../reviewTypes'

export function ReviewStagePricing({
  readOnly,
  order,
  handleApproved,
  readinessQuery,
  approveBlockedReason,
  goToStep,
}: {
  readOnly: boolean
  order: OrderDetail
  handleApproved: () => void
  readinessQuery: UseApiQueryState<OrderReadiness>
  approveBlockedReason: string | null
  goToStep: (step: ReviewStep) => void
}) {
  return (
    <div className="odm-or-review-stage" aria-label="Checklist và báo giá">
      <ReadOnlyScope on={readOnly}>
        <section className="odm-or-review-section">
          <ManagerPricingPanel
            orderId={order.id}
            onApproved={handleApproved}
            onChecklistReviewChanged={readinessQuery.reload}
            approveBlockedReason={approveBlockedReason}
          />
        </section>
      </ReadOnlyScope>
      <ReviewStageActions step={4} onBack={() => goToStep(3)} />
    </div>
  )
}
