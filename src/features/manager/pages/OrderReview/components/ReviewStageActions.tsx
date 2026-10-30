import { useContext } from 'react'
import { createPortal } from 'react-dom'

import type { ReviewStep } from '../reviewTypes'
import { REVIEW_PAGE_COUNT } from '../reviewHelpers'
import { ThunderboltOutlined } from '@ant-design/icons'

import { CardComponent } from '../../../../../shared/components/antd'
import { Button } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'
import { reviewStageActionsMessages } from './ReviewStageActions.messages'
import { ReviewActionsSlot } from './ReviewActionsSlot'

export function ReviewStageActions({
  step,
  onBack,
  onNext,
  nextLabel,
  hint,
  nextDisabled = false,
  compact = false,
  decisionHostRef,
}: {
  step: ReviewStep
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  hint?: string | null
  nextDisabled?: boolean
  compact?: boolean
  /** Receives an empty container in the card for relocated decision buttons. */
  decisionHostRef?: (el: HTMLDivElement | null) => void
}) {
  const { t } = useI18n(reviewStageActionsMessages)
  const { t: page } = useI18n(orderReviewPageMessages)
  const slot = useContext(ReviewActionsSlot)
  const body = (
    <>
      <span className="odm-or-review-stage-progress">
        {step === 4 ? t.pricingStep : t.step(step, REVIEW_PAGE_COUNT)}
      </span>
      {hint ? (
        <span className="odm-or-review-stage-hint" role="status">
          {hint}
        </span>
      ) : null}
      {decisionHostRef ? (
        <div ref={decisionHostRef} className="mgr-decision-host" />
      ) : null}
      <div className="mgr-actions">
        {onNext ? (
          <Button
            type="button"
            variant="primary"
            onClick={onNext}
            disabled={nextDisabled}
          >
            {nextLabel ?? t.nextDefault}
          </Button>
        ) : null}
        {onBack ? (
          <Button type="button" onClick={onBack}>
            {t.back}
          </Button>
        ) : null}
      </div>
    </>
  )
  // Inside the review layout, actions live in the context card or sidebar.
  if (slot === undefined) {
    return <div className="odm-or-review-stage-actions">{body}</div>
  }
  if (slot === null) return null
  if (compact) {
    return createPortal(
      <div
        className="mgr-stage-actions is-compact"
        role="group"
        aria-label={page.stageActionsTitle}
      >
        {body}
      </div>,
      slot,
    )
  }
  return createPortal(
    <CardComponent
      icon={<ThunderboltOutlined />}
      title={page.stageActionsTitle}
      className="mgr-stage-actions"
    >
      {body}
    </CardComponent>,
    slot,
  )
}
