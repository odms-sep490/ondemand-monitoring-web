import { Alert, Button, Skeleton } from 'antd'
import { StatusTag } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import type {
  MissionPaymentAllocation,
  MissionPaymentMilestone,
} from '../../types'
import { env } from '../../../../config/env'
import { missionPaymentMilestoneMessages } from './MissionPaymentMilestonesSection.messages'

const tone: Record<
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

export function MissionPaymentMilestonesSection({
  allocation,
  loading,
  error,
  busy,
  onPay,
  onTestPay,
}: {
  allocation: MissionPaymentAllocation | null
  loading: boolean
  error: string | null
  busy: boolean
  onPay: (milestoneId: string) => void
  onTestPay: (milestoneId: string) => void
}) {
  const { t, locale } = useI18n(missionPaymentMilestoneMessages)

  // Allocation is Manager planning data, not evidence of a Customer handover.
  const handedOver =
    allocation?.milestones.filter(
      (milestone) =>
        milestone.handedOverAt != null &&
        Number.isFinite(Date.parse(milestone.handedOverAt)) &&
        milestone.status !== 'NOT_YET_DUE',
    ) ?? []
  if (handedOver.length === 0) return null
  const total = handedOver.reduce((sum, milestone) => sum + milestone.amount, 0)
  const paid = handedOver
    .filter((milestone) => milestone.status === 'PAID')
    .reduce((sum, milestone) => sum + milestone.amount, 0)
  return (
    <section
      className="mission-payment-card"
      aria-labelledby="mission-payment-title"
    >
      <header className="mission-payment-card__heading">
        <div>
          <h3 id="mission-payment-title">{t.title}</h3>
          <p>{t.description}</p>
        </div>
        <strong
          className="mission-payment-card__total"
          aria-label={t.paymentProgress}
        >
          {formatVnd(paid)} / {formatVnd(total)}
        </strong>
      </header>
      {loading ? (
        <div role="status" aria-busy="true">
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
      ) : null}
      {error ? <Alert type="error" showIcon message={error} /> : null}
      <div className="mission-payment-list">
        {handedOver.map((milestone) => (
          <MissionPaymentItem
            key={milestone.id}
            milestone={milestone}
            locale={locale}
            busy={busy}
            onPay={onPay}
            onTestPay={onTestPay}
          />
        ))}
      </div>
    </section>
  )
}

function MissionPaymentItem({
  milestone,
  locale,
  busy,
  onPay,
  onTestPay,
}: {
  milestone: MissionPaymentMilestone
  locale: string
  busy: boolean
  onPay: (milestoneId: string) => void
  onTestPay: (milestoneId: string) => void
}) {
  const { t } = useI18n(missionPaymentMilestoneMessages)
  const latest = milestone.payments[0]
  const hasActiveCheckout = Boolean(
    milestone.status === 'PENDING' &&
    milestone.payments.some(
      (payment) =>
        (payment.status === 'PENDING' || payment.status === 'PROCESSING') &&
        Boolean(payment.paymentUrl),
    ),
  )
  const canPay = milestone.status === 'UNPAID' || hasActiveCheckout
  const date = milestone.handedOverAt
    ? new Date(milestone.handedOverAt).toLocaleString(locale)
    : null
  const deadline =
    milestone.paymentExpiresAt &&
    Number.isFinite(Date.parse(milestone.paymentExpiresAt))
      ? new Date(milestone.paymentExpiresAt).toLocaleString(locale)
      : null

  return (
    <article className="mission-payment-item">
      <div className="mission-payment-item__main">
        <div className="mission-payment-item__title">
          <div>
            <strong>
              {milestone.scopeLabel?.trim() ||
                milestone.missionCode ||
                t.missionFallback}
            </strong>
            <span>{milestone.missionCode}</span>
          </div>
          <StatusTag tone={tone[milestone.status] ?? 'neutral'}>
            {t.status[milestone.status] ?? milestone.status}
          </StatusTag>
        </div>
        <dl className="mission-payment-item__facts">
          <div>
            <dt>{t.amount}</dt>
            <dd className="is-money">{formatVnd(milestone.amount)}</dd>
          </div>
          <div>
            <dt>{date ? t.handedOver : t.notHandedOver}</dt>
            <dd>{date ?? '—'}</dd>
          </div>
          {deadline ? (
            <div>
              <dt>{t.paymentDeadline}</dt>
              <dd>{deadline}</dd>
            </div>
          ) : null}
        </dl>
      </div>
      {milestone.status === 'EXPIRED' ? (
        <Alert
          className="mission-payment-item__expired"
          type="warning"
          showIcon
          message={t.expiredMessage}
        />
      ) : null}
      <div className="mission-payment-item__actions">
        {canPay ? (
          <Button
            type="primary"
            disabled={busy}
            onClick={() => onPay(milestone.id)}
          >
            {hasActiveCheckout
              ? t.continuePayment
              : latest?.status === 'FAILED'
                ? t.retry
                : t.payNow}
          </Button>
        ) : null}
        {env.testPaymentsEnabled && canPay ? (
          <Button disabled={busy} onClick={() => onTestPay(milestone.id)}>
            {t.testPayment}
          </Button>
        ) : null}
      </div>
      <div className="mission-payment-item__history">
        <strong>{t.paymentHistory}</strong>
        {milestone.payments.length ? (
          <ul>
            {milestone.payments.map((payment) => (
              <li key={payment.id}>
                <span>{formatVnd(payment.amount)}</span>
                <StatusTag
                  tone={
                    payment.status === 'SUCCESS'
                      ? 'success'
                      : payment.status === 'FAILED' ||
                          payment.status === 'CANCELLED'
                        ? 'danger'
                        : payment.status === 'PENDING' ||
                            payment.status === 'PROCESSING'
                          ? 'info'
                          : 'neutral'
                  }
                >
                  {t.paymentStatus[payment.status] ?? payment.status}
                </StatusTag>
                {payment.paidAt ? (
                  <time dateTime={payment.paidAt}>
                    {new Date(payment.paidAt).toLocaleString(locale)}
                  </time>
                ) : null}
                <small>{payment.transactionReference}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t.noAttempts}</p>
        )}
      </div>
    </article>
  )
}
