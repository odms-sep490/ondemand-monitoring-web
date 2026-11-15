import { useEffect, useMemo, useRef, useState } from 'react'
import { EyeOutlined, FileImageOutlined } from '@ant-design/icons'

import { Button, Modal, PageHeader } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { ImagePreview } from '../../../../shared/components/media/ImagePreview'
import {
  refundApi,
  type RefundExecutionChannel,
  type RefundReceipt,
  type RefundResponse,
  type RefundStatus,
  type RefundTransferAttemptInput,
} from '../../../finance/refundApi'
import { refundManagementMessages } from './RefundManagementPage.messages'
import './refund-management.css'

const statuses: RefundStatus[] = [
  'REQUESTED',
  'PROCESSING',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
]
const activeStatuses: RefundStatus[] = ['REQUESTED', 'PROCESSING']

export function RefundManagementPage() {
  const { t } = useI18n(refundManagementMessages)
  const [status, setStatus] = useState<RefundStatus | 'ACTIVE' | ''>('ACTIVE')
  const [search, setSearch] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [refunds, setRefunds] = useState<RefundResponse[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [decisionAction, setDecisionAction] = useState<
    'reject' | 'cancel' | null
  >(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [outcome, setOutcome] = useState<'SUCCESSFUL' | 'FAILED'>('SUCCESSFUL')
  const [form, setForm] = useState({
    executionChannel: 'BANK_TRANSFER' as RefundExecutionChannel,
    bank: '',
    beneficiary: '',
    accountNumber: '',
    confirmedWithCustomer: false,
    amount: '',
    reference: '',
    transferredAt: localDateTimeNow(),
    note: '',
    failureReason: '',
  })
  const [files, setFiles] = useState<File[]>([])
  const receiptInputRef = useRef<HTMLInputElement>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [receiptPreview, setReceiptPreview] = useState<{
    url: string
    fileName: string
  } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    refundApi
      .listAdmin(
        status && status !== 'ACTIVE' ? status : undefined,
        controller.signal,
      )
      .then((items) => {
        if (controller.signal.aborted) return
        setRefunds(items)
        const selectableItems =
          status === 'ACTIVE'
            ? items.filter((refund) => activeStatuses.includes(refund.status))
            : items
        setSelectedId((current) =>
          selectableItems.some((refund) => refund.id === current)
            ? current
            : (selectableItems[0]?.id ?? ''),
        )
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLoadError(error instanceof Error ? error.message : t.loadError)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [status, reloadKey, t.loadError])

  const visibleRefunds = useMemo(() => {
    const query = search.trim().toLowerCase()
    const statusFiltered =
      status === 'ACTIVE'
        ? refunds.filter((refund) => activeStatuses.includes(refund.status))
        : refunds
    if (!query) return statusFiltered
    return statusFiltered.filter((refund) =>
      [
        refund.orderCode,
        refund.orderTitle,
        refund.customerName,
        refund.customerEmail,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    )
  }, [refunds, search, status])
  const selected = refunds.find((refund) => refund.id === selectedId) ?? null
  const successfulAttempt = selected?.attempts.find(
    (attempt) => attempt.outcome === 'SUCCESSFUL',
  )
  const remainingReceiptSlots = Math.max(
    0,
    10 - (successfulAttempt?.receipts.length ?? 0),
  )
  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  )

  useEffect(
    () => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)),
    [previewUrls],
  )

  useEffect(() => {
    if (!selected) return
    setForm((current) => ({
      ...current,
      executionChannel: 'BANK_TRANSFER',
      amount: String(selected.refundableAmount),
    }))
  }, [selected?.id, selected?.refundableAmount])

  useEffect(() => {
    setFiles([])
    if (receiptInputRef.current) receiptInputRef.current.value = ''
    setActionError('')
    setNotice('')
  }, [selectedId])

  function applyUpdated(updated: RefundResponse) {
    setRefunds((items) => {
      const exists = items.some((item) => item.id === updated.id)
      return exists
        ? items.map((item) => (item.id === updated.id ? updated : item))
        : [updated, ...items]
    })
    setSelectedId(updated.id)
  }

  async function perform(
    action: () => Promise<RefundResponse>,
    successText = t.actionSaved,
  ): Promise<boolean> {
    setBusy(true)
    setActionError('')
    setNotice('')
    try {
      applyUpdated(await action())
      setNotice(successText)
      return true
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t.actionError)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function startProcessing() {
    if (!selected) return
    await perform(() => refundApi.startProcessing(selected.id))
  }

  async function submitDecision() {
    if (!selected || !decisionAction) return
    if (!decisionReason.trim()) {
      setActionError(t.decisionReasonRequired)
      return
    }
    const action = decisionAction
    setDecisionAction(null)
    const succeeded = await perform(
      () =>
        action === 'reject'
          ? refundApi.reject(selected.id, decisionReason.trim())
          : refundApi.cancel(selected.id, decisionReason.trim()),
      action === 'reject' ? t.rejected : t.cancelled,
    )
    if (succeeded) setDecisionReason('')
  }

  async function saveAttempt() {
    if (!selected) return
    const isBankTransfer = form.executionChannel === 'BANK_TRANSFER'
    if (!form.reference.trim() || !form.transferredAt) {
      setActionError(t.requiredFields)
      return
    }
    if (
      isBankTransfer &&
      (!form.bank.trim() ||
        !form.beneficiary.trim() ||
        !form.accountNumber.trim())
    ) {
      setActionError(t.requiredFields)
      return
    }
    if (outcome === 'FAILED' && !form.failureReason.trim()) {
      setActionError(t.failedReasonRequired)
      return
    }
    if (isBankTransfer && !form.confirmedWithCustomer) {
      setActionError(t.customerNotConfirmed)
      return
    }
    if (
      outcome === 'SUCCESSFUL' &&
      Number(form.amount || selected.refundableAmount) !==
        selected.refundableAmount
    ) {
      setActionError(t.amountMustMatch)
      return
    }
    if (
      form.executionChannel === 'VNPAY_MERCHANT_PORTAL' &&
      (selected.depositPayments.length !== 1 ||
        selected.depositPayments[0]?.provider !== 'VNPAY')
    ) {
      setActionError(t.vnpayPortalHint)
      return
    }
    const body: RefundTransferAttemptInput = {
      executionChannel: form.executionChannel,
      beneficiaryBank: isBankTransfer ? form.bank.trim() : null,
      beneficiaryName: isBankTransfer ? form.beneficiary.trim() : null,
      beneficiaryAccountNumber: isBankTransfer
        ? form.accountNumber.trim()
        : null,
      beneficiaryConfirmedWithCustomer:
        isBankTransfer && form.confirmedWithCustomer,
      amount: Number(form.amount || selected.refundableAmount),
      transactionReference: form.reference.trim(),
      transferredAt: new Date(form.transferredAt).toISOString(),
      note: form.note.trim() || null,
      outcome,
      failureReason: outcome === 'FAILED' ? form.failureReason.trim() : null,
    }
    if (await perform(() => refundApi.recordAttempt(selected.id, body))) {
      setForm((current) => ({
        ...current,
        confirmedWithCustomer: false,
        reference: '',
        note: '',
        failureReason: '',
        transferredAt: localDateTimeNow(),
      }))
    }
  }

  async function uploadReceipts() {
    if (!selected || !successfulAttempt || files.length === 0) {
      setActionError(t.receiptRequired)
      return
    }
    if (files.length + successfulAttempt.receipts.length > 10) {
      setActionError(t.receiptLimit)
      return
    }
    if (
      files.some((file) => !['image/jpeg', 'image/png'].includes(file.type))
    ) {
      setActionError(t.chooseReceipts)
      return
    }
    setBusy(true)
    setActionError('')
    setNotice('')
    try {
      let updated = selected
      for (const file of files) {
        updated = await refundApi.uploadReceipt(
          selected.id,
          successfulAttempt.id,
          file,
        )
        applyUpdated(updated)
      }
      setFiles([])
      if (receiptInputRef.current) receiptInputRef.current.value = ''
      setNotice(t.actionSaved)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t.actionError)
    } finally {
      setBusy(false)
    }
  }

  async function confirmRefund() {
    if (!selected) return
    setConfirmOpen(false)
    await perform(() => refundApi.confirm(selected.id), t.completed)
  }

  async function openReceipt(refundId: string, receiptId: string) {
    try {
      const access = await refundApi.getReceiptAccess(refundId, receiptId)
      setReceiptPreview({ url: access.url, fileName: access.fileName })
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t.actionError)
    }
  }

  return (
    <div className="adm-refunds">
      {receiptPreview && (
        <ImagePreview
          src={receiptPreview.url}
          fileName={receiptPreview.fileName}
          visible
          viewerOnly
          onVisibleChange={(visible) => {
            if (!visible) setReceiptPreview(null)
          }}
        />
      )}
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Button onClick={() => setReloadKey((value) => value + 1)}>
            {t.reload}
          </Button>
        }
      />
      <div className="adm-refunds__filters">
        <label>
          <span>{t.search}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.search}
          />
        </label>
        <label>
          <span>{t.statusFilter}</span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as RefundStatus | 'ACTIVE' | '')
            }
          >
            <option value="ACTIVE">{t.activeQueue}</option>
            <option value="">{t.allStatuses}</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {t.status[item]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="adm-refunds__state" aria-busy="true">
          {t.loading}
        </div>
      ) : null}
      {!loading && loadError ? (
        <div className="adm-refunds__state is-error" role="alert">
          <span>{loadError || t.loadError}</span>
          <Button onClick={() => setReloadKey((value) => value + 1)}>
            {t.reload}
          </Button>
        </div>
      ) : null}
      {!loading && !loadError ? (
        <div className="adm-refunds__layout">
          <section className="adm-refunds__list" aria-label={t.listTitle}>
            <header>
              <h2>{t.listTitle}</h2>
              <span>{visibleRefunds.length}</span>
            </header>
            {visibleRefunds.length === 0 ? (
              <div className="adm-refunds__empty-state">
                <span className="adm-refunds__empty-icon" aria-hidden="true">
                  ✓
                </span>
                <strong>
                  {status === 'ACTIVE' && !search.trim()
                    ? t.activeEmptyTitle
                    : t.emptyTitle}
                </strong>
                <p>{t.empty}</p>
              </div>
            ) : null}
            <div className="adm-refunds__rows">
              {visibleRefunds.map((refund) => (
                <button
                  type="button"
                  key={refund.id}
                  className={`adm-refunds__row ${refund.id === selectedId ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedId(refund.id)
                    setActionError('')
                    setNotice('')
                  }}
                >
                  <span className="adm-refunds__row-top">
                    <strong>{refund.orderCode || refund.orderTitle}</strong>
                    <em data-status={refund.status}>
                      {t.status[refund.status]}
                    </em>
                  </span>
                  <span>
                    {refund.customerName} · {refund.customerEmail}
                  </span>
                  <span className="adm-refunds__row-reason">
                    {refund.reason}
                  </span>
                  <span className="adm-refunds__row-bottom">
                    <strong>{money(refund.refundableAmount)}</strong>
                    <time>{dateTime(refund.requestedAt)}</time>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {selected ? (
            <section className="adm-refunds__detail" aria-label={t.selected}>
              <header className="adm-refunds__detail-head">
                <div>
                  <p className="adm-refunds__eyebrow">{t.selected}</p>
                  <h2>{selected.orderCode || selected.orderTitle}</h2>
                  <p>{selected.orderTitle}</p>
                </div>
                <em data-status={selected.status}>
                  {t.status[selected.status]}
                </em>
              </header>
              <div className="adm-refunds__amount-panel">
                <div>
                  <span>{t.amount}</span>
                  <small>{t.refundAmountHint}</small>
                </div>
                <strong>{money(selected.refundableAmount)}</strong>
              </div>
              <RefundProgress status={selected.status} labels={t.progress} />
              {actionError ? (
                <div className="adm-refunds__alert is-error" role="alert">
                  {actionError}
                </div>
              ) : null}
              {notice ? (
                <div className="adm-refunds__alert is-success" role="status">
                  {notice}
                </div>
              ) : null}

              <div className="adm-refunds__facts">
                <Fact
                  label={t.customer}
                  value={`${selected.customerName} · ${selected.customerEmail}`}
                />
                <Fact
                  label={t.amount}
                  value={money(selected.refundableAmount)}
                />
                <Fact label={t.invoice} value={selected.invoiceNumber} />
                <Fact
                  label={t.manager}
                  value={`${selected.requestedByName} · ${dateTime(selected.requestedAt)}`}
                />
              </div>
              <div className="adm-refunds__reason">
                <strong>{t.reason}</strong>
                <p>{selected.reason}</p>
              </div>
              {selected.status === 'REJECTED' ? (
                <div className="adm-refunds__reason">
                  <strong>{t.decisionAudit}</strong>
                  <p>
                    {selected.rejectedByName} ·{' '}
                    {selected.rejectedAt ? dateTime(selected.rejectedAt) : '—'}
                  </p>
                  <p>{selected.rejectionReason}</p>
                </div>
              ) : null}
              {selected.status === 'CANCELLED' ? (
                <div className="adm-refunds__reason">
                  <strong>{t.decisionAudit}</strong>
                  <p>
                    {selected.cancelledByName} ·{' '}
                    {selected.cancelledAt
                      ? dateTime(selected.cancelledAt)
                      : '—'}
                  </p>
                  <p>{selected.cancellationReason}</p>
                </div>
              ) : null}

              <section className="adm-refunds__subsection">
                <h3>{t.depositPayments}</h3>
                {selected.depositPayments.length ? (
                  selected.depositPayments.map((payment) => (
                    <article
                      className="adm-refunds__payment"
                      key={payment.paymentId}
                    >
                      <strong>
                        {money(payment.amount)} {payment.currency}
                      </strong>
                      <span>
                        {t.provider}: {payment.provider}
                      </span>
                      <span>
                        {t.reference}: {payment.transactionReference || '—'}
                      </span>
                      <time>
                        {t.paidAt}:{' '}
                        {payment.paidAt ? dateTime(payment.paidAt) : '—'}
                      </time>
                    </article>
                  ))
                ) : (
                  <p className="adm-refunds__empty">{t.noPayments}</p>
                )}
              </section>

              <section className="adm-refunds__subsection">
                <h3>{t.attempts}</h3>
                {selected.attempts.length ? (
                  selected.attempts.map((attempt) => (
                    <article className="adm-refunds__attempt" key={attempt.id}>
                      <header>
                        <strong>
                          {t.attempt} {attempt.attemptNumber}
                        </strong>
                        <em data-outcome={attempt.outcome}>
                          {t.transferStatus[attempt.outcome]}
                        </em>
                      </header>
                      <div className="adm-refunds__facts">
                        <Fact
                          label={t.executionChannel}
                          value={t.executionChannels[attempt.executionChannel]}
                        />
                        {attempt.executionChannel === 'BANK_TRANSFER' ? (
                          <>
                            <Fact
                              label={t.bank}
                              value={attempt.beneficiaryBank ?? '—'}
                            />
                            <Fact
                              label={t.beneficiary}
                              value={attempt.beneficiaryName ?? '—'}
                            />
                            <Fact
                              label={t.accountNumber}
                              value={attempt.beneficiaryAccountNumber ?? '—'}
                            />
                            <Fact
                              label={t.customerConfirmed}
                              value={
                                attempt.beneficiaryConfirmedWithCustomer
                                  ? t.successful
                                  : t.failed
                              }
                            />
                          </>
                        ) : null}
                        <Fact
                          label={t.amountField}
                          value={money(attempt.amount)}
                        />
                        <Fact
                          label={t.transactionReference}
                          value={attempt.transactionReference}
                        />
                        <Fact
                          label={t.transferDate}
                          value={dateTime(attempt.transferredAt)}
                        />
                      </div>
                      {attempt.note ? <p>{attempt.note}</p> : null}
                      {attempt.failureReason ? (
                        <p className="adm-refunds__failure">
                          {attempt.failureReason}
                        </p>
                      ) : null}
                      {attempt.receipts.length ? (
                        <div className="adm-refunds__receipt-links">
                          {attempt.receipts.map((receipt, index) => (
                            <RefundReceiptCard
                              key={receipt.id}
                              refundId={selected.id}
                              receipt={receipt}
                              index={index}
                              labels={{
                                image: t.receiptImage,
                                uploaded: t.receiptUploadedAt,
                                view: t.viewReceipt,
                                png: t.pngImage,
                                jpeg: t.jpegImage,
                              }}
                              onOpen={openReceipt}
                            />
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <p className="adm-refunds__empty">{t.noAttempts}</p>
                )}
              </section>

              {selected.status === 'REQUESTED' ? (
                <div className="adm-refunds__action-box">
                  <p>{t.beginHint}</p>
                  <div className="adm-refunds__action-row">
                    <Button
                      variant="primary"
                      loading={busy}
                      onClick={() => void startProcessing()}
                    >
                      {t.startProcessing}
                    </Button>
                    <Button
                      disabled={busy}
                      onClick={() => {
                        setDecisionReason('')
                        setDecisionAction('reject')
                      }}
                    >
                      {t.reject}
                    </Button>
                  </div>
                </div>
              ) : null}

              {selected.status === 'PROCESSING' && !successfulAttempt ? (
                <div className="adm-refunds__action-row">
                  <Button
                    disabled={busy}
                    onClick={() => {
                      setDecisionReason('')
                      setDecisionAction('cancel')
                    }}
                  >
                    {t.cancelProcessing}
                  </Button>
                </div>
              ) : null}
              {selected.status === 'PROCESSING' && successfulAttempt ? (
                <div className="adm-refunds__alert is-info" role="status">
                  {t.cannotCancelAfterSuccess}
                </div>
              ) : null}

              {selected.status === 'PROCESSING' ? (
                <section
                  className="adm-refunds__workflow"
                  aria-label={t.workflowTitle}
                >
                  <div className="adm-refunds__workflow-heading">
                    <div>
                      <p className="adm-refunds__eyebrow">
                        {t.workflowEyebrow}
                      </p>
                      <h3>{t.workflowTitle}</h3>
                    </div>
                    <span>
                      {successfulAttempt
                        ? t.stepProgressComplete
                        : t.stepProgressStart}
                    </span>
                  </div>

                  {!successfulAttempt ? (
                    <div className="adm-refunds__action-box">
                      <div className="adm-refunds__step-title">
                        <span>1</span>
                        <div>
                          <h4>{t.transferForm}</h4>
                          <p>{t.stepOneHint}</p>
                        </div>
                      </div>
                      {selected.attempts.some(
                        (attempt) => attempt.outcome === 'FAILED',
                      ) ? (
                        <p>{t.retryHint}</p>
                      ) : null}
                      <div className="adm-refunds__form-grid">
                        <label className="adm-refunds__field adm-refunds__field--wide">
                          <span>{t.executionChannel}</span>
                          <select
                            value={form.executionChannel}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                executionChannel: event.target
                                  .value as RefundExecutionChannel,
                                confirmedWithCustomer: false,
                              })
                            }
                          >
                            <option value="BANK_TRANSFER">
                              {t.executionChannels.BANK_TRANSFER}
                            </option>
                            <option
                              value="VNPAY_MERCHANT_PORTAL"
                              disabled={
                                selected.depositPayments.length !== 1 ||
                                selected.depositPayments[0]?.provider !==
                                  'VNPAY'
                              }
                            >
                              {t.executionChannels.VNPAY_MERCHANT_PORTAL}
                            </option>
                          </select>
                        </label>
                        <p className="adm-refunds__channel-hint">
                          {form.executionChannel === 'BANK_TRANSFER'
                            ? t.bankTransferHint
                            : t.vnpayPortalHint}
                        </p>
                        {form.executionChannel === 'BANK_TRANSFER' ? (
                          <>
                            <Field
                              label={t.bank}
                              value={form.bank}
                              onChange={(value) =>
                                setForm({
                                  ...form,
                                  bank: value,
                                  confirmedWithCustomer: false,
                                })
                              }
                            />
                            <Field
                              label={t.beneficiary}
                              value={form.beneficiary}
                              onChange={(value) =>
                                setForm({
                                  ...form,
                                  beneficiary: value,
                                  confirmedWithCustomer: false,
                                })
                              }
                            />
                            <Field
                              label={t.accountNumber}
                              value={form.accountNumber}
                              onChange={(value) =>
                                setForm({
                                  ...form,
                                  accountNumber: value,
                                  confirmedWithCustomer: false,
                                })
                              }
                            />
                          </>
                        ) : null}
                        <Field
                          label={t.amountField}
                          type="number"
                          min="1"
                          value={
                            form.amount || String(selected.refundableAmount)
                          }
                          onChange={(value) =>
                            setForm({ ...form, amount: value })
                          }
                        />
                        <Field
                          label={t.transactionReference}
                          value={form.reference}
                          onChange={(value) =>
                            setForm({ ...form, reference: value })
                          }
                        />
                        <Field
                          label={t.transferDate}
                          type="datetime-local"
                          value={form.transferredAt}
                          onChange={(value) =>
                            setForm({ ...form, transferredAt: value })
                          }
                        />
                        {form.executionChannel === 'BANK_TRANSFER' ? (
                          <label className="adm-refunds__confirm-field">
                            <input
                              type="checkbox"
                              checked={form.confirmedWithCustomer}
                              onChange={(event) =>
                                setForm({
                                  ...form,
                                  confirmedWithCustomer: event.target.checked,
                                })
                              }
                            />
                            <span>{t.customerConfirmed}</span>
                          </label>
                        ) : null}
                        <label className="adm-refunds__field">
                          <span>{t.outcome}</span>
                          <select
                            value={outcome}
                            onChange={(event) =>
                              setOutcome(
                                event.target.value as 'SUCCESSFUL' | 'FAILED',
                              )
                            }
                          >
                            <option value="SUCCESSFUL">{t.successful}</option>
                            <option value="FAILED">{t.failed}</option>
                          </select>
                        </label>
                        <label className="adm-refunds__field adm-refunds__field--wide">
                          <span>{t.note}</span>
                          <textarea
                            rows={2}
                            value={form.note}
                            onChange={(event) =>
                              setForm({ ...form, note: event.target.value })
                            }
                          />
                        </label>
                        {outcome === 'FAILED' ? (
                          <label className="adm-refunds__field adm-refunds__field--wide">
                            <span>{t.failureReason}</span>
                            <textarea
                              rows={2}
                              value={form.failureReason}
                              onChange={(event) =>
                                setForm({
                                  ...form,
                                  failureReason: event.target.value,
                                })
                              }
                            />
                          </label>
                        ) : null}
                      </div>
                      <Button
                        variant="primary"
                        loading={busy}
                        onClick={() => void saveAttempt()}
                      >
                        {busy ? t.saving : t.saveAttempt}
                      </Button>
                    </div>
                  ) : (
                    <div className="adm-refunds__step-done">
                      <span aria-hidden="true">✓</span>
                      <div>
                        <strong>{t.transferRecorded}</strong>
                        <p>
                          {money(successfulAttempt.amount)} ·{' '}
                          {successfulAttempt.transactionReference}
                        </p>
                      </div>
                    </div>
                  )}

                  <div
                    className={`adm-refunds__action-box ${successfulAttempt ? '' : 'is-locked'}`}
                  >
                    <div className="adm-refunds__step-title">
                      <span>2</span>
                      <div>
                        <h4>{t.receipts}</h4>
                        <p>
                          {successfulAttempt
                            ? t.receiptStepHint
                            : t.receiptStepLocked}
                        </p>
                      </div>
                    </div>
                    <label
                      className={`adm-refunds__upload ${successfulAttempt && remainingReceiptSlots > 0 ? '' : 'is-disabled'}`}
                    >
                      <input
                        ref={receiptInputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        multiple
                        disabled={
                          busy ||
                          !successfulAttempt ||
                          remainingReceiptSlots === 0
                        }
                        onChange={(event) => {
                          const selectedFiles = Array.from(
                            event.target.files ?? [],
                          )
                          if (selectedFiles.length > remainingReceiptSlots) {
                            setActionError(t.receiptLimit)
                            setFiles([])
                            event.target.value = ''
                            return
                          }
                          setActionError('')
                          setFiles(selectedFiles)
                        }}
                      />
                      <span
                        className="adm-refunds__upload-icon"
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 15.5v3A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-3"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <strong>
                        {!successfulAttempt
                          ? t.uploadUnavailable
                          : remainingReceiptSlots > 0
                            ? t.chooseReceipts
                            : t.receiptLimitReached}
                      </strong>
                      <small>{t.receiptFormats}</small>
                    </label>
                    {files.length ? (
                      <div
                        className="adm-refunds__previews"
                        aria-label={t.preview}
                      >
                        {files.map((file, index) => (
                          <figure key={`${file.name}-${file.lastModified}`}>
                            <ImagePreview
                              src={previewUrls[index]}
                              fileName={file.name}
                            />
                            <figcaption>{file.name}</figcaption>
                          </figure>
                        ))}
                      </div>
                    ) : null}
                    <Button
                      loading={busy}
                      disabled={!files.length || !successfulAttempt}
                      onClick={() => void uploadReceipts()}
                    >
                      {busy ? t.uploading : t.uploadReceipts}
                    </Button>
                    {successfulAttempt &&
                    successfulAttempt.receipts.length > 0 ? (
                      <p>
                        {successfulAttempt.receipts.length} ·{' '}
                        {t.receiptUploaded}
                      </p>
                    ) : (
                      <p className="adm-refunds__hint">
                        {successfulAttempt
                          ? t.receiptRequired
                          : t.receiptStepLocked}
                      </p>
                    )}
                  </div>

                  <div
                    className={`adm-refunds__confirm-step ${successfulAttempt?.receipts.length ? 'is-ready' : ''}`}
                  >
                    <div className="adm-refunds__step-title">
                      <span>3</span>
                      <div>
                        <h4>{t.confirmRefund}</h4>
                        <p>{t.confirmStepHint}</p>
                      </div>
                    </div>
                    {successfulAttempt?.receipts.length ? (
                      <Button
                        variant="primary"
                        disabled={busy}
                        onClick={() => setConfirmOpen(true)}
                      >
                        {t.confirmRefund}
                      </Button>
                    ) : (
                      <span className="adm-refunds__pending-label">
                        {t.waitingForEvidence}
                      </span>
                    )}
                  </div>
                </section>
              ) : null}

              {selected.status === 'COMPLETED' ? (
                <div className="adm-refunds__alert is-success">
                  {t.immutable}
                </div>
              ) : null}
            </section>
          ) : (
            <section className="adm-refunds__detail adm-refunds__empty">
              {t.empty}
            </section>
          )}
        </div>
      ) : null}

      {confirmOpen ? (
        <Modal
          title={t.confirmTitle}
          subtitle={t.confirmBody}
          tone="warning"
          onClose={() => setConfirmOpen(false)}
          footer={
            <>
              <Button onClick={() => setConfirmOpen(false)}>{t.cancel}</Button>
              <Button
                variant="primary"
                loading={busy}
                onClick={() => void confirmRefund()}
              >
                {t.confirm}
              </Button>
            </>
          }
        >
          <p>
            {selected
              ? `${selected.orderCode || selected.orderTitle} · ${money(selected.refundableAmount)}`
              : ''}
          </p>
        </Modal>
      ) : null}

      {decisionAction ? (
        <Modal
          title={t.decisionTitle[decisionAction]}
          subtitle={t.decisionPrompt[decisionAction]}
          tone="warning"
          onClose={() => setDecisionAction(null)}
          footer={
            <>
              <Button onClick={() => setDecisionAction(null)}>
                {t.cancel}
              </Button>
              <Button
                variant="primary"
                loading={busy}
                onClick={() => void submitDecision()}
              >
                {t.confirmDecision}
              </Button>
            </>
          }
        >
          <label className="adm-refunds__field">
            <span>{t.decisionReason}</span>
            <textarea
              rows={3}
              value={decisionReason}
              onChange={(event) => setDecisionReason(event.target.value)}
            />
          </label>
          {actionError ? (
            <div className="adm-refunds__alert is-error" role="alert">
              {actionError}
            </div>
          ) : null}
        </Modal>
      ) : null}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="adm-refunds__fact">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  )
}

function RefundProgress({
  status,
  labels,
}: {
  status: RefundStatus
  labels: { requested: string; processing: string; completed: string }
}) {
  if (status === 'REJECTED' || status === 'CANCELLED') return null
  const activeIndex =
    status === 'REQUESTED' ? 0 : status === 'PROCESSING' ? 1 : 2
  const steps = [labels.requested, labels.processing, labels.completed]

  return (
    <ol className="adm-refunds__progress" aria-label={labels.processing}>
      {steps.map((label, index) => (
        <li
          key={label}
          className={
            index < activeIndex
              ? 'is-complete'
              : index === activeIndex
                ? 'is-current'
                : ''
          }
          aria-current={index === activeIndex ? 'step' : undefined}
        >
          <span>{index < activeIndex ? '✓' : index + 1}</span>
          <strong>{label}</strong>
        </li>
      ))}
    </ol>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  min,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  min?: string
}) {
  return (
    <label className="adm-refunds__field">
      <span>{label}</span>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

type RefundReceiptCardProps = {
  refundId: string
  receipt: RefundReceipt
  index: number
  labels: {
    image: string
    uploaded: string
    view: string
    png: string
    jpeg: string
  }
  onOpen: (refundId: string, receiptId: string) => Promise<void>
}

function RefundReceiptCard({
  refundId,
  receipt,
  index,
  labels,
  onOpen,
}: RefundReceiptCardProps) {
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewFailed, setPreviewFailed] = useState(false)

  useEffect(() => {
    let active = true
    refundApi
      .getReceiptAccess(refundId, receipt.id)
      .then((access) => {
        if (active) setPreviewUrl(access.url)
      })
      .catch(() => {
        if (active) setPreviewFailed(true)
      })
    return () => {
      active = false
    }
  }, [refundId, receipt.id])

  const fileType = receipt.contentType.toLowerCase().includes('png')
    ? labels.png
    : labels.jpeg
  const uploadedAt = receipt.uploadedAt ? dateTime(receipt.uploadedAt) : null

  return (
    <button
      type="button"
      className="adm-refunds__receipt-card"
      aria-label={`${labels.view}: ${labels.image} ${index + 1}`}
      onClick={() => void onOpen(refundId, receipt.id)}
    >
      <span className="adm-refunds__receipt-thumbnail" aria-hidden="true">
        {previewUrl && !previewFailed ? (
          <img
            src={previewUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <FileImageOutlined />
        )}
      </span>
      <span className="adm-refunds__receipt-info">
        <strong>
          {labels.image} {index + 1}
        </strong>
        <span>
          {fileType} <span aria-hidden="true">·</span>{' '}
          {formatFileSize(receipt.byteSize)}
        </span>
        {uploadedAt ? (
          <small>
            {labels.uploaded} {uploadedAt}
          </small>
        ) : null}
      </span>
      <span className="adm-refunds__receipt-view" aria-hidden="true">
        <EyeOutlined />
      </span>
    </button>
  )
}

function money(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatFileSize(byteSize: number) {
  if (byteSize < 1024) return `${byteSize} B`
  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
  }).format(byteSize / 1024)} KB`
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function localDateTimeNow() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}
