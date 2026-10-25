import { ReadOnlyScope } from './ReadOnlyScope'
import { OrderReadinessCard } from './OrderReadinessCard'
import { ReviewStageActions } from './ReviewStageActions'
import type { OrderDetail } from '../../../types/orders'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { OrderReadiness } from '../../../types/readiness'
import { useState, type Dispatch, type SetStateAction } from 'react'
import type { ReviewStep } from '../reviewTypes'

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
  const [localDraftBlocked, setLocalDraftBlocked] = useState(false)
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
        ? `Có ${failedRequired} tiêu chí bắt buộc không đạt — không thể tiếp tục sang checklist và báo giá`
        : localDraftBlocked
          ? 'Có tiêu chí bắt buộc đang chọn Không đạt — hãy nhập lý do và lưu quyết định'
          : pendingRequired > 0
            ? `Còn ${pendingRequired} mục bắt buộc chưa xác nhận — chưa thể duyệt báo giá`
            : 'Điều kiện duyệt chưa đạt — không thể tiếp tục sang checklist và báo giá'

  return (
    <div className="odm-or-review-stage" aria-label="Điều kiện duyệt">
      <ReadOnlyScope on={readOnly}>
        <section className="odm-or-review-section">
          <OrderReadinessCard
            orderId={order.id}
            query={readinessQuery}
            editable={order.status === 'PENDING'}
            onDecisionDone={() => setNavigateHome(true)}
            onLocalBlockChange={setLocalDraftBlocked}
          />
        </section>
      </ReadOnlyScope>
      <ReviewStageActions
        step={3}
        onBack={() => goToStep(2)}
        onNext={() => goToStep(4)}
        nextLabel="Tiếp: Checklist & báo giá"
        hint={nextHint}
        nextDisabled={nextBlocked}
      />
    </div>
  )
}
