import { Card } from '../../../../../shared/components/ui'
import { useI18n, useLanguage } from '../../../../../shared/i18n'
import type { OrderStatus } from '../../../../../shared/types/domain'
import { OrderIcon, type OrderIconName } from '../../../../manager/components/common/OrderIcon'
import { fmtDateTime, getOrderStatusMeta } from '../../../lib/orderStatus'
import { buildOrderSteps, type OrderMissionProgress } from '../../../lib/orders/orderSteps'
import type { CustomerFinanceState } from '../../../../finance/CustomerFinance'
import type { OrderStep, OrderStepKey, OrderTimelineEvent } from '../../../lib/orders/types'
import { CardTitle } from './CardTitle'
import { orderTimelineMessages } from './OrderTimeline.messages'

/** Terminal steps are the same thing as an order status, so they reuse its label. */
const TERMINAL_STATUS: Partial<Record<OrderStepKey, OrderStatus>> = {
  rejected: 'REJECTED',
  cancelled: 'CANCELLED',
}

const MARKER_ICON: Partial<Record<OrderStep['state'], OrderIconName>> = {
  done: 'check',
  failed: 'x',
  cancelled: 'minus',
}

/** Vertical progress stepper derived from the status and the few dates the BE returns. */
export function OrderTimeline({ status, events, finance, missions = [] }: { status: OrderStatus; events: OrderTimelineEvent[]; finance?: CustomerFinanceState; missions?: OrderMissionProgress[] }) {
  const { t, locale } = useI18n(orderTimelineMessages)
  const { lang } = useLanguage()
  const steps = buildOrderSteps(status, events, finance, missions)
  if (steps.length === 0) return null

  const stageLabel: Record<OrderStepKey, string> = {
    submitted: t.stepSubmitted,
    approved: t.stepReview,
    quote: t.stepQuote,
    deposit: t.stepDeposit,
    planning: t.stepPlanning,
    inProgress: t.stepMonitoring,
    completed: t.stepCompleted,
    rejected: '',
    cancelled: '',
  }
  const label = (step: OrderStep) => {
    const terminal = TERMINAL_STATUS[step.key]
    return terminal ? getOrderStatusMeta(terminal, lang).label : stageLabel[step.key]
  }
  const hint = (step: OrderStep) => {
    if (step.state !== 'current') return null
    if (step.key === 'approved') return status === 'NEEDS_INFO' ? t.hintNeedsInfo : t.hintReview
    if (step.key === 'quote') return t.hintQuote
    if (step.key === 'deposit') return t.hintDeposit
    if (step.key === 'planning') return t.hintPlanning
    return status === 'IN_PROGRESS' ? t.hintRunning : t.hintWaiting
  }

  return (
    <Card title={<CardTitle icon="clock">{t.title}</CardTitle>}>
      <ol className="od-steps">
        {steps.map((step) => {
          const icon = MARKER_ICON[step.state]
          const stepHint = hint(step)
          return (
            <li
              key={step.key}
              className={`od-step is-${step.state}`}
              aria-current={step.state === 'current' ? 'step' : undefined}
            >
              <span className="od-step-marker" aria-hidden="true">
                {icon && <OrderIcon name={icon} size={14} />}
              </span>
              <div className="od-step-body">
                <div className="od-step-label">{label(step)}</div>
                {stepHint && <div className="od-step-hint">{stepHint}</div>}
                {step.at && (
                  <div className="od-step-meta">
                    {fmtDateTime(step.at, locale)}
                    {step.actor ? ` · ${t.by(step.actor)}` : ''}
                  </div>
                )}
                {step.note && <div className="od-step-note">{step.note}</div>}
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
