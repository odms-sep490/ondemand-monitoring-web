import { CloseOutlined } from '@ant-design/icons'
import type { OrderDetail, LegalReviewStatus } from '../../../types/orders'
import type { SavedAreaReview, AreaReviewChoice } from '../areaTypes'
import { useState } from 'react'
import { ordersApi } from '../../../api/ordersApi'
import { managerHref } from '../../../routes'
import { REVIEW_OPTIONS, UNSUITABLE_REASONS } from '../areaHelpers'
import { Button, useToast } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { managerFeedbackMessages } from '../../../feedback.messages'
import { areaReviewDialogMessages } from './AreaReviewDialog.messages'

export function AreaReviewDialog({
  order,
  initial,
  zoneCount,
  onClose,
  onSaved,
}: {
  order: OrderDetail
  initial: SavedAreaReview | null
  zoneCount: number
  onClose: () => void
  onSaved: (review: SavedAreaReview) => void
}) {
  const { t: fb } = useI18n(managerFeedbackMessages)
  const { t } = useI18n(areaReviewDialogMessages)
  const toast = useToast()
  const [status, setStatus] = useState<AreaReviewChoice | null>(
    initial?.status ?? null,
  )
  const [reason, setReason] = useState(initial?.reason ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const reasonRequired = status === 'REJECTED' || status === 'CHANGE_LOCATION'

  async function save() {
    if (!status) return setError(t.chooseResult)
    if (reasonRequired && !reason.trim()) return setError(t.chooseReason)
    setSaving(true)
    setError('')
    try {
      const savedStatus: LegalReviewStatus =
        status === 'CHANGE_LOCATION' ? 'REJECTED' : status
      const result = await ordersApi.saveFlightAreaReview(order.id, {
        status: savedStatus,
        reason: reason.trim() || null,
        note: note.trim() || null,
      })
      if (status === 'CHANGE_LOCATION') {
        await ordersApi.submitApproval(order.id, {
          decision: 'NEED_INFO',
          reason: [reason.trim(), note.trim()].filter(Boolean).join(' — '),
          requestedUpdateScope: 'LOCATION',
        })
        toast.success(fb.infoRequested)
        window.location.hash = managerHref({ screen: 'orderQueue' })
        return
      }
      toast.success(fb.areaReviewSaved)
      onSaved({
        status: result.legalReviewStatus ?? savedStatus,
        requestedScopeFeasible: result.requestedScopeFeasible ?? null,
        reason: result.flightAreaReviewReason ?? (reason.trim() || null),
        note: result.flightAreaReviewNote ?? (note.trim() || null),
        reviewer: result.flightAreaReviewedByName ?? 'Manager',
        reviewedAt: result.flightAreaReviewedAt ?? new Date().toISOString(),
      })
    } catch {
      setError(t.saveFailed)
      toast.error(t.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="odm-or-area-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="odm-or-area-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="area-review-title"
      >
        <header>
          <div>
            <h3 id="area-review-title">{t.title}</h3>
            <p>{t.subtitle}</p>
          </div>
          <button type="button" aria-label={t.close} onClick={onClose}>
            <CloseOutlined aria-hidden="true" />
          </button>
        </header>
        <div className="odm-or-area-modal-context">
          <b>{order.title || t.monitoringRequest}</b>
          <span>{t.zonesToCheck(zoneCount)}</span>
        </div>
        <div className="odm-or-area-review-options">
          {REVIEW_OPTIONS.map((option) => (
            <label
              key={option.status}
              className={status === option.status ? 'is-selected' : ''}
            >
              <input
                type="radio"
                name="area-review"
                checked={status === option.status}
                onChange={() => {
                  setStatus(option.status)
                  setError('')
                }}
              />
              <span>
                <b>{option.label}</b>
                <small>{option.hint}</small>
              </span>
            </label>
          ))}
        </div>
        {reasonRequired ? (
          <label className="odm-or-area-field">
            {t.reason}
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            >
              <option value="">{t.selectReason}</option>
              {UNSUITABLE_REASONS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="odm-or-area-field">
          {t.managerNote}
          <textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t.notePlaceholder}
          />
        </label>
        {error ? (
          <p className="odm-or-area-error" role="alert">
            {error}
          </p>
        ) : null}
        <footer>
          <Button type="button" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={saving}
            onClick={save}
          >
            {saving ? t.saving : t.confirm}
          </Button>
        </footer>
      </section>
    </div>
  )
}
