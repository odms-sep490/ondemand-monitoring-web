import type { OrderDetail, LegalReviewStatus } from '../../../types/orders'
import type { SavedAreaReview, AreaReviewChoice } from '../areaTypes'
import { useState } from 'react'
import { ordersApi } from '../../../api/ordersApi'
import { managerHref } from '../../../routes'
import { REVIEW_OPTIONS, UNSUITABLE_REASONS } from '../areaHelpers'

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
  const [status, setStatus] = useState<AreaReviewChoice | null>(
    initial?.status ?? null,
  )
  const [reason, setReason] = useState(initial?.reason ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const reasonRequired = status === 'REJECTED' || status === 'CHANGE_LOCATION'

  async function save() {
    if (!status) return setError('Chọn một kết quả đánh giá.')
    if (reasonRequired && !reason.trim())
      return setError('Chọn lý do khu vực không phù hợp.')
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
        window.location.hash = managerHref({ screen: 'orderQueue' })
        return
      }
      onSaved({
        status: result.legalReviewStatus ?? savedStatus,
        requestedScopeFeasible: result.requestedScopeFeasible ?? null,
        reason: result.flightAreaReviewReason ?? (reason.trim() || null),
        note: result.flightAreaReviewNote ?? (note.trim() || null),
        reviewer: result.flightAreaReviewedByName ?? 'Manager',
        reviewedAt: result.flightAreaReviewedAt ?? new Date().toISOString(),
      })
    } catch {
      setError('Không thể lưu đánh giá. Vui lòng thử lại.')
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
            <h3 id="area-review-title">Đánh giá điều kiện khu vực bay</h3>
            <p>Kết quả bản đồ cần được Manager xác nhận trước khi tiếp tục.</p>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="odm-or-area-modal-context">
          <b>{order.title || 'Yêu cầu giám sát'}</b>
          <span>{zoneCount} vùng cần đối chiếu</span>
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
            Lý do
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            >
              <option value="">Chọn lý do</option>
              {UNSUITABLE_REASONS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="odm-or-area-field">
          Ghi chú của Manager
          <textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ghi lại nội dung đã đối chiếu hoặc lưu ý cho bước tiếp theo…"
          />
        </label>
        {error ? (
          <p className="odm-or-area-error" role="alert">
            {error}
          </p>
        ) : null}
        <footer>
          <button type="button" className="odm-btn" onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            disabled={saving}
            onClick={save}
          >
            {saving ? 'Đang lưu…' : 'Xác nhận đánh giá'}
          </button>
        </footer>
      </section>
    </div>
  )
}
