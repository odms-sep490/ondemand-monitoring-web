import { useState } from 'react'
import { Alert, Button, Tag } from 'antd'
import { getLanguage, useI18n } from '../../../../shared/i18n'
import { refundApi, type RefundResponse } from '../../refundApi'
import { refundStatusSectionMessages } from './RefundStatusSection.messages'

export function RefundStatusSection({
  refund,
  loading,
  error,
}: {
  refund: RefundResponse | null
  loading: boolean
  error: string | null
}) {
  const { t } = useI18n(refundStatusSectionMessages)
  if (loading) {
    return (
      <section className="customer-refund-card" aria-busy="true">
        {t.loading}
      </section>
    )
  }
  if (!refund && !error) return null

  return (
    <section className="customer-refund-card" aria-label={t.label}>
      <div className="customer-refund-card__heading">
        <div>
          <span className="customer-refund-card__eyebrow">{t.eyebrow}</span>
          <h3>{t.title}</h3>
        </div>
        {refund ? (
          <Tag color={refund.status === 'COMPLETED' ? 'green' : ['REJECTED', 'CANCELLED'].includes(refund.status) ? 'red' : 'gold'}>
            {t.status[refund.status]}
          </Tag>
        ) : null}
      </div>
      {error ? <Alert type="error" showIcon message={error} /> : null}
      {refund ? (
        <>
          <dl className="customer-refund-card__facts">
            <div>
              <dt>{t.amount}</dt>
              <dd>{money(refund.refundedAmount || refund.refundableAmount)}</dd>
            </div>
            <div>
              <dt>{t.requested}</dt>
              <dd>{dateTime(refund.requestedAt)}</dd>
            </div>
            {refund.completedAt ? (
              <div>
                <dt>{t.completed}</dt>
                <dd>{dateTime(refund.completedAt)}</dd>
              </div>
            ) : null}
            {refund.rejectedAt ? (
              <div>
                <dt>{t.closed}</dt>
                <dd>{dateTime(refund.rejectedAt)}</dd>
              </div>
            ) : null}
            {refund.cancelledAt ? (
              <div>
                <dt>{t.closed}</dt>
                <dd>{dateTime(refund.cancelledAt)}</dd>
              </div>
            ) : null}
          </dl>
          <p className="customer-refund-card__reason">{refund.reason}</p>
          {refund.rejectionReason || refund.cancellationReason ? (
            <p className="customer-refund-card__reason">
              {refund.rejectionReason || refund.cancellationReason}
            </p>
          ) : null}
          {refund.attempts.length ? (
            <div className="customer-refund-card__attempts">
              <h4>{t.history}</h4>
              {refund.attempts.map((attempt) => (
                <article
                  key={attempt.id}
                  className="customer-refund-card__attempt"
                >
                  <div>
                    <strong>
                      {t.attempt(
                        attempt.attemptNumber,
                        attempt.outcome === 'SUCCESSFUL'
                          ? t.successful
                          : t.failed,
                      )}
                    </strong>
                    <span>
                      {attempt.beneficiaryBank} · {money(attempt.amount)}
                    </span>
                    <span>
                      {attempt.beneficiaryName} ·{' '}
                      {attempt.beneficiaryAccountNumber}
                    </span>
                    <span>{t.reference(attempt.transactionReference)}</span>
                    <span>{dateTime(attempt.transferredAt)}</span>
                    {attempt.failureReason ? (
                      <span>{attempt.failureReason}</span>
                    ) : null}
                  </div>
                  {refund.status === 'COMPLETED' &&
                  attempt.outcome === 'SUCCESSFUL' ? (
                    <div className="customer-refund-card__receipts">
                      {attempt.receipts.map((receipt) => (
                        <ReceiptButton
                          key={receipt.id}
                          refundId={refund.id}
                          receiptId={receipt.id}
                          name={receipt.fileName}
                        />
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

function ReceiptButton({
  refundId,
  receiptId,
  name,
}: {
  refundId: string
  receiptId: string
  name: string
}) {
  const { t } = useI18n(refundStatusSectionMessages)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function openReceipt() {
    setBusy(true)
    setError('')
    const tab = window.open('about:blank', '_blank')
    try {
      const access = await refundApi.getReceiptAccess(refundId, receiptId)
      if (tab) {
        tab.opener = null
        tab.location.replace(access.url)
      } else {
        window.location.assign(access.url)
      }
    } catch (cause) {
      tab?.close()
      setError(cause instanceof Error ? cause.message : t.receiptError)
    } finally {
      setBusy(false)
    }
  }
  return (
    <span>
      <Button size="small" loading={busy} onClick={() => void openReceipt()}>
        {t.viewReceipt(name)}
      </Button>
      {error ? <span role="alert">{error}</span> : null}
    </span>
  )
}

function money(value: number) {
  return new Intl.NumberFormat(getLanguage() === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
