import { ReadOnlyScope } from './ReadOnlyScope'
import { OrderReadinessCard } from './OrderReadinessCard'
import { ReviewStageActions } from './ReviewStageActions'
import type { OrderDetail } from '../../../types/orders'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { OrderReadiness } from '../../../types/readiness'
import { useState, type Dispatch, type SetStateAction } from 'react'
import type { ReviewStep } from '../reviewTypes'
import { useI18n } from '../../../../../shared/i18n'
import { reviewStageReadinessMessages } from './ReviewStageReadiness.messages'

export function ReviewStageReadiness({
  readOnly,
  order,
  readinessQuery,
  setNavigateHome,
  goToStep,
  pendingRequired,
}: {
  readOnly: boolean
  order: OrderDetail
  readinessQuery: UseApiQueryState<OrderReadiness>
  setNavigateHome: Dispatch<SetStateAction<boolean>>
  goToStep: (step: ReviewStep) => void
  pendingRequired: number
}) {
  const { t } = useI18n(reviewStageReadinessMessages)
  const [localDraftBlocked, setLocalDraftBlocked] = useState(false)
  const [decisionHost, setDecisionHost] = useState<HTMLDivElement | null>(null)
  const readiness = readinessQuery.data
  const requiredCriterionBlocked =
    readiness?.criteria.some(
      (criterion) =>
        criterion.required &&
        (criterion.result === 'FAIL' || criterion.result === 'PENDING'),
    ) ?? true
  const nextBlocked =
    order.status === 'PENDING' &&
    (readiness?.canApprove !== true ||
      requiredCriterionBlocked ||
      localDraftBlocked)
  const failedRequired =
    readiness?.criteria.filter(
      (criterion) => criterion.required && criterion.result === 'FAIL',
    ).length ?? 0
  const nextHint =
    order.status !== 'PENDING' || !nextBlocked
      ? null
      : failedRequired > 0
        ? t.failedBlocked(failedRequired)
        : localDraftBlocked
          ? t.draftBlocked
          : pendingRequired > 0
            ? t.pendingBlocked(pendingRequired)
            : t.notMet

  return (
    <div className="odm-or-review-stage" aria-label={t.approvalCriteria}>
      <ReadOnlyScope on={readOnly}>
        <section className="odm-or-review-section">
          <OrderReadinessCard
            orderId={order.id}
            query={readinessQuery}
            editable={order.status === 'PENDING'}
            onDecisionDone={() => setNavigateHome(true)}
            onLocalBlockChange={setLocalDraftBlocked}
            actionsHost={decisionHost}
          />
        </section>
      </ReadOnlyScope>
      <ReviewStageActions
        step={3}
        onBack={() => goToStep(2)}
        onNext={() => goToStep(4)}
        nextLabel={t.nextLabel}
        hint={nextHint}
        nextDisabled={nextBlocked}
        decisionHostRef={setDecisionHost}
      />
    </div>
  )
}
