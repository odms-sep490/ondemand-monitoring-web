import { Alert, Button } from 'antd'
import { env } from '../../config/env'
import { StatusTag } from '../../shared/components/antd'
import { useI18n } from '../../shared/i18n'
import { formatVnd } from '../../shared/lib/formatVnd'
import {
  canPayMissionMilestone,
  hasActiveMissionCheckout,
} from '../finance/missionMilestoneUtils'
import type { MissionPaymentMilestone } from '../finance/types'
import { customerDeliveryPanelMessages } from './customerDeliveryPanel.messages'

const MILESTONE_TONE: Record<
  string,
  'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  NOT_YET_DUE: 'neutral',
  UNPAID: 'warning',
  PENDING: 'info',
  EXPIRED: 'danger',
  PAID: 'success',
  CANCELLED: 'neutral',
}

type DeliveryMissionPaymentCardProps = {
  milestone: MissionPaymentMilestone | null
  loading: boolean
  isAwaitingConfirmation: boolean
  partiallyDownloadable: boolean
  downloadableCount: number
  totalAssets: number
  paying: boolean
  error: string | null
  onPay: (milestoneId: string) => void
  onTestPay: (milestoneId: string) => void
  onOpenFinance?: () => void
}

/**
 * Inline Mission payment card shown right inside the delivery panel once results
 * are accepted so customers can pay and unlock original downloads without switching tabs.
 */
export function DeliveryMissionPaymentCard({
  milestone,
  loading,
  isAwaitingConfirmation,
  partiallyDownloadable,
  downloadableCount,
  totalAssets,
  paying,
  error,
  onPay,
  onTestPay,
  onOpenFinance,
}: DeliveryMissionPaymentCardProps) {
  const { t, locale } = useI18n(customerDeliveryPanelMessages)

  if (!milestone) {
    const title = isAwaitingConfirmation
      ? t.resultsAcceptedTitle
      : partiallyDownloadable
        ? t.partialOriginalsTitle
        : t.awaitingMissionPaymentTitle
    const description = loading
      ? t.missionPaymentLoading
      : isAwaitingConfirmation
        ? t.resultsAcceptedText
        : partiallyDownloadable
          ? t.partialOriginalsText(downloadableCount, totalAssets)
          : t.awaitingMissionPaymentText

    return (
      <Alert
        type={isAwaitingConfirmation ? 'info' : 'warning'}
        showIcon
        message={title}
        description={description}
        action={
          onOpenFinance ? (
            <Button type="primary" ghost onClick={onOpenFinance}>
              {t.goToFinanceTab}
            </Button>
          ) : undefined
        }
      />
    )
  }

  const hasActiveCheckout = hasActiveMissionCheckout(milestone)
  const canPay = canPayMissionMilestone(milestone)
  const latestPayment = milestone.payments[0]
  const formattedAmount = formatVnd(milestone.amount)
  const deadline =
    milestone.paymentExpiresAt &&
    Number.isFinite(Date.parse(milestone.paymentExpiresAt))
      ? new Date(milestone.paymentExpiresAt).toLocaleString(locale)
      : null

  const ctaLabel = hasActiveCheckout
    ? t.missionContinuePayment(formattedAmount)
    : latestPayment?.status === 'FAILED'
      ? t.missionRetryPayment(formattedAmount)
      : t.missionPayNow(formattedAmount)

  const bodyText =
    milestone.status === 'EXPIRED'
      ? t.missionPaymentExpiredText
      : partiallyDownloadable
        ? t.missionPaymentPartialBody(downloadableCount, totalAssets)
        : milestone.status === 'PENDING'
          ? t.missionPaymentPendingText
          : t.missionPaymentBody

  return (
    <article
      className={`delivery-mission-pay-card${milestone.status === 'EXPIRED' ? ' is-expired' : ''}`}
      aria-labelledby="delivery-mission-pay-title"
    >
      <div className="delivery-mission-pay-card__top">
        <div className="delivery-mission-pay-card__meta">
          <div className="delivery-mission-pay-card__tags">
            <span className="delivery-mission-pay-card__eyebrow">
              {t.missionPaymentEyebrow}
            </span>
            {milestone.missionCode ? (
              <span className="delivery-mission-pay-card__code">
                {milestone.missionCode}
              </span>
            ) : null}
            <StatusTag tone={MILESTONE_TONE[milestone.status] ?? 'warning'}>
              {t.missionPaymentStatus[milestone.status] ?? milestone.status}
            </StatusTag>
          </div>
          <h3 id="delivery-mission-pay-title">
            {milestone.status === 'EXPIRED'
              ? t.missionPaymentExpiredTitle
              : t.missionPaymentTitle}
          </h3>
          <p>{bodyText}</p>
        </div>

        <div className="delivery-mission-pay-card__summary">
          <strong>{formattedAmount}</strong>
          <small>
            {milestone.scopeLabel?.trim() ||
              milestone.missionCode ||
              t.missionScopeFallback}
          </small>
          {deadline ? (
            <time dateTime={milestone.paymentExpiresAt ?? undefined}>
              {t.missionDeadlineLabel(deadline)}
            </time>
          ) : null}
        </div>
      </div>

      {error ? <Alert type="error" showIcon message={error} /> : null}

      <div className="delivery-mission-pay-card__actions">
        {canPay ? (
          <Button
            type="primary"
            size="large"
            loading={paying}
            disabled={paying}
            onClick={() => onPay(milestone.id)}
          >
            {ctaLabel}
          </Button>
        ) : null}
        {env.testPaymentsEnabled && canPay ? (
          <Button
            size="large"
            disabled={paying}
            onClick={() => onTestPay(milestone.id)}
          >
            {t.missionTestPayment}
          </Button>
        ) : null}
        {onOpenFinance ? (
          <Button type="link" onClick={onOpenFinance}>
            {t.viewInvoiceDetails}
          </Button>
        ) : null}
      </div>
    </article>
  )
}
