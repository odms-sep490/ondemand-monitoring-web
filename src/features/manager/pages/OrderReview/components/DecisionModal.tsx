import type { OrderReviewMessages } from '../OrderReviewPage.messages'
import { useState, useRef, useEffect } from 'react'
import type { ApprovalDecision } from '../../../types/orders'
import { ordersApi } from '../../../api/ordersApi'

export function DecisionModal({
  kind,
  orderCode,
  orderId,
  onClose,
  onDone,
  t,
}: {
  kind: 'reject' | 'info'
  orderCode: string
  orderId: string
  onClose: () => void
  onDone: () => void
  t: OrderReviewMessages
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const chips = kind === 'reject' ? t.rejectReasonChips : t.infoReasonChips
  const decision: ApprovalDecision =
    kind === 'reject' ? 'REJECTED' : 'NEED_INFO'

  async function handleConfirm() {
    if (!reason.trim()) {
      setError(t.reasonRequired)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await ordersApi.submitApproval(orderId, { decision, reason })
      onDone()
    } catch {
      setError(t.submitFailed)
      setBusy(false)
    }
  }

  return (
    <div className="odm-mgr-modal-overlay">
      <div
        className="odm-mgr-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="odm-mgr-modal-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="odm-mgr-modal-head">
          <div>
            <div id="odm-mgr-modal-title" className="odm-mgr-modal-title">
              {kind === 'reject'
                ? t.rejectModalTitle(orderCode)
                : t.infoModalTitle}
            </div>
            <div className="odm-mgr-review-hint">
              {kind === 'reject' ? t.rejectModalHint : t.infoModalHint}
            </div>
          </div>
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
            onClick={onClose}
            aria-label={t.close}
          >
            ×
          </button>
        </div>
        <div className="odm-mgr-modal-body">
          <div className="odm-mgr-modal-chips">
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                className="odm-mgr-modal-chip"
                onClick={() => setReason(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
          <label>
            <span className="odm-mgr-modal-label">
              {t.reasonLabel} <span style={{ color: 'var(--red-fg)' }}>*</span>
            </span>
            <textarea
              className="odm-inp"
              rows={4}
              placeholder={t.reasonPlaceholder}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError(null)
              }}
            />
            <div className="odm-mgr-review-hint">{t.reasonSavedHint}</div>
            {error ? <div className="odm-mgr-modal-error">{error}</div> : null}
          </label>
        </div>
        <div className="odm-mgr-modal-footer">
          <button type="button" className="odm-btn" onClick={onClose}>
            {t.cancel}
          </button>
          <button
            type="button"
            className={
              kind === 'reject' ? 'odm-btn odm-btn-rd' : 'odm-btn odm-btn-yl'
            }
            onClick={handleConfirm}
            disabled={busy}
          >
            {kind === 'reject' ? t.confirmReject : t.sendRequest}
          </button>
        </div>
      </div>
    </div>
  )
}
