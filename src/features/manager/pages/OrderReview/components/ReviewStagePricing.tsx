import { ReadOnlyScope } from './ReadOnlyScope'
import { ManagerPricingPanel } from '../../../../finance/ManagerPricing'
import { ReviewStageActions } from './ReviewStageActions'
import type { OrderDetail } from '../../../types/orders'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { OrderReadiness } from '../../../types/readiness'
import type { ReviewStep } from '../reviewTypes'
import { useI18n } from '../../../../../shared/i18n'
import { reviewStagePricingMessages } from './ReviewStagePricing.messages'

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
  const { t } = useI18n(reviewStagePricingMessages)
  return (
    <div
      className="odm-or-review-stage odm-or-pricing-stage"
      aria-label={t.checklistAndQuote}
    >
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
      <ReviewStageActions step={4} onBack={() => goToStep(3)} compact />
    </div>
  )
}
