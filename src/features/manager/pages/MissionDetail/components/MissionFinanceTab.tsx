import {
  StatusTag,
  type StatusTagTone,
} from '../../../components/common/StatusTag'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Descriptions, Skeleton, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { financeApi } from '../../../../finance/api'
import type {
  MissionFinancialPaymentHistoryEntry,
  MissionFinancialSummary,
} from '../../../../finance/types'
import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'

const milestoneTagColor: Record<string, StatusTagTone> = {
  NOT_YET_DUE: 'neutral',
  UNPAID: 'warning',
  PENDING: 'info',
  EXPIRED: 'danger',
  PAID: 'success',
  CANCELLED: 'neutral',
}

const paymentTagColor: Record<string, StatusTagTone> = {
  SUCCESS: 'success',
  PROCESSING: 'info',
  PENDING: 'info',
  FAILED: 'danger',
  CANCELLED: 'neutral',
  REFUNDED: 'info',
  REQUIRES_REVIEW: 'warning',
}

export function MissionFinanceTab({
  missionId,
  purpose,
}: {
  missionId: string
  purpose: 'ORIGINAL' | 'REWORK'
}) {
  const { t, locale } = useI18n(missionDetailPageMessages)
  const copy = t.extra.finance
  const [summary, setSummary] = useState<MissionFinancialSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true)
      setError(false)
      try {
        const response = await financeApi.getManagerMissionFinancialSummary(
          missionId,
          signal,
        )
        if (!signal.aborted) setSummary(response)
      } catch {
        if (!signal.aborted) setError(true)
      } finally {
        if (!signal.aborted) setLoading(false)
      }
    },
    [missionId],
  )

  useEffect(() => {
    if (purpose === 'REWORK') {
      setSummary(null)
      setError(false)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setSummary(null)
    void load(controller.signal)
    return () => controller.abort()
  }, [load, purpose, reloadKey])

  const formatDate = (value: string | null | undefined) => {
    if (!value || !Number.isFinite(Date.parse(value))) return '—'
    return new Date(value).toLocaleString(locale)
  }
  const statusLabel = (status: string) => copy.status[status] ?? status

  if (purpose === 'REWORK') {
    return (
      <Alert
        type="info"
        showIcon
        message={copy.reworkLabel}
        description={copy.reworkDescription}
      />
    )
  }

  if (loading && !summary) {
    return (
      <CardComponent title={copy.title}>
        <Skeleton active paragraph={{ rows: 5 }} />
      </CardComponent>
    )
  }

  if (error && !summary) {
    return (
      <CardComponent title={copy.title}>
        <Alert
          type="error"
          showIcon
          message={copy.loadError}
          action={
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => setReloadKey((key) => key + 1)}
            >
              {copy.retry}
            </Button>
          }
        />
      </CardComponent>
    )
  }

  if (!summary || summary.purpose === 'REWORK') return null

  const depositPayments = summary.depositPayments ?? []
  const successfulDepositPayments = depositPayments.filter(
    (payment) => payment.status === 'SUCCESS',
  )
  const depositPaidAmount = successfulDepositPayments.length
    ? successfulDepositPayments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      )
    : summary.invoice?.depositStatus === 'DEPOSIT_PAID'
      ? Number(summary.invoice.depositAmount)
      : 0
  const depositRemainingAmount = Math.max(
    0,
    Number(summary.invoice?.depositAmount ?? 0) - depositPaidAmount,
  )

  const missionPayment = summary.missionPayment
  const breakdown = summary.priceBreakdown
  const missionTotal =
    breakdown?.missionTotalAmount ?? summary.missionGrossChecklistAmount

  return (
    <div className="mission-finance-tab">
      <header className="mission-finance-tab__heading">
        <div>
          <Typography.Title level={4}>{copy.title}</Typography.Title>
          <Typography.Text type="secondary">{copy.description}</Typography.Text>
        </div>
        {missionPayment && (
          <StatusTag
            tone={milestoneTagColor[missionPayment.status] ?? 'neutral'}
          >
            {statusLabel(missionPayment.status)}
          </StatusTag>
        )}
      </header>

      <section
        className="mission-finance-tab__overview"
        aria-label={copy.missionPayment}
      >
        <div className="mission-finance-tab__amount">
          <span>{breakdown ? copy.missionTotal : copy.missionAmount}</span>
          <strong>
            {missionTotal == null ? '—' : formatVnd(missionTotal)}
          </strong>
          {missionTotal == null && <small>{copy.amountUnavailable}</small>}
        </div>
        <div className="mission-finance-tab__amount mission-finance-tab__amount--deposit">
          <span>{copy.allocatedDeposit}</span>
          <strong>
            {breakdown ? formatVnd(breakdown.allocatedDeposit) : '—'}
          </strong>
          {!breakdown && <small>{copy.amountUnavailable}</small>}
        </div>
        <div className="mission-finance-tab__amount mission-finance-tab__amount--primary">
          <span>{copy.afterDeposit}</span>
          <strong>
            {breakdown
              ? formatVnd(breakdown.milestoneAmount)
              : missionPayment
                ? formatVnd(missionPayment.amount)
                : '—'}
          </strong>
          {!missionPayment && <small>{copy.noMissionPayment}</small>}
        </div>
      </section>

      <div className="mission-finance-tab__details-grid">
        <div className="mission-finance-tab__mission-details">
          <section
            className="mission-finance-tab__calculation"
            aria-label={copy.calculationTitle}
          >
            <div>
              <h4>{copy.calculationTitle}</h4>
              <p>{copy.calculationNote}</p>
            </div>
            {breakdown ? (
              <div>
                <dl className="mission-finance-tab__equation">
                  <div>
                    <dt>{copy.missionAmount}</dt>
                    <dd>{formatVnd(breakdown.checklistAmount)}</dd>
                  </div>
                  <div>
                    <dt>{copy.adjustment}</dt>
                    <dd>
                      {breakdown.allocatedAdjustment >= 0 ? '+ ' : '− '}
                      {formatVnd(Math.abs(breakdown.allocatedAdjustment))}
                    </dd>
                  </div>
                  <div className="is-subtotal">
                    <dt>{copy.missionTotal}</dt>
                    <dd>{formatVnd(breakdown.missionTotalAmount)}</dd>
                  </div>
                  <div>
                    <dt>{copy.allocatedDeposit}</dt>
                    <dd>− {formatVnd(breakdown.allocatedDeposit)}</dd>
                  </div>
                  <div className="is-total">
                    <dt>{copy.netMissionAmount}</dt>
                    <dd>{formatVnd(breakdown.milestoneAmount)}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <Typography.Text type="secondary">
                {copy.calculationUnavailable}
              </Typography.Text>
            )}
            <Descriptions
              className="mission-finance-tab__timing"
              size="small"
              column={1}
              colon={false}
            >
              <Descriptions.Item label={copy.handedOverAt}>
                {formatDate(missionPayment?.handedOverAt)}
              </Descriptions.Item>
              <Descriptions.Item label={copy.paymentDeadline}>
                {formatDate(missionPayment?.paymentExpiresAt)}
              </Descriptions.Item>
            </Descriptions>
            <div className="mission-finance-tab__deposit-history">
              <PaymentHistory
                title={copy.paymentHistory}
                payments={missionPayment?.payments ?? []}
                locale={locale}
                copy={copy}
              />
            </div>
          </section>
        </div>
        <section
          className="mission-finance-tab__panel mission-finance-tab__order-deposit"
          aria-label={copy.orderDeposit}
        >
          <header className="mission-finance-tab__panel-heading">
            <div>
              <h4>{copy.orderDeposit}</h4>
              <p>{copy.orderScope}</p>
            </div>
          </header>
          {summary.invoice ? (
            <>
              <dl className="mission-finance-tab__equation">
                <div>
                  <dt>{copy.depositAmount}</dt>
                  <dd>{formatVnd(summary.invoice.depositAmount)}</dd>
                </div>
                <div className="mission-finance-tab__order-paid">
                  <dt>{copy.depositPaidAmount}</dt>
                  <dd>{formatVnd(depositPaidAmount)}</dd>
                </div>
                <div
                  className={
                    depositRemainingAmount > 0
                      ? 'mission-finance-tab__balance-due'
                      : 'mission-finance-tab__balance-clear'
                  }
                >
                  <dt>{copy.depositRemainingAmount}</dt>
                  <dd>{formatVnd(depositRemainingAmount)}</dd>
                </div>
                <div className="is-total">
                  <dt>{copy.depositPaymentAmount}</dt>
                  <dd>{formatVnd(summary.invoice.depositAmount)}</dd>
                </div>
              </dl>
              <Descriptions
                className="mission-finance-tab__timing mission-finance-tab__deposit-timing"
                size="small"
                column={1}
                colon={false}
              >
                <Descriptions.Item label={copy.depositIssuedAt}>
                  {formatDate(summary.invoice.issuedAt)}
                </Descriptions.Item>
                <Descriptions.Item label={copy.depositDeadline}>
                  {formatDate(summary.invoice.depositExpiresAt)}
                </Descriptions.Item>
              </Descriptions>
              <div className="mission-finance-tab__deposit-history">
                <PaymentHistory
                  title={copy.paymentHistory}
                  payments={depositPayments}
                  locale={locale}
                  copy={copy}
                />
              </div>
            </>
          ) : (
            <Typography.Text type="secondary">{copy.noInvoice}</Typography.Text>
          )}
        </section>
      </div>
    </div>
  )
}

function PaymentHistory({
  title,
  payments,
  locale,
  copy,
}: {
  title: string
  payments: MissionFinancialPaymentHistoryEntry[]
  locale: string
  copy: (typeof missionDetailPageMessages)['vi']['extra']['finance']
}) {
  return (
    <section className="mission-finance-tab__history">
      <h4>{title}</h4>
      {payments.length === 0 ? (
        <Typography.Text type="secondary">{copy.noPayments}</Typography.Text>
      ) : (
        <div className="mission-finance-tab__payment-list">
          {payments.map((payment) => (
            <div className="mission-finance-tab__payment" key={payment.id}>
              <div>
                <strong
                  className={
                    payment.status === 'SUCCESS'
                      ? 'mission-finance-tab__paid-amount'
                      : undefined
                  }
                >
                  {formatVnd(payment.amount)}
                </strong>
                <div className="mission-finance-tab__payment-meta">
                  <span>
                    {copy.provider}: {payment.provider}
                  </span>
                  <span>
                    {copy.paidAt}:{' '}
                    {payment.paidAt
                      ? new Date(payment.paidAt).toLocaleString(locale)
                      : '—'}
                  </span>
                </div>
              </div>
              <div className="mission-finance-tab__payment-end">
                <StatusTag tone={paymentTagColor[payment.status] ?? 'neutral'}>
                  {payment.status === 'SUCCESS'
                    ? copy.status.PAID
                    : (copy.status[payment.status] ?? payment.status)}
                </StatusTag>
                {payment.transactionReferenceMasked ? (
                  <Typography.Text type="secondary" copyable={false}>
                    {copy.reference}: {payment.transactionReferenceMasked}
                  </Typography.Text>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
