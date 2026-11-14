import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Checkbox, Input, Tag } from 'antd'
import {
  DownloadOutlined,
  FilePdfOutlined,
  UploadOutlined,
  CheckOutlined,
} from '@ant-design/icons'
import { ApiError } from '../../shared/api/httpClient'
import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { useI18n } from '../../shared/i18n'
import { contractApi } from './contractApi'
import { contractMessages } from './contract.messages'
import type { OrderContract } from './types'
import './OrderContractPanel.css'
import { ContractCancellationPanel } from './ContractCancellationPanel'

type Props = {
  orderId: string
  mode: 'customer' | 'manager'
  onConfirmed?: () => void
  onUpdated?: () => void
  quoteId?: string
  pricingRevision?: number
  refreshKey?: string
  onPrepared?: () => void
  embedded?: boolean
}
export function OrderContractPanel(props: Props) {
  return (
    <ContractContent
      key={`${props.orderId}:${props.mode}:${props.quoteId ?? 'current'}`}
      {...props}
    />
  )
}
function ContractContent({
  orderId,
  mode,
  onConfirmed,
  onUpdated,
  quoteId,
  refreshKey,
  pricingRevision,
  onPrepared,
  embedded = false,
}: Props) {
  const { t, locale } = useI18n(contractMessages)
  const query = useApiQuery(
    (signal) => contractApi.get(orderId, signal, quoteId),
    [orderId, quoteId, refreshKey],
  )
  const data = query.data
  const manager = mode === 'manager'
  const [file, setFile] = useState<File | null>(null)
  const [reason, setReason] = useState('')
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirmed = useRef<string | null>(null)
  const observed = useRef<string | null>(null)
  useEffect(() => {
    if (!data) return
    const key = `${data.id}:${data.version}:${data.status}`
    if (observed.current && observed.current !== key) onUpdated?.()
    observed.current = key
  }, [data, onUpdated])
  const input = useRef<HTMLInputElement>(null)
  const prepared = useRef<string | null>(null)
  useEffect(() => {
    if (
      data?.document &&
      data.id &&
      (!quoteId || data.quoteId === quoteId) &&
      data.id !== prepared.current
    ) {
      prepared.current = data.id
      onPrepared?.()
    }
  }, [data?.id, data?.document, data?.quoteId, quoteId, onPrepared])
  useEffect(() => {
    if (data?.status === 'CONFIRMED' && data.id !== confirmed.current) {
      confirmed.current = data.id
      onConfirmed?.()
    }
  }, [data?.id, data?.status, onConfirmed])
  useEffect(() => {
    if (!data?.required || data.status === 'CONFIRMED') return
    const refresh = () => {
      if (!document.hidden) query.reload()
    }
    const timer = setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [data?.required, data?.status, query.reload])
  useEffect(() => {
    setChecked(false)
    setReason('')
  }, [data?.version])
  function message(cause: unknown) {
    return cause instanceof ApiError
      ? cause.status === 413
        ? 'fileInvalid'
        : (cause.code ?? 'failed')
      : 'failed'
  }
  function errorText(code: string) {
    if (code === 'fileInvalid') return t.fileInvalid
    return t.errors[code] ?? t.failed
  }
  async function act(operation: () => Promise<OrderContract>) {
    if (busy || query.loading) return
    setBusy(true)
    setError(null)
    try {
      await operation()
      setFile(null)
      if (input.current) input.current.value = ''
      query.reload()
    } catch (cause) {
      setError(message(cause))
      if (cause instanceof ApiError && cause.status === 409) query.reload()
    } finally {
      setBusy(false)
    }
  }
  async function download(submissionId?: string) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const result = await contractApi.download(orderId, submissionId, quoteId)
      const url = new URL(result.url, window.location.origin)
      if (!['https:', 'http:'].includes(url.protocol))
        throw new Error('Invalid download link')
      const anchor = document.createElement('a')
      anchor.href = url.href
      anchor.download = 'contract.pdf'
      anchor.rel = 'noopener noreferrer'
      anchor.click()
    } catch (cause) {
      setError(message(cause))
    } finally {
      setBusy(false)
    }
  }
  function selectFile(value: File | undefined) {
    setFile(null)
    setError(null)
    if (!value) return
    if (
      value.size === 0 ||
      value.size > 10 * 1024 * 1024 ||
      !value.name.toLowerCase().endsWith('.pdf')
    ) {
      setError('fileInvalid')
      return
    }
    setFile(value)
  }
  const time = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(value))
  if (query.error || (data && quoteId && data.quoteId !== quoteId))
    return (
      <section className="order-contract-panel">
        <Alert
          type="error"
          showIcon
          message={t.loadFailed}
          action={<Button onClick={query.reload}>{t.refresh}</Button>}
        />
      </section>
    )
  if (!data) return <p role="status">{t.loading}</p>
  if (!data.required) return null
  const latest = data.submissions[0]
  const canIssue = manager && data.status === 'NOT_ISSUED'
  const canSubmit =
    !manager &&
    Boolean(data.invoiceId) &&
    ['AWAITING_SIGNATURE', 'CHANGES_REQUESTED'].includes(data.status)
  const canReview =
    manager &&
    data.status === 'PENDING_VERIFICATION' &&
    latest?.status === 'PENDING'
  const disabled = busy || query.loading
  const upload = () => {
    if (!file) return
    if (canIssue) {
      void act(() =>
        pricingRevision == null
          ? contractApi.issue(orderId, data.quoteId, undefined, file)
          : contractApi.issue(
              orderId,
              data.quoteId,
              undefined,
              file,
              pricingRevision,
            ),
      )
    } else if (canSubmit)
      void act(() => contractApi.submit(orderId, data.version, file))
  }
  return (
    <section
      className={`order-contract-panel${embedded ? ' is-embedded' : ''}`}
      aria-label={t.title}
    >
      <header>
        <div className="order-contract-panel__heading">
          <FilePdfOutlined aria-hidden />
          <div>
            <h3>{t.title}</h3>
          </div>
        </div>
        <Tag
          color={
            data.status === 'CONFIRMED'
              ? 'green'
              : data.status === 'CHANGES_REQUESTED'
                ? 'orange'
                : 'blue'
          }
        >
          {!data.invoiceId && data.document
            ? t.preparedStatus
            : t.status[data.status]}
        </Tag>
      </header>
      {!embedded && (
        <p className="order-contract-panel__hint">
          {manager
            ? t.managerSubtitle
            : !data.invoiceId
              ? t.preAcceptSubtitle
              : t.subtitle}
        </p>
      )}
      {data.status === 'NOT_ISSUED' && !manager && <p>{t.waitingIssue}</p>}
      {!manager && !data.invoiceId && data.document && (
        <Alert type="info" showIcon message={t.acceptFirst} />
      )}
      {data.document && (
        <div className="order-contract-panel__document">
          <FilePdfOutlined aria-hidden />
          <span title={data.document.fileName}>
            {data.document.fileName}
            <small>{Math.ceil(data.document.byteSize / 1024)} KB</small>
          </span>
          <Button
            icon={<DownloadOutlined aria-hidden />}
            disabled={disabled}
            onClick={() => void download()}
          >
            {t.download}
          </Button>
        </div>
      )}
      {data.status === 'PENDING_VERIFICATION' && !manager && (
        <Alert type="info" showIcon message={t.pending} />
      )}
      {data.status === 'CHANGES_REQUESTED' && latest?.reviewNote && (
        <Alert type="warning" showIcon message={latest.reviewNote} />
      )}
      {(canIssue || canSubmit) && (
        <div className="order-contract-panel__upload">
          <div
            className={`order-contract-panel__file${file ? ' has-file' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (disabled) return
              if (e.dataTransfer.files.length !== 1) {
                setFile(null)
                setError('fileInvalid')
                return
              }
              selectFile(e.dataTransfer.files[0])
            }}
          >
            <span
              className="order-contract-panel__upload-icon"
              aria-hidden="true"
            >
              {file ? <FilePdfOutlined /> : <UploadOutlined />}
            </span>
            <div className="order-contract-panel__file-copy">
              <strong>
                {file?.name ?? (canIssue ? t.file : t.signedFile)}
              </strong>
              <small>
                {file ? `${Math.ceil(file.size / 1024)} KB · PDF` : t.dropHint}
              </small>
              <small>{t.limit}</small>
            </div>
            <input
              ref={input}
              type="file"
              hidden
              accept="application/pdf,.pdf"
              disabled={disabled}
              aria-label={canIssue ? t.file : t.signedFile}
              onChange={(e) => selectFile(e.target.files?.[0])}
            />
            <Button disabled={disabled} onClick={() => input.current?.click()}>
              {file ? t.changeFile : t.chooseFile}
            </Button>
          </div>
          {canSubmit && (
            <Checkbox
              checked={checked}
              disabled={disabled}
              onChange={(e) =>
                setChecked(e.target.checked)
              }
            >
              {t.declaration}
            </Checkbox>
          )}
          <Button
            type={canIssue ? 'default' : 'primary'}
            disabled={disabled || !file || (!manager && !checked)}
            loading={busy}
            onClick={upload}
          >
            {canIssue ? t.issue : t.submit}
          </Button>
        </div>
      )}
      {canReview && (
        <div className="order-contract-panel__review">
          <h4>{t.status.PENDING_VERIFICATION}</h4>
          <Button
            icon={<DownloadOutlined aria-hidden />}
            disabled={disabled}
            onClick={() => void download(latest.id)}
          >
            {t.signedDownload}
          </Button>
          <Checkbox
            checked={checked}
            disabled={disabled}
            onChange={(e) =>
              setChecked(e.target.checked)
            }
          >
            {t.checked}
          </Checkbox>
          <label>
            {t.reason}
            <Input.TextArea
              value={reason}
              maxLength={2000}
              rows={3}
              disabled={disabled}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="order-contract-panel__actions">
            <Button
              danger
              disabled={disabled || !reason.trim()}
              onClick={() =>
                void act(() =>
                  contractApi.requestChanges(
                    orderId,
                    data.version,
                    latest.id,
                    reason.trim(),
                  ),
                )
              }
            >
              {t.changes}
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined aria-hidden />}
              disabled={disabled || !checked}
              onClick={() =>
                void act(() =>
                  contractApi.confirm(orderId, data.version, latest.id),
                )
              }
            >
              {t.confirm}
            </Button>
          </div>
        </div>
      )}
      {data.status === 'CONFIRMED' && (
        <Alert type="success" showIcon message={t.confirmed} />
      )}
      {error && <Alert type="error" showIcon message={errorText(error)} />}
      {data.invoiceId && (
        <ContractCancellationPanel
          orderId={orderId}
          contract={data}
          manager={manager}
          onChanged={() => {
            query.reload()
            onUpdated?.()
          }}
        />
      )}
      {data.submissions.length > 0 && (
        <details className="order-contract-panel__history">
          <summary>
            {t.history} ({data.submissions.length})
          </summary>
          {data.submissions.map((row) => (
            <article key={row.id}>
              <div>
                <strong>{t.submission(row.submissionNumber)}</strong>
                <Tag>{t.submissionStatus[row.status]}</Tag>
              </div>
              <p>
                {t.submitted}: {time(row.submittedAt)}
                {row.reviewedAt
                  ? ` · ${t.reviewed}: ${time(row.reviewedAt)}`
                  : ''}
              </p>
              {row.reviewNote && <p>{row.reviewNote}</p>}
                <Button
                  size="small"
                  disabled={disabled}
                  onClick={() => void download(row.id)}
                >
                  {t.signedDownload}
                </Button>
            </article>
          ))}
        </details>
      )}
    </section>
  )
}
