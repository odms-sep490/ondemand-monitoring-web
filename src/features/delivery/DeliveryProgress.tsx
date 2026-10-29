import { Steps } from 'antd'

import { StatusTag, type StatusTagTone } from '../../shared/components/antd'
import { useI18n } from '../../shared/i18n'
import { deliveryProgressMessages } from './deliveryProgress.messages'
import type { DeliveryStatus } from './types'

const STATUS_META: Record<
  DeliveryStatus,
  { tone: StatusTagTone; step: number }
> = {
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
  return (
    <StatusTag tone={STATUS_META[status].tone}>{t.status[status]}</StatusTag>
  )
}

export function DeliveryProgress({ status }: { status: DeliveryStatus }) {
  const { t } = useI18n(deliveryProgressMessages)
  const currentStep = STATUS_META[status].step
  return (
    <div className="delivery-progress" aria-label={t.ariaLabel}>
      <Steps
        size="small"
        current={currentStep}
        responsive
        items={t.steps.map((step) => ({ key: step.label, title: step.label }))}
      />
    </div>
  )
}
