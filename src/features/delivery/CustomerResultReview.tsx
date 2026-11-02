import { useEffect, useState } from 'react'
import { Alert, Button, Checkbox, Input, Select, Skeleton } from 'antd'
import { ApiError } from '../../shared/api/httpClient'
import { useI18n } from '../../shared/i18n'
import {
  deliveryApi,
  type ResultReview,
  type RevisionReasonCode,
  type RevisionRequestBody,
} from './api'
import { customerDeliveryPanelMessages } from './customerDeliveryPanel.messages'

type Props = {
  orderId: string
  onComplete: () => void
  onSubmitted: (ticket: { id: string; code: string }) => void
}
const reasonCodes: RevisionReasonCode[] = [
  'MISSING_EVIDENCE',
  'POOR_QUALITY',
  'WRONG_LOCATION',
  'REQUIREMENT_NOT_MET',
  'OTHER',
]

export function CustomerResultReview({
  orderId,
  onComplete,
  onSubmitted,
}: Props) {
  const { t, locale } = useI18n(customerDeliveryPanelMessages)
  const [review, setReview] = useState<ResultReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [feedback, setFeedback] = useState<
    Record<
      string,
      { reasonCode: RevisionReasonCode; note: string; evidenceIds: string[] }
    >
  >({})
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [generalNote, setGeneralNote] = useState('')
  const [confirm, setConfirm] = useState<'accept' | 'revision' | null>(null)
  const [busy, setBusy] = useState(false)
  // Kept in component state across uncertain network retries; never persisted.
  const [clientRequestId, setClientRequestId] = useState<string | null>(null)
  const [pendingRevision, setPendingRevision] =
    useState<RevisionRequestBody | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setReview(await deliveryApi.getResultReview(orderId))
    } catch (cause) {
      setError(cause)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [orderId])

  function updateItem(
    id: string,
    patch: Partial<{
      reasonCode: RevisionReasonCode
      note: string
      evidenceIds: string[]
    }>,
  ) {
    setFeedback((current) => {
      const previous = current[id] ?? {
        reasonCode: 'OTHER' as const,
        note: '',
        evidenceIds: [],
      }
      return { ...current, [id]: { ...previous, ...patch } }
    })
  }

  async function submit() {
    if (!review || busy) return
    setBusy(true)
    setError(null)
    try {
      if (confirm === 'accept') {
        await deliveryApi.accept(
          orderId,
          review.reviewRoundId,
          review.roundVersion,
        )
      } else {
        const body =
          pendingRevision ??
          (() => {
            const id =
              clientRequestId ??
              crypto.randomUUID?.() ??
              `${Date.now()}-${Math.random()}`
            const selected = review.items.filter((item) =>
              selectedItems.includes(item.roundItemId),
            )
            const request: RevisionRequestBody = {
              reviewRoundId: review.reviewRoundId,
              expectedRoundVersion: review.roundVersion,
              clientRequestId: id,
              generalNote: generalNote.trim(),
              items: selected.map((item) => ({
                roundItemId: item.roundItemId,
                reasonCode: feedback[item.roundItemId].reasonCode,
                note: feedback[item.roundItemId].note.trim(),
                roundEvidenceIds: feedback[item.roundItemId].evidenceIds.filter(
                  (evidenceId) =>
                    item.evidence.some((e) => e.roundEvidenceId === evidenceId),
                ),
              })),
            }
            setClientRequestId(id)
            setPendingRevision(request)
            return request
          })()
        const response = await deliveryApi.requestRevision(orderId, body)
        setReview({
          ...review,
          existingRequest: {
            revisionRequestId: response.revisionRequestId,
            ticketId: response.ticketId,
            ticketCode: response.ticketCode,
          },
        })
        onSubmitted({ id: response.ticketId, code: response.ticketCode })
        setClientRequestId(null)
        setPendingRevision(null)
      }
      setConfirm(null)
      onComplete()
      if (confirm === 'accept') await load()
    } catch (cause) {
      // Do not refresh/remap a stale round: preserve all feedback for explicit customer review.
      setConfirm(null)
      setError(cause)
    } finally {
      setBusy(false)
    }
  }

  if (loading)
    return (
      <div className="delivery-review-round">
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    )
  if (error && !review)
    return (
      <Alert
        type="error"
        showIcon
        message={error instanceof Error ? error.message : t.genericError}
        action={
          <Button type="link" onClick={() => void load()}>
            {t.retry}
          </Button>
        }
      />
    )
  if (!review) return null
  const revisionLocked = pendingRevision !== null

  return (
    <section
      className="delivery-review-round"
      aria-labelledby="result-review-title"
    >
      <div className="delivery-section__head">
        <div>
          <h3 id="result-review-title">{t.reviewRound(review.roundNumber)}</h3>
          <p>
            {t.publishedAt(new Date(review.publishedAt).toLocaleString(locale))}
          </p>
        </div>
      </div>
      {review.blockedReason && (
        <Alert type="warning" showIcon message={review.blockedReason} />
      )}
      {review.existingRequest && (
        <Alert
          type="info"
          showIcon
          message={t.requestAlreadyExists(review.existingRequest.ticketCode)}
          action={
            <a
              href={`#help/tickets/${encodeURIComponent(review.existingRequest.ticketId)}`}
            >
              {t.openTicket}
            </a>
          }
        />
      )}
      <div className="delivery-review-items">
        {review.items.map((item) => {
          const value = feedback[item.roundItemId] ?? {
            reasonCode: 'OTHER' as const,
            note: '',
            evidenceIds: [],
          }
          return (
            <article className="delivery-review-item" key={item.roundItemId}>
              <Checkbox
                disabled={revisionLocked}
                checked={selectedItems.includes(item.roundItemId)}
                onChange={(event) =>
                  setSelectedItems((current) =>
                    event.target.checked
                      ? [...current, item.roundItemId]
                      : current.filter((id) => id !== item.roundItemId),
                  )
                }
              >
                {t.selectChecklistItem}
              </Checkbox>
              <h4>{item.title}</h4>
              {item.description && <p>{item.description}</p>}
              {item.missionCode && (
                <small>{t.missionCode(item.missionCode)}</small>
              )}
              {item.executionSteps.length > 0 && (
                <p>
                  <b>{t.executionSteps}</b> {item.executionSteps.join(' · ')}
                </p>
              )}
              {item.inputRequirements.length > 0 && (
                <p>
                  <b>{t.inputRequirements}</b>{' '}
                  {item.inputRequirements.join(' · ')}
                </p>
              )}
              {item.expectedOutputs.length > 0 && (
                <p>
                  <b>{t.expectedOutputs}</b> {item.expectedOutputs.join(' · ')}
                </p>
              )}
              <div className="delivery-review-evidence">
                {item.evidence.length === 0 ? (
                  <p className="delivery-review-media-empty" role="status">
                    {t.noEvidence}
                  </p>
                ) : item.evidence.map((evidence) => (
                  <label key={evidence.roundEvidenceId}>
                    {!evidence.url ? (
                      <span className="delivery-review-media-unavailable">
                        {t.mediaUnavailable}
                      </span>
                    ) : evidence.type.toUpperCase().includes('VIDEO') ? (
                      <video controls preload="metadata" src={evidence.url} />
                    ) : (
                      <img
                        src={evidence.url}
                        alt={evidence.fileName}
                        loading="lazy"
                      />
                    )}
                    <Checkbox
                      disabled={revisionLocked}
                      checked={value.evidenceIds.includes(
                        evidence.roundEvidenceId,
                      )}
                      onChange={(event) =>
                        updateItem(item.roundItemId, {
                          evidenceIds: event.target.checked
                            ? [...value.evidenceIds, evidence.roundEvidenceId]
                            : value.evidenceIds.filter(
                                (id) => id !== evidence.roundEvidenceId,
                              ),
                        })
                      }
                    >
                      {evidence.fileName} · {formatSize(evidence.size)}
                    </Checkbox>
                    {evidence.downloadable && evidence.url && (
                      <a href={evidence.url} download={evidence.fileName}>
                        {t.download}
                      </a>
                    )}
                  </label>
                ))}
              </div>
              <label className="delivery-feedback-label">
                {t.reasonLabel}
                <Select
                  disabled={revisionLocked}
                  value={value.reasonCode}
                  onChange={(reasonCode: RevisionReasonCode) =>
                    updateItem(item.roundItemId, { reasonCode })
                  }
                  options={reasonCodes.map((code) => ({
                    value: code,
                    label: t.reasonCodes[code],
                  }))}
                />
              </label>
              <label className="delivery-feedback-label">
                {t.itemNote}
                <Input.TextArea
                  disabled={revisionLocked}
                  rows={2}
                  maxLength={2000}
                  value={value.note}
                  onChange={(event) =>
                    updateItem(item.roundItemId, { note: event.target.value })
                  }
                  required
                />
              </label>
            </article>
          )
        })}
      </div>
      {review.canSubmitRevision && !review.existingRequest && (
        <>
          <label className="delivery-feedback-label">
            {t.generalNote}
            <Input.TextArea
              disabled={revisionLocked}
              rows={2}
              maxLength={2000}
              value={generalNote}
              onChange={(event) => setGeneralNote(event.target.value)}
            />
          </label>
          {selectedItems.length > 0 && (
            <Button
              onClick={() => setConfirm('revision')}
              disabled={
                busy || selectedItems.some((id) => !feedback[id]?.note.trim())
              }
            >
              {revisionLocked ? t.retrySubmission : t.sendStructuredRequest}
            </Button>
          )}
        </>
      )}
      {review.canAcceptResult && !review.existingRequest && (
        <Button
          type="primary"
          onClick={() => setConfirm('accept')}
          disabled={busy || revisionLocked}
        >
          {t.acceptAll}
        </Button>
      )}
      {confirm && (
        <div
          className="delivery-review-confirm"
          role="alertdialog"
          aria-labelledby="review-confirm-title"
        >
          <h4 id="review-confirm-title">
            {confirm === 'accept'
              ? t.acceptAllConfirmTitle
              : t.revisionConfirmTitle}
          </h4>
          <p>
            {confirm === 'accept'
              ? t.acceptAllConfirmBody
              : t.revisionConfirmBody}
          </p>
          <div className="delivery-actions">
            <Button onClick={() => setConfirm(null)} disabled={busy}>
              {t.cancel}
            </Button>
            <Button type="primary" onClick={() => void submit()} loading={busy}>
              {t.confirmSend}
            </Button>
          </div>
        </div>
      )}
      {Boolean(error) && (
        <Alert
          type="error"
          showIcon
          message={
            error instanceof ApiError && error.status === 409
              ? t.staleRound
              : error instanceof Error
                ? error.message
                : t.genericError
          }
          description={
            error instanceof ApiError && error.status === 409
              ? t.staleRoundHelp
              : undefined
          }
          action={
            error instanceof ApiError && error.status === 409 ? (
              <Button
                type="link"
                onClick={() => {
                  setPendingRevision(null)
                  setClientRequestId(null)
                  setSelectedItems([])
                  void load()
                }}
              >
                {t.reloadRound}
              </Button>
            ) : undefined
          }
        />
      )}
    </section>
  )
}

function formatSize(size: number) {
  return size > 0 ? `${Math.ceil(size / 1024)} KB` : ''
}
