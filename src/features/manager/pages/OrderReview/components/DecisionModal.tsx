import type { OrderReviewMessages } from '../OrderReviewPage.messages'
import { useState } from 'react'
import type { ApprovalDecision } from '../../../types/orders'
import { ordersApi } from '../../../api/ordersApi'
import { Button, Modal, useToast } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { managerFeedbackMessages } from '../../../feedback.messages'

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
  const { t: fb } = useI18n(managerFeedbackMessages)
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
      toast.success(kind === 'reject' ? fb.orderRejected : fb.infoRequested)
      onDone()
    } catch {
      setError(t.submitFailed)
      toast.error(t.submitFailed)
      setBusy(false)
    }
  }

  return (
    <Modal
      title={kind === 'reject' ? t.rejectModalTitle(orderCode) : t.infoModalTitle}
      subtitle={kind === 'reject' ? t.rejectModalHint : t.infoModalHint}
      icon={kind === 'reject' ? 'trash' : 'mail'}
      tone={kind === 'reject' ? 'danger' : 'warning'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button
            variant={kind === 'reject' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={busy}
          >
            {kind === 'reject' ? t.confirmReject : t.sendRequest}
          </Button>
        </>
      }
    >
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
    </Modal>
  )
}
