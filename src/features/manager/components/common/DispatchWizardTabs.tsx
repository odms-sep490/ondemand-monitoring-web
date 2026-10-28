import type { DispatchStep } from './liveDispatchTypes'
import { useI18n } from '../../../../shared/i18n'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { resourceSteps } from './liveDispatchConstants'
import { OrderIcon } from './OrderIcon'
import '../../manager.css'

/** Assignment wizard steps, drawn like the order/mission workflow stepper (.odm-wf-*). */
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
    <nav aria-label={t.tabsAria} className="odm-or-card odm-wf mgr-wf-tabs">
      <ol className="odm-wf-steps">
        {resourceSteps.map((step, index) => {
          const state =
            activeStep === step
              ? 'current'
              : index < activeStepIndex
                ? 'done'
                : 'upcoming'
          return (
            <li key={step} className={`odm-wf-step is-${state}`}>
              <button
                type="button"
                className="odm-wf-btn"
                aria-current={activeStep === step ? 'step' : undefined}
                disabled={selectionOnly}
                onClick={() => onStep(step)}
              >
                <span className="odm-wf-dot">
                  {state === 'done' ? (
                    <OrderIcon name="check" size={15} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="odm-wf-text">
                  <strong>{stepLabels[step]}</strong>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
