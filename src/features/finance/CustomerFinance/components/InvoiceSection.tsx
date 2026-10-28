import { Button } from 'antd'
import { useI18n } from '../../../../shared/i18n'
import { customerFinanceSectionsMessages } from '../CustomerFinanceSections.messages'
import { pricingLabel } from '../../../../shared/lib/pricingPresentation'
import { StatusTag } from '../../../../shared/components/antd'
import { PaymentStat } from './PaymentStat'
import type { Invoice } from '../../types'

const INVOICE_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  ISSUED: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'neutral',
  REFUNDED: 'neutral',
}

export function InvoiceSection({
  invoice,
  legalReady,
  busy,
  pay,
  completeTestDeposit,
  testPaymentLabel,
}: {
  invoice: Invoice
  legalReady: boolean
  busy: boolean
  pay: (type: 'deposit' | 'final') => Promise<void>
  completeTestDeposit: () => Promise<void>
  testPaymentLabel: string
}) {
  const { t } = useI18n(customerFinanceSectionsMessages)
  return (
    <div className="customer-invoice">
      <div className="customer-invoice-title">
        <div>
          <h3>{t.invoice(invoice.invoiceNumber)}</h3>
          <p>{t.depositIpn}</p>
        </div>
        <StatusTag tone={INVOICE_TONE[invoice.status] ?? 'neutral'}>
          {t.invoiceStatus[invoice.status] ?? pricingLabel(invoice.status)}
        </StatusTag>
      </div>
      <div className="customer-payment-stats">
        <PaymentStat label={t.total} value={invoice.totalAmount} />
        <PaymentStat label={t.deposit} value={invoice.depositAmount} />
        <PaymentStat label={t.paid} value={invoice.paidAmount} />
        <PaymentStat label={t.remaining} value={invoice.remainingAmount} />
      </div>
      {invoice.paidAmount < invoice.depositAmount ? (
        <div className="customer-deposit-notice">
          <b>{t.awaitingDeposit}</b>
          <span>{t.awaitingDepositBody}</span>
        </div>
      ) : invoice.status !== 'PAID' ? (
        <div className="customer-deposit-notice is-ready">
          <b>{t.depositReceived}</b>
          <span>{t.depositReceivedBody}</span>
        </div>
      ) : null}
      <div className="finance-actions customer-payment-actions">
        {invoice.paidAmount < invoice.depositAmount && legalReady ? (
          <>
            <Button
              type="primary"
              disabled={busy}
              onClick={() => void pay('deposit')}
            >
              {t.payDeposit}
            </Button>
            {import.meta.env.DEV ? (
              <Button
                disabled={busy}
                onClick={() => void completeTestDeposit()}
              >
                {testPaymentLabel}
              </Button>
            ) : null}
          </>
        ) : null}
        {invoice.finalPaymentAllowed &&
        invoice.paidAmount >= invoice.depositAmount &&
        invoice.remainingAmount > 0 ? (
          <Button
            type="primary"
            disabled={busy}
            onClick={() => void pay('final')}
          >
            {t.payRemaining}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
