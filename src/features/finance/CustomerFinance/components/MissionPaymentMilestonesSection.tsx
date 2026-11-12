import { Alert, Button, Tag } from 'antd'
import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import type { MissionPaymentAllocation, MissionPaymentMilestone } from '../../types'
import { env } from '../../../../config/env'
import { missionPaymentMilestoneMessages } from './MissionPaymentMilestonesSection.messages'

const tone: Record<string, string> = {
  NOT_YET_DUE: 'default',
  UNPAID: 'orange',
  PENDING: 'processing',
  EXPIRED: 'red',
  PAID: 'green',
  CANCELLED: 'default',
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

  if (!allocation && !loading && !error) return null
  return (
    <section className="mission-payment-card" aria-labelledby="mission-payment-title">
      <header className="mission-payment-card__heading">
        <div>
          <h3 id="mission-payment-title">{t.title}</h3>
          <p>{t.description}</p>
        </div>
        {allocation ? (
          <strong className="mission-payment-card__total">
            {formatVnd(allocation.allocatedAmount)} / {formatVnd(allocation.allocationTargetAmount)}
          </strong>
        ) : null}
      </header>
      {loading ? <p role="status">…</p> : null}
      {error ? <Alert type="error" showIcon message={error} /> : null}
      {allocation && !allocation.allocationComplete ? (
        <Alert type="warning" showIcon message={t.allocationIncomplete} />
      ) : null}
      {allocation?.milestones.length === 0 ? <p className="mission-payment-card__empty">{t.empty}</p> : null}
      <div className="mission-payment-list">
        {allocation?.milestones.map((milestone) => (
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
  const deadline = milestone.paymentExpiresAt && Number.isFinite(Date.parse(milestone.paymentExpiresAt))
    ? new Date(milestone.paymentExpiresAt).toLocaleString(locale)
    : null

  return (
    <article className="mission-payment-item">
      <div className="mission-payment-item__main">
        <div className="mission-payment-item__title">
          <div>
            <strong>{milestone.scopeLabel?.trim() || milestone.missionCode || t.missionFallback}</strong>
            <span>{milestone.missionCode}</span>
          </div>
          <Tag color={tone[milestone.status] ?? 'default'}>
            {t.status[milestone.status] ?? milestone.status}
          </Tag>
        </div>
        <dl className="mission-payment-item__facts">
          <div>
            <dt>{t.amount}</dt>
            <dd>{formatVnd(milestone.amount)}</dd>
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
        <Alert className="mission-payment-item__expired" type="warning" showIcon message={t.expiredMessage} />
      ) : null}
      <div className="mission-payment-item__actions">
        {canPay ? (
          <Button type="primary" disabled={busy} onClick={() => onPay(milestone.id)}>
            {hasActiveCheckout ? t.continuePayment : latest?.status === 'FAILED' ? t.retry : t.payNow}
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
                <Tag color={payment.status === 'SUCCESS' ? 'green' : payment.status === 'FAILED' ? 'red' : 'default'}>
                  {t.paymentStatus[payment.status] ?? payment.status}
                </Tag>
                {payment.paidAt ? <time dateTime={payment.paidAt}>{new Date(payment.paidAt).toLocaleString(locale)}</time> : null}
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
