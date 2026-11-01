import { Skeleton } from 'antd'
import { useEffect, useState, type FormEvent } from 'react'

import { ApiError } from '../../../../../shared/api/httpClient'
import {
  CardComponent,
  ErrorState,
} from '../../../../../shared/components/antd'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import { ExpirationAuditTable } from './ExpirationAuditTable'
import { ExpirationForm, MAX_HOURS } from './ExpirationForm'
import { orderExpirationSettingsMessages } from './OrderExpirationSettings.messages'

const isValid = (text: string, value: number) =>
  /^\d+$/.test(text) &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= MAX_HOURS

export function OrderExpirationSettings() {
  const { t } = useI18n(orderExpirationSettingsMessages)
  const settingsQuery = useApiQuery(
    (signal) => adminApi.getOrderExpirationSettings(signal),
    [],
  )
  const auditQuery = useApiQuery(
    (signal) => adminApi.listOrderExpirationAudit(signal),
    [],
  )
  const [quotationHours, setQuotationHours] = useState('')
  const [depositHours, setDepositHours] = useState('')
  const [savedValues, setSavedValues] = useState<{
    quotation: number
    deposit: number
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!settingsQuery.data) return
    setQuotationHours(
      String(settingsQuery.data.quotationAcceptanceTimeoutHours),
    )
    setDepositHours(String(settingsQuery.data.depositPaymentTimeoutHours))
    setSavedValues({
      quotation: settingsQuery.data.quotationAcceptanceTimeoutHours,
      deposit: settingsQuery.data.depositPaymentTimeoutHours,
    })
  }, [settingsQuery.data])

  if (settingsQuery.loading && !settingsQuery.data)
    return (
      <CardComponent>
        <Skeleton active aria-busy="true" />
      </CardComponent>
    )
  if (!settingsQuery.data)
    return (
      <ErrorState error={settingsQuery.error} onRetry={settingsQuery.reload} />
    )

  const quotationValue = Number(quotationHours)
  const depositValue = Number(depositHours)
  const fieldError = (text: string, value: number) => {
    if (text.trim() === '') return t.requiredHours
    if (!/^\d+$/.test(text) || !Number.isInteger(value)) return t.integerHours
    if (value < 1) return t.positiveHours
    if (value > MAX_HOURS) return t.maxHours
    return null
  }
  const hasChanges =
    savedValues !== null &&
    (quotationValue !== savedValues.quotation ||
      depositValue !== savedValues.deposit)
  const canSave =
    isValid(quotationHours, quotationValue) &&
    isValid(depositHours, depositValue) &&
    hasChanges &&
    !busy

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) return
    setBusy(true)
    setMessage(null)
    setError(null)
    try {
      const updated = await adminApi.updateOrderExpirationSettings({
        quotationAcceptanceTimeoutHours: quotationValue,
        depositPaymentTimeoutHours: depositValue,
      })
      setQuotationHours(String(updated.quotationAcceptanceTimeoutHours))
      setDepositHours(String(updated.depositPaymentTimeoutHours))
      setSavedValues({
        quotation: updated.quotationAcceptanceTimeoutHours,
        deposit: updated.depositPaymentTimeoutHours,
      })
      setMessage(t.saved)
      settingsQuery.reload()
      auditQuery.reload()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t.saveError)
    } finally {
      setBusy(false)
    }
  }

  const edit = (set: (value: string) => void) => (value: string) => {
    set(value)
    setMessage(null)
    setError(null)
  }

  return (
    <div className="mgr-view">
      <ExpirationForm
        quotation={{
          value: quotationHours,
          error: fieldError(quotationHours, quotationValue),
          onChange: edit(setQuotationHours),
        }}
        deposit={{
          value: depositHours,
          error: fieldError(depositHours, depositValue),
          onChange: edit(setDepositHours),
        }}
        hasChanges={hasChanges}
        hasSaved={savedValues !== null}
        canSave={canSave}
        busy={busy}
        message={message}
        error={error}
        onSubmit={save}
      />
      <ExpirationAuditTable query={auditQuery} />
    </div>
  )
}
