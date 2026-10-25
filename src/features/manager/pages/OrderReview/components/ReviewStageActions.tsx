import type { ReviewStep } from '../reviewTypes'
import { REVIEW_PAGE_COUNT } from '../reviewHelpers'

export function ReviewStageActions({
  step,
  onBack,
  onNext,
  nextLabel = 'Tiếp: Điều kiện duyệt',
  hint,
  nextDisabled = false,
}: {
  step: ReviewStep
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  hint?: string | null
  nextDisabled?: boolean
}) {
  return (
    <div className="odm-or-review-stage-actions">
      {onBack ? (
        <button type="button" className="odm-btn" onClick={onBack}>
          Quay lại
        </button>
      ) : null}
      <span className="odm-or-review-stage-progress">
        Bước {step}/{REVIEW_PAGE_COUNT}
      </span>
      {hint ? (
        <span className="odm-or-review-stage-hint" role="status">
          {hint}
        </span>
      ) : null}
      {onNext ? (
        <button
          type="button"
          className="odm-btn odm-btn-p"
          onClick={onNext}
          disabled={nextDisabled}
        >
          {nextLabel}
        </button>
      ) : null}
    </div>
  )
}
