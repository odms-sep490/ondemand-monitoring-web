import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Checkbox, Input, Select, Tag } from 'antd'
import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { useI18n } from '../../shared/i18n'
import { ApiError } from '../../shared/api/httpClient'
import { contractApi } from './contractApi'
import { contractCancellationMessages } from './contractCancellation.messages'
import type { OrderContract, CancellationResponsibility } from './types'

type Props = {
  orderId: string
  contract: OrderContract
  manager: boolean
  onChanged: () => void
}
export function ContractCancellationPanel(props: Props) {
  if (
    props.contract.status === 'CONFIRMED' ||
    (!props.manager && props.contract.status !== 'CANCELLED')
  )
    return null
  return (
    <CancellationContent
      key={`${props.orderId}:${props.contract.id}`}
      {...props}
    />
  )
}
function CancellationContent({ orderId, contract, manager, onChanged }: Props) {
  const { t, locale } = useI18n(contractCancellationMessages)
  const query = useApiQuery(
    (signal) => contractApi.cancellation(orderId, signal),
    [orderId],
  )
  const [editing, setEditing] = useState(false),
    [party, setParty] = useState<CancellationResponsibility>('UNRESOLVED')
  const [reason, setReason] = useState(''),
    [basis, setBasis] = useState(''),
    [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null)
  const command = useRef(crypto.randomUUID()),
    observed = useRef<string | null>(null)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) query.reload()
    }, 15000)
    return () => clearInterval(timer)
  }, [query.reload])
  useEffect(() => {
    if (!query.data) return
    const key = `${query.data.id}:${query.data.version}`
    if (observed.current && observed.current !== key) onChanged()
    observed.current = key
  }, [query.data, onChanged])
  const row = query.data
  async function save() {
    if (busy || query.loading || query.error) return
    setBusy(true)
    setError(null)
    try {
      if (row)
        await contractApi.decideCancellation(orderId, {
          expectedVersion: row.version,
          responsibility: party,
          basis: basis.trim(),
          customerLiabilityAcknowledged: ack,
        })
      else
        await contractApi.cancel(orderId, {
          clientRequestId: command.current,
          expectedVersion: contract.version,
          responsibility: party,
          reason: reason.trim(),
          basis: basis.trim() || null,
          customerLiabilityAcknowledged: ack,
        })
      setEditing(false)
      query.reload()
      onChanged()
    } catch (cause) {
      setError(cause)
      query.reload()
    } finally {
      setBusy(false)
    }
  }
  const canOpen =
    manager &&
    !query.loading &&
    !query.error &&
    ((!row && contract.status !== 'CANCELLED') ||
      row?.status === 'REVIEW_REQUIRED')
  const disabled = busy || query.loading || Boolean(query.error)
  const invalid =
    (!row && reason.trim().length < 10) ||
    (row && party === 'UNRESOLVED') ||
    (party !== 'UNRESOLVED' && basis.trim().length < 10) ||
    (party === 'CUSTOMER' && !ack)
  const time = (value: string) =>
    new Date(value).toLocaleString(locale, {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'short',
      timeStyle: 'short',
    })
  return (
    <section className="contract-cancellation" aria-label={t.title}>
      {Boolean(query.error) && (
        <Alert
          type="warning"
          showIcon
          message={t.loadFailed}
          action={<Button onClick={query.reload}>{t.refresh}</Button>}
        />
      )}
      {row && (
        <div className="contract-cancellation__record">
          <div className="contract-cancellation__heading">
            <h4>{t.title}</h4>
            <Tag
              color={row.status === 'REVIEW_REQUIRED' ? 'orange' : 'default'}
            >
              {t.status[row.status]}
            </Tag>
          </div>
          <p>{row.reason}</p>
          <dl>
            <div>
              <dt>{t.party}</dt>
              <dd>{t.parties[row.responsibility]}</dd>
            </div>
            <div>
              <dt>{t.paid}</dt>
              <dd>
                {new Intl.NumberFormat(locale, {
                  style: 'currency',
                  currency: 'VND',
                }).format(row.depositPaid)}
              </dd>
            </div>
          </dl>
          {row.basis && (
            <p>
              <strong>{t.basis}: </strong>
              {row.basis}
            </p>
          )}
          <small>
            {t.requested}: {time(row.requestedAt)}
            {row.decidedAt && ` · ${t.decisionAt}: ${time(row.decidedAt)}`}
          </small>
          {row.status === 'REFUND_REQUESTED' && (
            <Alert type="info" showIcon message={t.refundHint} />
          )}
        </div>
      )}
      {canOpen && !editing && (
        <Button type="text" danger onClick={() => setEditing(true)}>
          {row ? t.decide : t.open}
        </Button>
      )}
      {editing && canOpen && (
        <div className="contract-cancellation__form">
          <h4>{row ? t.decide : t.open}</h4>
          <p>{t.intro}</p>
          {!row && (
            <label>
              {t.reason}
              <Input.TextArea
                aria-label={t.reason}
                value={reason}
                rows={3}
                maxLength={2000}
                onChange={(e) => setReason(e.target.value)}
                disabled={disabled}
              />
            </label>
          )}
          <label>
            {t.party}
            <Select
              aria-label={t.party}
              value={party}
              onChange={setParty}
              disabled={disabled}
              options={Object.entries(t.parties).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </label>
          <Alert
            type="warning"
            showIcon
            message={
              party === 'SYSTEM'
                ? t.systemWarning
                : party === 'CUSTOMER'
                  ? t.customerWarning
                  : t.unknownWarning
            }
          />
          {party !== 'UNRESOLVED' && (
            <label>
              {t.basis}
              <Input.TextArea
                aria-label={t.basis}
                value={basis}
                rows={3}
                maxLength={2000}
                disabled={disabled}
                onChange={(e) => setBasis(e.target.value)}
              />
            </label>
          )}
          {party === 'CUSTOMER' && (
            <Checkbox
              checked={ack}
              disabled={disabled}
              onChange={(e) => setAck(e.target.checked)}
            >
              {t.acknowledgement}
            </Checkbox>
          )}
          <div className="order-contract-panel__actions">
            <Button disabled={busy} onClick={() => setEditing(false)}>
              {t.close}
            </Button>
            <Button
              danger
              type="primary"
              loading={busy}
              disabled={disabled || Boolean(invalid)}
              onClick={() => void save()}
            >
              {row ? t.save : t.submit}
            </Button>
          </div>
        </div>
      )}
      {error != null && (
        <Alert
          type="error"
          showIcon
          message={
            (error instanceof ApiError &&
              error.code &&
              t.errors[error.code as keyof typeof t.errors]) ||
            t.failed
          }
        />
      )}
    </section>
  )
}
