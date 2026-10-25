import { Icon } from '../../../../../shared/components/Icon'
import { useI18n } from '../../../../../shared/i18n'
import { STEPS, type Step } from '../../../lib/createOrder/types'
import { stepTabsMessages } from './StepTabs.messages'

type Props = {
  step: Step
  /** Furthest step reached; steps up to it can be revisited in any order. */
  reached?: Step
  labels: Record<Step, string>
  onSelect: (step: Step) => void
}

/** Wizard progress; finished steps are clickable to go back. */
export function StepTabs({ step, reached = step, labels, onSelect }: Props) {
  const { t } = useI18n(stepTabsMessages)
  return (
    <div className="co-steps">
      {/* On phones the dots drop their titles, so the position is also written out. */}
      <p className="co-steps-progress">
        {t.progress(step, STEPS.length)} &middot; <strong>{labels[step]}</strong>
      </p>
      <nav className="co-tabs" aria-label={t.ariaLabel}>
      {STEPS.map((item) => {
        const done = item !== step && item <= reached
        const state = item === step ? 'is-active' : done ? 'is-done' : ''
        return (
          <button
            key={item}
            type="button"
            className={`co-tab ${state}`}
            aria-label={labels[item]}
            aria-current={item === step ? 'step' : undefined}
            disabled={item > reached}
            onClick={() => onSelect(item)}
          >
            <span className="co-tab-num">
              {done ? (
                <Icon name="check" width={14} height={14} aria-hidden="true" />
              ) : (
                item
              )}
            </span>
            <span className="co-tab-text">
              <span className="co-tab-title">{t.shortTitles[item]}</span>
              <span className="odm-visually-hidden">{labels[item]}</span>
              <span className="co-tab-sub">{t.subtitles[item]}</span>
            </span>
          </button>
        )
      })}
      </nav>
    </div>
  )
}
