import { useI18n } from '../../../../shared/i18n'
import { flightStepperMessages } from './FlightStepper.messages'
import './FlightStepper.css'

/** Stepper header shared by the flight-prep screens (OPR-04/05/06). `active` is the current step index (0-based). */
export function FlightStepper({ active }: { active: number }) {
  const { t } = useI18n(flightStepperMessages)
  const steps = t.steps
  const currentIndex = Math.max(0, Math.min(active, steps.length - 1))

  return (
    <ol className="odm-flight-stepper" aria-label={t.progressName}>
      {steps.map((step, index) => {
        const done = index < currentIndex
        const current = index === currentIndex
        const state = done ? t.completed : current ? t.current : t.upcoming
        const accessibleName = `${step.label} — ${state} (${index + 1}/${steps.length})`

        return (
          <li
            key={step.key}
            className={`odm-flight-step${done ? ' is-complete' : ''}${current ? ' is-current' : ''}`}
            aria-current={current ? 'step' : undefined}
            aria-label={accessibleName}
            title={accessibleName}
            tabIndex={0}
          >
            <span className="odm-flight-step-chip">
              <span className="odm-flight-step-dot" aria-hidden="true">
                {done ? '✓' : index + 1}
              </span>
              {current && (
                <span className="odm-flight-step-current-label">
                  {t.stepCounter(index + 1, steps.length, step.label)}
                </span>
              )}
            </span>
            {index < steps.length - 1 && (
              <span className="odm-flight-step-connector" aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** Sub-header bar used by OPR-04/05/06: title, mono mission id, centered stepper, right-side slot. */
export function FlightStepHeader({
  title,
  missionId,
  active,
  right,
  idTitle,
}: {
  title: string
  missionId: string
  active: number
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
      <FlightStepper active={active} />
      <div className="odm-flight-step-right">
        {right ?? <span aria-hidden="true" />}
      </div>
    </header>
  )
}
