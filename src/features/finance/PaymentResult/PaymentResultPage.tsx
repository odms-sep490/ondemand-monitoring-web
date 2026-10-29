import { useCallback, useEffect, useRef, useState } from 'react'
import { PageFrame } from '../../../shared/components/antd/PageFrame'
import { useI18n } from '../../../shared/i18n'
import { financeApi } from '../api'
import type { Payment } from '../types'
import '../finance.css'
import { paymentResultMessages } from './PaymentResult.messages'
import { PaymentResultCard } from './components/PaymentResultCard'

export function PaymentResultPage({
  cancelled = false,
}: {
  cancelled?: boolean
}) {
  const { t } = useI18n(paymentResultMessages)
  const tRef = useRef(t)
  tRef.current = t
  const transactionReference = readTransactionReference()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const attempts = useRef(0)

  const check = useCallback(async () => {
    if (!transactionReference) {
      setChecking(false)
      setError(tRef.current.missingReference)
      return
    }
    setChecking(true)
    setError(null)
    try {
      // The refresh endpoint performs a signed server-to-server QueryDR call.
      // Browser return parameters are never used as proof of payment.
      const current = cancelled
        ? await financeApi.getPaymentByReference(transactionReference)
        : await financeApi.refreshPaymentByReference(transactionReference)
      setPayment(current)
      const stillProcessing =
        current.status === 'PENDING' || current.status === 'PROCESSING'
      if (stillProcessing && !cancelled && attempts.current < 10) {
        attempts.current += 1
        window.setTimeout(() => void check(), 3000)
        return
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : tRef.current.checkFailed,
      )
    }
    setChecking(false)
  }, [cancelled, transactionReference])

  useEffect(() => {
    void check()
  }, [check])

  async function retryPayment() {
    if (!payment) return
    setChecking(true)
    setError(null)
    try {
      const next =
        payment.type === 'FINAL_PAYMENT'
          ? await financeApi.createFinalPayment(payment.invoiceId)
          : await financeApi.createDeposit(payment.invoiceId)
      if (next.paymentUrl) window.location.assign(next.paymentUrl)
    } catch (cause) {
      setChecking(false)
      setError(
        cause instanceof Error ? cause.message : tRef.current.retryFailed,
      )
    }
  }

  const success = payment?.status === 'SUCCESS'
  return (
    <PageFrame maxWidth={640}>
      <PaymentResultCard
        success={success}
        cancelled={cancelled}
        checking={checking}
        payment={payment}
        error={error}
        check={check}
        retryPayment={retryPayment}
      />
    </PageFrame>
  )
}

function readTransactionReference() {
  const query = window.location.hash.split('?')[1] ?? ''
  const parameters = new URLSearchParams(query)
  const value =
    parameters.get('transactionReference') ?? parameters.get('vnp_TxnRef')
  return value && /^[A-Za-z0-9]{1,100}$/.test(value) ? value : null
}
