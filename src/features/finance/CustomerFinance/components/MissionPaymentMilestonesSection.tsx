import { Alert, Button, Skeleton } from 'antd'
import { StatusTag } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import type {
  MissionPaymentAllocation,
  MissionPaymentMilestone,
  Payment,
} from '../../types'
import { getHandedOverMissionMilestones } from '../../missionMilestoneUtils'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { financeApi } from '../../api'
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
  invoiceId,
  invoiceNumber,
  issuedAt,
  depositExpiresAt,
  paidAmount,
  depositAmount,
  depositPaid,
  allocation,
  loading,
  error,
}: {
  invoiceId: string
  invoiceNumber?: string
  issuedAt?: string | null
  depositExpiresAt?: string | null
  paidAmount: number
  depositAmount: number
  depositPaid: boolean
  allocation: MissionPaymentAllocation | null
  loading: boolean
  error: string | null
  busy?: boolean
  onPay?: (milestoneId: string) => void
  onTestPay?: (milestoneId: string) => void
}) {
  const { t, locale } = useI18n(missionPaymentMilestoneMessages)

  // Allocation is Manager planning data, not evidence of a Customer handover.
  const handedOver = getHandedOverMissionMilestones(allocation)
  const totalHandedOver = handedOver.reduce((sum, item) => sum + item.amount, 0)
  const paidTotal = handedOver.reduce(
    (sum, item) => (item.status === 'PAID' ? sum + item.amount : sum),
    0,
  )
  const deposit = useApiQuery(
    async (signal) =>
      (await financeApi.getInvoicePayments(invoiceId, signal)).filter(
        (payment) => payment.type === 'DEPOSIT',
      ),
    [invoiceId, paidAmount],
  )
  const depositPaidAtRaw = (deposit.data ?? []).find((p) => p.paidAt)?.paidAt
  const depositPaidDate =
    depositPaidAtRaw && Number.isFinite(Date.parse(depositPaidAtRaw))
      ? new Date(depositPaidAtRaw).toLocaleString(locale)
      : null
  const depositDeadline =
    depositExpiresAt && Number.isFinite(Date.parse(depositExpiresAt))
      ? new Date(depositExpiresAt).toLocaleString(locale)
      : null
  const issuedDate =
    issuedAt && Number.isFinite(Date.parse(issuedAt))
      ? new Date(issuedAt).toLocaleString(locale)
      : null
  if (!depositPaid && handedOver.length === 0) return null
  return (
    <section
      id="mission-payment-section"
      className="mission-payment-card"
      aria-labelledby="mission-payment-title"
    >
      <header className="mission-payment-card__heading">
        <div>
          <h3 id="mission-payment-title">{t.title}</h3>
          <p>{t.description}</p>
        </div>
        {handedOver.length > 0 ? (
          <strong
            className="mission-payment-card__total"
            aria-label={t.paymentProgress}
          >
            {formatVnd(paidTotal)} / {formatVnd(totalHandedOver)}
          </strong>
        ) : allocation ? (
          <strong className="mission-payment-card__total">
            {t.afterDepositTotal(formatVnd(allocation.allocationTargetAmount))}
          </strong>
        ) : null}
      </header>
      <div className="mission-payment-list">
        <article className="mission-payment-item">
          <div className="mission-payment-item__main">
            <div className="mission-payment-item__title">
              <div>
                <strong>{t.depositTitle}</strong>
                {invoiceNumber ? <span>{invoiceNumber}</span> : null}
              </div>
              {depositPaid && <StatusTag tone="success">{t.status.PAID}</StatusTag>}
            </div>
            <dl className="mission-payment-item__facts">
              <div>
                <dt>{t.amount}</dt>
                <dd className="is-money">{formatVnd(depositAmount)}</dd>
              </div>
              <div>
                <dt>{t.depositPaidAt}</dt>
                <dd>{depositPaidDate ?? '—'}</dd>
              </div>
              <div>
                <dt>{depositDeadline ? t.paymentDeadline : t.invoiceIssuedAt}</dt>
                <dd>{depositDeadline ?? issuedDate ?? '—'}</dd>
              </div>
            </dl>
          </div>
          <div className="mission-payment-item__history">
            <strong>{t.paymentHistory}</strong>
            {deposit.loading ? (
              <Skeleton active paragraph={false} />
            ) : deposit.error ? (
              <Alert
                type="error"
                message={t.depositHistoryError}
                action={
                  <Button size="small" onClick={deposit.reload}>
                    {t.retryHistory}
                  </Button>
                }
              />
            ) : (
              <PaymentHistory payments={deposit.data ?? []} locale={locale} />
            )}
          </div>
        </article>
        {loading ? (
          <div role="status" aria-busy="true">
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        ) : null}
        {error ? <Alert type="error" showIcon message={error} /> : null}
        {handedOver.map((milestone) => (
          <MissionPaymentItem
            key={milestone.id}
            milestone={milestone}
            locale={locale}
          />
        ))}
      </div>
    </section>
  )
}

function MissionPaymentItem({
  milestone,
  locale,
}: {
  milestone: MissionPaymentMilestone
  locale: string
}) {
  const { t } = useI18n(missionPaymentMilestoneMessages)
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
      <div className="mission-payment-item__history">
        <strong>{t.paymentHistory}</strong>
        <PaymentHistory payments={milestone.payments} locale={locale} />
      </div>
    </article>
  )
}

function PaymentHistory({ payments, locale }: { payments: Payment[]; locale: string }) {
  const { t } = useI18n(missionPaymentMilestoneMessages)
  return payments.length ? (
    <ul>
      {payments.map((payment) => (
        <li key={payment.id}>
          <span>{formatVnd(payment.amount)}</span>
          {payment.status !== 'SUCCESS' && <StatusTag
            tone={
              payment.status === 'FAILED' || payment.status === 'CANCELLED'
                  ? 'danger'
                  : payment.status === 'PENDING' || payment.status === 'PROCESSING'
                    ? 'info'
                    : 'neutral'
            }
          >
            {t.paymentStatus[payment.status] ?? payment.status}
          </StatusTag>}
        {payment.paidAt ? (
          <time dateTime={payment.paidAt}>
            {t.paymentDate(new Date(payment.paidAt).toLocaleString(locale))}
          </time>
        ) : null}
        {payment.transactionReference ? (
          <small>
            {t.transactionReferenceLabel}{' '}
            <span>{payment.transactionReference}</span>
          </small>
        ) : null}
        </li>
      ))}
    </ul>
  ) : (
    <p>{t.noAttempts}</p>
  )
}
