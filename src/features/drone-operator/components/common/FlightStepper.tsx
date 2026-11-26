import { useI18n } from '../../../../shared/i18n'
import { flightStepperMessages } from './FlightStepper.messages'
import './FlightStepper.css'

/** The shared mission progress bar used by every operator screen. */
export function FlightStepper({
  active,
  completed = false,
  completedLabel,
  failed = false,
  stepTimes,
}: {
  active: number
  stepTimes?: ReadonlyArray<{ dateTime: string; label: string } | null>
  completed?: boolean
  completedLabel?: string
  failed?: boolean
}) {
  const { t } = useI18n(flightStepperMessages)
  const steps = t.steps
  const currentIndex = Math.max(0, Math.min(active, steps.length - 1))
  const currentStepLabel = failed
    ? t.failedSummary
    : completed
      ? (completedLabel ?? t.finished)
      : t.stepCounter(currentIndex + 1, steps.length, steps[currentIndex].label)

  return (
    <div className="odm-flight-stepper-wrap">
      <ol className="odm-flight-stepper" aria-label={t.progressName}>
        {steps.map((step, index) => {
          const failedStep = failed && index === currentIndex
          const done = !failedStep && (completed || index < currentIndex)
          const current = !completed && !failed && index === currentIndex
          const state = failedStep
            ? t.failed
            : done
              ? t.completed
              : current
                ? t.current
                : t.upcoming
          const time = stepTimes?.[index]
          const accessibleName = `${step.label} — ${state} (${index + 1}/${steps.length})`

          return (
            <li
              key={step.key}
              className={`odm-flight-step${done ? ' is-complete' : ''}${current ? ' is-current' : ''}${failedStep ? ' is-failed' : ''}`}
              aria-current={current ? 'step' : undefined}
              aria-label={time ? accessibleName + ' · ' + time.label : accessibleName}
              title={accessibleName}
            >
              <span className="odm-flight-step-chip" aria-hidden="true">
                {failedStep ? (
                  <span aria-hidden="true">×</span>
                ) : done ? (
                  <svg
                    className="odm-flight-step-check"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="m3 8.5 3.2 3.2L13 4.8" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span className="odm-flight-step-copy">
                <span className="odm-flight-step-label">{step.label}</span>
                <span className="odm-flight-step-state">{state}</span>
                {time && <time className="odm-flight-step-time" dateTime={time.dateTime}>{time.label}</time>}
              </span>
              {index < steps.length - 1 && (
                <span className="odm-flight-step-connector" aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ol>
      <p className="odm-flight-stepper-summary" aria-live="polite">
        {currentStepLabel}
      </p>
    </div>
  )
}

/** Sub-header bar used by OPR-04/05/06: title, mono mission id, right-side slot (workflow stepper is shown only on Mission Detail). */
export function FlightStepHeader({
  title,
  missionId,
  right,
  idTitle,
}: {
  title: string
  missionId: string
  active: number
  completed?: boolean
  completedLabel?: string
  /** Marks the active terminal step as a failed workflow, not an in-progress step. */
  failed?: boolean
  right?: React.ReactNode
  /** Full identifier shown as a tooltip when `missionId` is a short code. */
  idTitle?: string
}) {
  return (
    <header className="odm-flight-step-header">
      <div className="odm-flight-step-heading">
        <h1 className="odm-flight-step-title">{title}</h1>
        <div className="odm-mono odm-flight-step-mission" title={idTitle}>
          {missionId}
        </div>
      </div>
      <div className="odm-flight-step-right">
        {right ?? <span aria-hidden="true" />}
      </div>
    </header>
  )
}
