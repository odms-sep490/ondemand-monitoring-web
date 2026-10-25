import { useI18n } from '../../../../../shared/i18n'
import type { Step } from '../../../lib/createOrder/types'
import { wizardFooterMessages } from './WizardFooter.messages'

type Props = {
  step: Step
  nextLabel: string
  submitDisabled: boolean
  nextDisabled?: boolean
  /** Why the primary button is disabled; shown right next to it. */
  blockedReason?: string | null
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
}

export function WizardFooter({ step, nextLabel, submitDisabled, nextDisabled = false, blockedReason = null, onBack, onNext, onSubmit }: Props) {
  const { t } = useI18n(wizardFooterMessages)
  return (
    <div className="co-footer">
      {step > 1 && (
        <button type="button" className="odm-btn odm-btn-gh" onClick={onBack}>
          {t.back}
        </button>
      )}
      <span className="co-draft-note">{t.draftNote}</span>
      <div className="co-footer-spacer" />
      {blockedReason && (
        <span className="co-footer-blocked" role="status">
          {blockedReason}
        </span>
      )}
      {step < 6 ? (
        <button type="button" className="odm-btn odm-btn-p" onClick={onNext} disabled={nextDisabled}>
          {t.continueTo} {nextLabel}
        </button>
      ) : (
        <button type="button" className="odm-btn odm-btn-p" onClick={onSubmit} disabled={submitDisabled}>
          {t.submit}
        </button>
      )}
    </div>
  )
}
