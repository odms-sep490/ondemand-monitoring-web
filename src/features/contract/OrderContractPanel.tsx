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

type Props = {
  orderId: string
  mode: 'customer' | 'manager'
  onConfirmed?: () => void
}
export function OrderContractPanel(props: Props) {
  return <ContractContent key={`${props.orderId}:${props.mode}`} {...props} />
}
function ContractContent({ orderId, mode, onConfirmed }: Props) {
  const { t, locale } = useI18n(contractMessages)
  const query = useApiQuery(
    (signal) => contractApi.get(orderId, signal),
    [orderId],
  )
  const data = query.data
  const manager = mode === 'manager'
  const [file, setFile] = useState<File | null>(null)
  const [number, setNumber] = useState('')
  const [reason, setReason] = useState('')
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirmed = useRef<string | null>(null)
  const input = useRef<HTMLInputElement>(null)
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
    if (code === 'numberInvalid') return t.numberInvalid
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
      const result = await contractApi.download(orderId, submissionId)
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
  if (query.error)
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
    ['AWAITING_SIGNATURE', 'CHANGES_REQUESTED'].includes(data.status)
  const canReview =
    manager &&
    data.status === 'PENDING_VERIFICATION' &&
    latest?.status === 'PENDING'
  const disabled = busy || query.loading
  const upload = () => {
    if (!file) return
    if (canIssue) {
      if (!/^[A-Za-z0-9][A-Za-z0-9/_-]{2,79}$/.test(number.trim())) {
        setError('numberInvalid')
        return
      }
      void act(() =>
        contractApi.issue(orderId, data.quoteId, number.trim(), file),
      )
    } else if (canSubmit)
      void act(() => contractApi.submit(orderId, data.version, file))
  }
  return (
    <section className="order-contract-panel" aria-label={t.title}>
      <header>
        <div className="order-contract-panel__heading">
          <FilePdfOutlined aria-hidden />
          <div>
            <h3>{t.title}</h3>
            <p>
              {t.quote(data.quoteVersion)}
              {data.contractNumber ? ` · ${data.contractNumber}` : ''}
            </p>
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
          {t.status[data.status]}
        </Tag>
      </header>
      <p className="order-contract-panel__hint">{t.subtitle}</p>
      {data.status === 'NOT_ISSUED' && !manager && <p>{t.waitingIssue}</p>}
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
          {canIssue && (
            <>
              <p>{t.managerIssue}</p>
              <label>
                {t.number}
                <Input
                  value={number}
                  maxLength={80}
                  disabled={disabled}
                  onChange={(e) => setNumber(e.target.value)}
                />
              </label>
            </>
          )}
          <div className="order-contract-panel__file">
            <UploadOutlined aria-hidden />
            <strong>{canIssue ? t.file : t.signedFile}</strong>
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
              {t.chooseFile}
            </Button>
            <span className="order-contract-panel__filename">
              {file?.name ?? t.noFile}
            </span>
            <small>{t.limit}</small>
          </div>
          {canSubmit && (
            <Checkbox
              checked={checked}
              disabled={disabled}
              onChange={(e) => setChecked(e.target.checked)}
            >
              {t.declaration}
            </Checkbox>
          )}
          <Button
            type="primary"
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
            onChange={(e) => setChecked(e.target.checked)}
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
