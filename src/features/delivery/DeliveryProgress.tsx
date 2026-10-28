import { useI18n } from '../../shared/i18n'
import { deliveryProgressMessages } from './deliveryProgress.messages'
import type { DeliveryStatus } from './types'

const STATUS_META: Record<DeliveryStatus, { tone: string; step: number }> = {
  PROCESSING: { tone: 'neutral', step: 0 },
  READY_FOR_MANAGER_REVIEW: { tone: 'warning', step: 0 },
  CUSTOMER_REVIEW: { tone: 'info', step: 1 },
  REVISION_REQUESTED: { tone: 'warning', step: 1 },
  FINAL_PAYMENT_PENDING: { tone: 'warning', step: 2 },
  PAYMENT_CONFIRMED: { tone: 'success', step: 3 },
  READY_FOR_DELIVERY: { tone: 'info', step: 3 },
  DELIVERED: { tone: 'success', step: 4 },
}

export function DeliveryStatusPill({ status }: { status: DeliveryStatus }) {
  const { t } = useI18n(deliveryProgressMessages)
  const meta = STATUS_META[status]
  return (
    <span className={`delivery-status delivery-status--${meta.tone}`}>
      {t.status[status]}
    </span>
  )
}

export function DeliveryProgress({ status }: { status: DeliveryStatus }) {
  const { t } = useI18n(deliveryProgressMessages)
  const currentStep = STATUS_META[status].step
  return (
    <ol className="delivery-progress" aria-label={t.ariaLabel}>
      {t.steps.map((step, index) => {
        const completed = currentStep > index
        const current = currentStep === index
        return (
          <li
            key={step.label}
            className={
              completed ? 'is-complete' : current ? 'is-current' : undefined
            }
            aria-current={current ? 'step' : undefined}
          >
            <span className="delivery-progress__marker" aria-hidden="true">
              {completed ? '✓' : index + 1}
            </span>
            <span className="delivery-progress__label">
              <span className="delivery-progress__full">{step.label}</span>
              <span className="delivery-progress__short">
                {step.shortLabel}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
