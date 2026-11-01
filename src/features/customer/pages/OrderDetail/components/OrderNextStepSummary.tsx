import { ArrowRightOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { useI18n, useLanguage } from '../../../../../shared/i18n'
import type { Invoice } from '../../../../finance/types'
import type { CustomerMissionSummary } from '../../../api/customerMissionReportApi'
import { getMissionStatusMeta } from '../../../lib/orderStatus'
import type { MissionStatus } from '../../../../../shared/types/domain'
import { DeliveryStatusPill } from '../../../../delivery/DeliveryProgress'
import { deliveryProgressMessages } from '../../../../delivery/deliveryProgress.messages'
import type {
  Delivery,
  DeliveryPanelLoadState,
} from '../../../../delivery/types'
import { orderDetailPageMessages } from '../OrderDetailPage.messages'

export type PaymentCopy = {
  paymentUnavailable: string
  paymentPaid: string
  paymentPartial: (amount: string) => string
  paymentDue: (amount: string) => string
  paymentOverdue: (amount: string) => string
  paymentCancelled: string
  paymentRefunded: string
}

export type MissionCopy = {
  missionUnavailable: string
  missionLoading: string
  missionError: string
  missionStatusUnknown: string
  missionSummary: (count: number, statuses: string) => string
}

const MISSION_STATUSES: ReadonlySet<string> = new Set([
  'PLANNING',
  'CREATED',
  'WAITING_DEPOSIT',
  'READY',
  'RESOURCE_ASSIGNING',
  'WAITING_OPERATOR_ACCEPTANCE',
  'SCHEDULED',
  'CONNECTED',
  'PREFLIGHT_CHECKING',
  'READY_TO_FLY',
  'FAILED_PREFLIGHT',
  'PENDING_APPROVAL',
  'IN_FLIGHT',
  'IN_PROGRESS',
  'RETURNING',
  'POSTFLIGHT_CHECKING',
  'PENDING_REVIEW',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
])

export function OrderNextStepSummary({
  delivery,
  deliveryState,
  missions,
  missionLoading,
  missionError,
  onPrimaryAction,
}: {
  delivery: Delivery | null
  deliveryState: DeliveryPanelLoadState
  missions: CustomerMissionSummary[]
  missionLoading: boolean
  missionError: boolean
  onPrimaryAction: () => void
}) {
  const { t } = useI18n(orderDetailPageMessages)
  const { t: deliveryT } = useI18n(deliveryProgressMessages)
  const { lang } = useLanguage()

  const resultLabel = delivery
    ? deliveryT.status[delivery.deliveryStatus]
    : deliveryState === 'loading'
      ? t.resultLoading
      : deliveryState === 'error'
        ? t.resultError
        : t.resultUnavailable
  const missionLabel = getMissionLabel(
    delivery,
    missions,
    missionLoading,
    missionError,
    lang,
    t,
  )
  const paymentLabel = delivery
    ? getPaymentLabel(delivery, t)
    : t.paymentUnavailable
  const primaryLabel = getPrimaryLabel(delivery, t)

  return (
    <section className="od-next-step" aria-labelledby="od-next-step-title">
      <header className="od-next-step__header">
        <div>
          <h2 id="od-next-step-title">{t.nextStepTitle}</h2>
          <p>{t.nextStepDescription}</p>
        </div>
      </header>

      <dl
        className="od-next-step__grid"
        aria-live="polite"
        aria-busy={deliveryState === 'loading' || missionLoading}
      >
        <div className="od-next-step__item">
          <dt>{t.missionStatus}</dt>
          <dd>{missionLabel}</dd>
        </div>
        <div className="od-next-step__item">
          <dt>{t.resultStatus}</dt>
          <dd>
            {delivery ? (
              <DeliveryStatusPill status={delivery.deliveryStatus} />
            ) : (
              <span className="od-next-step__result">{resultLabel}</span>
            )}
          </dd>
        </div>
        <div className="od-next-step__item">
          <dt>{t.paymentStatus}</dt>
          <dd>{paymentLabel}</dd>
        </div>
      </dl>

      <div className="od-next-step__action">
        <Button type="primary" onClick={onPrimaryAction}>
          {primaryLabel}
          <ArrowRightOutlined aria-hidden="true" />
        </Button>
      </div>
    </section>
  )
}

export function getMissionLabel(
  delivery: Pick<Delivery, 'missionStatus'> | null,
  missions: CustomerMissionSummary[],
  loading: boolean,
  error: boolean,
  lang: 'vi' | 'en',
  t: MissionCopy,
) {
  if (delivery) {
    if (!MISSION_STATUSES.has(delivery.missionStatus))
      return t.missionStatusUnknown
    return getMissionStatusMeta(delivery.missionStatus as MissionStatus, lang)
      .label
  }
  if (loading) return t.missionLoading
  if (error) return t.missionError

  const currentMissions = getCurrentMissions(missions)
  if (currentMissions.length === 0) return t.missionUnavailable

  const counts = new Map<string, number>()
  for (const mission of currentMissions) {
    const label = MISSION_STATUSES.has(mission.status)
      ? getMissionStatusMeta(mission.status, lang).label
      : t.missionStatusUnknown
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  if (counts.size === 1) return counts.keys().next().value as string

  const statusSummary = [...counts]
    .map(([label, count]) => (count > 1 ? `${label} (${count})` : label))
    .join(', ')
  return t.missionSummary(currentMissions.length, statusSummary)
}

function getCurrentMissions(missions: CustomerMissionSummary[]) {
  const replacedIds = new Set(
    missions
      .map((mission) => mission.replacesMissionId)
      .filter((id): id is string => Boolean(id)),
  )
  const current = missions.filter(
    (mission) => !replacedIds.has(mission.missionId),
  )
  return current.length > 0 ? current : missions
}

export function getPaymentLabel(
  delivery: Pick<
    Delivery,
    'totalAmount' | 'paidAmount' | 'remainingAmount' | 'invoiceStatus'
  >,
  t: PaymentCopy,
) {
  const { totalAmount, paidAmount, remainingAmount, invoiceStatus } = delivery
  if (
    !Number.isFinite(totalAmount) ||
    totalAmount <= 0 ||
    !Number.isFinite(paidAmount) ||
    paidAmount < 0 ||
    !Number.isFinite(remainingAmount) ||
    remainingAmount < 0
  ) {
    return t.paymentUnavailable
  }

  switch (invoiceStatus as Invoice['status']) {
    case 'PAID':
      return t.paymentPaid
    case 'PARTIALLY_PAID':
      return paidAmount > 0 && remainingAmount > 0
        ? t.paymentPartial(formatVnd(remainingAmount))
        : t.paymentUnavailable
    case 'ISSUED':
      return remainingAmount > 0
        ? t.paymentDue(formatVnd(remainingAmount))
        : t.paymentUnavailable
    case 'OVERDUE':
      return remainingAmount > 0
        ? t.paymentOverdue(formatVnd(remainingAmount))
        : t.paymentUnavailable
    case 'CANCELLED':
      return t.paymentCancelled
    case 'REFUNDED':
      return t.paymentRefunded
    default:
      return t.paymentUnavailable
  }
}

function getPrimaryLabel(
  delivery: Delivery | null,
  t: {
    reviewResults: string
    payFinal: string
    viewFinalResults: string
    viewDeliveryProgress: string
  },
) {
  if (!delivery) return t.viewDeliveryProgress
  if (delivery.deliveryStatus === 'CUSTOMER_REVIEW') return t.reviewResults
  if (delivery.deliveryStatus === 'FINAL_PAYMENT_PENDING') return t.payFinal
  if (delivery.deliveryStatus === 'DELIVERED') return t.viewFinalResults
  return t.viewDeliveryProgress
}
