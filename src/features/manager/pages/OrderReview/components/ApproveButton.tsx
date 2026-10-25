import type { OrderReviewMessages } from '../OrderReviewPage.messages'
import type { ApproveResult } from '../approvalTypes'
import { useState, useRef } from 'react'
import { ordersApi } from '../../../api/ordersApi'
import { OrderIcon } from '../../../components/common/OrderIcon'

export function ApproveButton({
  orderId,
  t,
  onApproved,
}: {
  orderId: string
  t: OrderReviewMessages
  onApproved: (result: ApproveResult) => void
}) {
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const approveInFlightRef = useRef(false)

  async function handleApprove() {
    if (approveInFlightRef.current) return
    approveInFlightRef.current = true
    setBusy(true)
    setError(null)
    try {
      const result = await ordersApi.approve(orderId)
      onApproved(result)
    } catch {
      setError(t.approveFailed)
      setBusy(false)
      approveInFlightRef.current = false
    }
  }

  return (
    <>
      <button
        type="button"
        className="odm-or-btn odm-or-btn-primary"
        onClick={() => setConfirming(true)}
        disabled={busy}
      >
        <OrderIcon name="check" size={16} />
        {t.approveAndCreateMission}
        <OrderIcon name="chevron-right" size={16} />
      </button>
      {confirming ? (
        <div className="odm-mgr-modal-overlay">
          <div className="odm-mgr-modal-dialog" role="dialog" aria-modal="true">
            <div className="odm-mgr-modal-head">
              <div>
                <div className="odm-mgr-modal-title">{t.approveTitle}</div>
                <div className="odm-mgr-review-hint">{t.approveHint}</div>
              </div>
            </div>
            <div className="odm-mgr-modal-body">
              {t.approveChecklist.map((item) => (
                <div key={item} style={{ fontSize: 13, lineHeight: 1.7 }}>
                  ✓ {item}
                </div>
              ))}
            </div>
            <div className="odm-mgr-modal-footer">
              <button
                type="button"
                className="odm-btn"
                onClick={() => setConfirming(false)}
                disabled={busy}
              >
                {t.approveCancel}
              </button>
              <button
                type="button"
                className="odm-btn odm-btn-ok"
                onClick={handleApprove}
                disabled={busy}
              >
                {busy ? t.approving : t.approveContinue}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {error ? <span className="odm-or-note-error">{error}</span> : null}
    </>
  )
}
