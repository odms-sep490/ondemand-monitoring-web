import type { DispatchStep } from './liveDispatchTypes'
import { useI18n } from '../../../../shared/i18n'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { resourceSteps, stepSubtitles } from './liveDispatchConstants'
import { OrderIcon } from './OrderIcon'

export function DispatchWizardTabs({
  activeStep,
  onStep,
  selectionOnly = false,
}: {
  activeStep: DispatchStep
  onStep: (step: DispatchStep) => void
  selectionOnly?: boolean
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  const activeStepIndex = resourceSteps.indexOf(activeStep)
  const stepLabels: Record<DispatchStep, string> = {
    order: t.orderTab,
    mission: t.missionTab,
    staff: t.staffTab,
    device: t.deviceTab,
    confirm: t.confirmTab,
  }
  return (
    <nav className="odm-or-card odm-or-tabs" aria-label={t.tabsAria}>
      <span className="odm-or-tabs-title">{t.resourceTabsTitle}</span>
      {resourceSteps.map((step, index) => (
        <button
          key={step}
          type="button"
          className={`odm-or-tab${activeStep === step ? ' is-active' : ''}${
            index < activeStepIndex ? ' is-done' : ''
          }`}
          aria-current={activeStep === step ? 'step' : undefined}
          disabled={selectionOnly}
          onClick={() => onStep(step)}
        >
          <span className="odm-or-tab-dot">
            {index < activeStepIndex ? (
              <OrderIcon name="check" size={14} />
            ) : (
              index + 1
            )}
          </span>
          <span className="odm-or-tab-text">
            <span className="odm-or-tab-label">{stepLabels[step]}</span>
            <span className="odm-or-tab-hint">
              {t[stepSubtitles[step]] as string}
            </span>
          </span>
        </button>
      ))}
    </nav>
  )
}
