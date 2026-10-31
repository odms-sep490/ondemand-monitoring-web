import { useEffect, useState, type FormEvent } from 'react'

import { ApiError } from '../../../../../shared/api/httpClient'
import {
  ErrorState,
  LoadingState,
} from '../../../../../shared/components/odm/StateView'
import { Icon, type IconName } from '../../../../../shared/components/Icon'
import { TableCard } from '../../../../../shared/components/ui'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import type { OrderExpirationSettingAudit } from '../../../types/operatingConfig'
import { orderExpirationSettingsMessages } from './OrderExpirationSettings.messages'

const MAX_HOURS = 8760

export function OrderExpirationSettings() {
  const { t, locale } = useI18n(orderExpirationSettingsMessages)
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

  if (settingsQuery.loading && !settingsQuery.data) return <LoadingState />
  if (!settingsQuery.data)
    return (
      <ErrorState error={settingsQuery.error} onRetry={settingsQuery.reload} />
    )

  const quotationValue = Number(quotationHours)
  const depositValue = Number(depositHours)
  const valid = (text: string, value: number) =>
    /^\d+$/.test(text) &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= MAX_HOURS
  const fieldError = (text: string, value: number) => {
    if (text.trim() === '') return t.requiredHours
    if (!/^\d+$/.test(text) || !Number.isInteger(value)) return t.integerHours
    if (value < 1) return t.positiveHours
    if (value > MAX_HOURS) return t.maxHours
    return null
  }
  const quotationError = fieldError(quotationHours, quotationValue)
  const depositError = fieldError(depositHours, depositValue)
  const hasChanges =
    savedValues !== null &&
    (quotationValue !== savedValues.quotation ||
      depositValue !== savedValues.deposit)
  const canSave =
    valid(quotationHours, quotationValue) &&
    valid(depositHours, depositValue) &&
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

  const settingLabel = (name: OrderExpirationSettingAudit['settingName']) =>
    name === 'quotationAcceptanceTimeoutHours' ? t.quotation : t.deposit
  const changedAt = (audit: OrderExpirationSettingAudit) =>
    new Date(audit.changedAt).toLocaleString(locale)
  const actorDisplayName = (actor: string) => {
    const value = actor.trim()
    if (!value) return t.unknownActor
    if (/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value))
      return t.legacyActor
    if (value.includes('@')) return value
    if (!/^[a-z\d._-]+$/i.test(value) || !/[-_.]/.test(value)) return value

    return value
      .replace(/[._-]+/g, ' ')
      .split(/\s+/)
      .map((part) => part.charAt(0).toLocaleUpperCase(locale) + part.slice(1))
      .join(' ')
  }
  const actorInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toLocaleUpperCase(locale))
      .join('')
  const renderActor = (actor: string) => {
    const name = actorDisplayName(actor)
    return (
      <span className="oc-expiration__actor" title={actor}>
        <span className="oc-expiration__actor-avatar">
          {actorInitials(name)}
        </span>
        <span className="oc-expiration__actor-name">{name}</span>
      </span>
    )
  }
  const renderTimeoutField = ({
    id,
    icon,
    label,
    description,
    value,
    onChange,
    error: fieldValidationError,
  }: {
    id: string
    icon: IconName
    label: string
    description: string
    value: string
    onChange: (value: string) => void
    error: string | null
  }) => (
    <article
      className={`oc-expiration__field${fieldValidationError ? ' is-invalid' : ''}`}
    >
      <div className="oc-expiration__field-heading">
        <span className="oc-expiration__field-icon">
          <Icon name={icon} width={19} height={19} />
        </span>
        <div className="oc-expiration__field-copy">
          <label className="oc-expiration__label" htmlFor={id}>
            {label}
          </label>
          <p>{description}</p>
        </div>
      </div>
      <div className="oc-expiration__input-wrap">
        <input
          id={id}
          aria-label={label}
          aria-invalid={Boolean(fieldValidationError)}
          aria-describedby={fieldValidationError ? `${id}-error` : undefined}
          className="odm-inp oc-expiration__input"
          type="number"
          min={1}
          max={MAX_HOURS}
          step={1}
          required
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
            setMessage(null)
            setError(null)
          }}
        />
        <span className="oc-expiration__unit">{t.hoursShort}</span>
      </div>
      <div className="oc-expiration__field-meta">
        {fieldValidationError && (
          <span
            id={`${id}-error`}
            className="oc-expiration__error"
            role="alert"
          >
            {fieldValidationError}
          </span>
        )}
      </div>
    </article>
  )

  return (
    <div className="adm-stack is-tight oc-expiration">
      {message && (
        <div className="adm-alert is-success" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="adm-alert is-danger" role="alert">
          {error}
        </div>
      )}
      <form className="oc-expiration__panel" onSubmit={save}>
        <header className="oc-expiration__header">
          <span className="oc-expiration__header-icon">
            <Icon name="clock" width={21} height={21} />
          </span>
          <div className="oc-expiration__header-copy">
            <h3>{t.formTitle}</h3>
            <p>{t.description}</p>
          </div>
          <span className="oc-expiration__badge">
            <Icon name="activity" width={15} height={15} />
            {t.independentBadge}
          </span>
        </header>

        <div className="oc-expiration__fields">
          {renderTimeoutField({
            id: 'quotation-acceptance-timeout',
            icon: 'file-text',
            label: t.quotation,
            description: t.quotationHint,
            value: quotationHours,
            onChange: setQuotationHours,
            error: quotationError,
          })}
          {renderTimeoutField({
            id: 'deposit-payment-timeout',
            icon: 'ticket',
            label: t.deposit,
            description: t.depositHint,
            value: depositHours,
            onChange: setDepositHours,
            error: depositError,
          })}
        </div>

        <footer className="oc-expiration__footer">
          <p className="oc-expiration__note">
            <Icon name="shield" width={17} height={17} />
            <span>{t.snapshotNote}</span>
          </p>
          <div className="oc-expiration__save-group">
            {savedValues && (
              <span
                className={`oc-expiration__save-state${hasChanges ? ' has-changes' : ''}`}
              >
                <Icon
                  name={hasChanges ? 'activity' : 'check'}
                  width={13}
                  height={13}
                />
                {hasChanges ? t.unsavedChanges : t.noPendingChanges}
              </span>
            )}
            <button
              className="odm-btn odm-btn-p oc-expiration__save"
              type="submit"
              disabled={!canSave}
            >
              <Icon name={busy ? 'clock' : 'check'} width={16} height={16} />
              {busy ? t.saving : t.save}
            </button>
          </div>
        </footer>
      </form>

      <section className="oc-expiration__history">
        <header className="oc-expiration__history-header">
          <div>
            <h3>{t.auditTitle}</h3>
            <p>{t.auditDescription}</p>
          </div>
          {auditQuery.data && (
            <span className="oc-expiration__history-count">
              {t.changeCount(auditQuery.data.length)}
            </span>
          )}
        </header>
        {auditQuery.error && !auditQuery.data ? (
          <ErrorState error={auditQuery.error} onRetry={auditQuery.reload} />
        ) : auditQuery.loading && !auditQuery.data ? (
          <LoadingState />
        ) : !auditQuery.data?.length ? (
          <div className="oc-expiration__empty">
            <span className="oc-expiration__empty-icon">
              <Icon name="activity" width={20} height={20} />
            </span>
            <p>{t.noAudit}</p>
          </div>
        ) : (
          <TableCard>
            <table className="odm-adm-table oc-expiration__table">
              <thead>
                <tr>
                  <th>{t.field}</th>
                  <th>{t.previous}</th>
                  <th>{t.next}</th>
                  <th>{t.actor}</th>
                  <th>{t.changedAt}</th>
                </tr>
              </thead>
              <tbody>
                {auditQuery.data.map((audit) => (
                  <tr key={audit.id}>
                    <td>{settingLabel(audit.settingName)}</td>
                    <td>
                      <span className="oc-expiration__old-value">
                        {audit.previousValue} {t.hoursShort}
                      </span>
                    </td>
                    <td>
                      <span className="oc-expiration__new-value">
                        {audit.newValue} {t.hoursShort}
                      </span>
                    </td>
                    <td>{renderActor(audit.actor)}</td>
                    <td>{changedAt(audit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}
      </section>
    </div>
  )
}
