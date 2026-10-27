import { Icon } from '../../../shared/components/Icon'
import { StatusBadge } from '../../../shared/components/ui/StatusBadge'
import type { SafeStop } from '../../manager/types/planning'
import { useI18n } from '../../../shared/i18n'
import { safeStopPresentationMessages } from '../lib/safeStopPresentation.messages'
import { safeStopFailure, safeStopPhase } from '../lib/safeStopPresentation'
import './SafeStopSummary.css'

export function SafeStopRefresh({
  disabled,
  onClick,
}: {
  disabled: boolean
  onClick: () => void
}) {
  const { t } = useI18n(safeStopPresentationMessages)
  return (
    <button
      type="button"
      className="odm-btn mission-stop__refresh"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name="activity" width={16} height={16} /> {t.refresh}
    </button>
  )
}

export function SafeStopSummary({
  stop,
  actor,
}: {
  stop: SafeStop | null | undefined
  actor: 'staff' | 'manager'
}) {
  const { t, locale } = useI18n(safeStopPresentationMessages)
  const phase = safeStopPhase(stop)
  const [label, description] = t[actor][phase]
  const tone =
    phase === 'failed'
      ? 'danger'
      : ['confirmed', 'cleaned'].includes(phase)
        ? 'success'
        : phase === 'notRequested' || phase === 'unknown'
          ? 'neutral'
          : 'warning'
  const steps = [
    { label: t.stepRequested, done: Boolean(stop?.requestedAt) },
    {
      label: t.stepConfirmed,
      done:
        Boolean(stop?.confirmedAt) ||
        (stop?.requiresLanding === false && Boolean(stop?.cleanedAt)),
    },
    { label: t.stepCleaned, done: Boolean(stop?.cleanedAt) },
    ...(actor === 'manager' ? [{ label: t.stepCancel, done: false }] : []),
  ]
  const current = steps.findIndex((step) => !step.done)
  return (
    <div className="mission-stop__summary">
      <StatusBadge tone={tone}>{label}</StatusBadge>
      <p className="mission-stop__description">
        {actor === 'manager' &&
        ['requested', 'inProgress'].includes(phase) &&
        stop?.canCleanupSafeStop === true &&
        !stop?.confirmedAt
          ? t.cleanupHint
          : description}
      </p>
      {phase === 'failed' && (
        <p role="alert" className="mission-stop__warning">
          {safeStopFailure(stop?.failureReason ?? null)}
        </p>
      )}
      {phase !== 'unknown' &&
        (actor === 'manager' || phase !== 'notRequested') && (
          <ol
            className="mission-stop__progress"
            aria-label={t.progressAria}
          >
            {steps.map((step, index) => (
              <li
                key={step.label}
                className={
                  step.done ? 'is-done' : index === current ? 'is-current' : ''
                }
                aria-current={index === current ? 'step' : undefined}
                aria-label={`${step.label} — ${step.done ? t.recorded : t.notRecorded}`}
              >
                <span className="mission-stop__step-icon">
                  <Icon
                    name={step.done ? 'check' : 'clock'}
                    width={14}
                    height={14}
                  />
                </span>
                <span>{step.label}</span>
              </li>
            ))}
          </ol>
        )}
      {stop?.confirmedAt && (
        <p className="mission-stop__meta">
          {t.confirmedAt(new Date(stop.confirmedAt).toLocaleString(locale))}
        </p>
      )}
    </div>
  )
}
