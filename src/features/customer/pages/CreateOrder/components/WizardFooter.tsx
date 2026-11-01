import { Button } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import type { Step } from '../../../lib/createOrder/types'
import { wizardFooterMessages } from './WizardFooter.messages'

type Props = {
  step: Step
  nextLabel: string
  submitDisabled: boolean
  submitting?: boolean
  nextDisabled?: boolean
  /** Why the primary button is disabled; shown right next to it. */
  blockedReason?: string | null
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
}

export function WizardFooter({
  step,
  nextLabel,
  submitDisabled,
  submitting = false,
  nextDisabled = false,
  blockedReason = null,
  onBack,
  onNext,
  onSubmit,
}: Props) {
  const { t } = useI18n(wizardFooterMessages)
  return (
    <div className="co-footer">
      <div className="co-footer-meta">
        <span className="co-draft-note">{t.draftNote}</span>
        {blockedReason && (
          <span className="co-footer-blocked" role="status">
            {blockedReason}
          </span>
        )}
      </div>
      <div className="co-footer-actions" data-has-back={step > 1}>
        {step > 1 && <Button onClick={onBack}>{t.back}</Button>}
        {step < 6 ? (
          <Button
            type="primary"
            onClick={onNext}
            disabled={nextDisabled}
            aria-label={`${t.continueTo} ${nextLabel}`}
          >
            {t.continue}
            <span className="co-footer-next-label">: {nextLabel}</span>
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={onSubmit}
            disabled={submitDisabled}
            loading={submitting}
            aria-busy={submitting}
          >
            {submitting ? t.submitting : t.submit}
          </Button>
        )}
      </div>
    </div>
  )
}
