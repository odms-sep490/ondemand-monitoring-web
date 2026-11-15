import { useI18n } from '../../shared/i18n'
import { deliveryProgressMessages } from './deliveryProgress.messages'
import type { DeliveryStatus } from './types'

type DeliveryStatusMeta = { tone: string; step: number }

const FALLBACK_STATUS_META: DeliveryStatusMeta = { tone: 'neutral', step: -1 }

const STATUS_META: Record<DeliveryStatus, DeliveryStatusMeta> = {
  PROCESSING: { tone: 'neutral', step: 0 },
  READY_FOR_MANAGER_REVIEW: { tone: 'warning', step: 0 },
  CUSTOMER_REVIEW: { tone: 'info', step: 1 },
  REVISION_REQUESTED: { tone: 'warning', step: 1 },
  AWAITING_MISSION_PAYMENT: { tone: 'warning', step: 2 },
  FINAL_PAYMENT_PENDING: { tone: 'success', step: 2 },
  PAYMENT_CONFIRMED: { tone: 'success', step: 2 },
  READY_FOR_DELIVERY: { tone: 'info', step: 2 },
  DELIVERED: { tone: 'success', step: 3 },
}

function getStatusMeta(status: DeliveryStatus): DeliveryStatusMeta {
  return STATUS_META[status] ?? FALLBACK_STATUS_META
}

export function DeliveryStatusPill({
  status,
  label,
  tone,
}: {
  status: DeliveryStatus
  label?: string
  tone?: string
}) {
  const { t } = useI18n(deliveryProgressMessages)
  const meta = getStatusMeta(status)
  return (
    <span className={`delivery-status delivery-status--${tone ?? meta.tone}`}>
      {label ?? t.status[status] ?? t.unknownStatus}
    </span>
  )
}

export function DeliveryProgress({
  status,
  originalsAvailable,
}: {
  status: DeliveryStatus
  originalsAvailable?: boolean
}) {
  const { t } = useI18n(deliveryProgressMessages)
  const currentStep =
    status === 'DELIVERED' && originalsAvailable === false
      ? 2
      : getStatusMeta(status).step
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
