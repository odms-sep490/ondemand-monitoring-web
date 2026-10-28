import { CheckOutlined } from '@ant-design/icons'
import type { OrderReviewMessages } from '../OrderReviewPage.messages'
import type { ApproveResult } from '../approvalTypes'
import { useState, useRef } from 'react'
import { ordersApi } from '../../../api/ordersApi'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { Button, Modal, useToast } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { managerFeedbackMessages } from '../../../feedback.messages'

export function ApproveButton({
  orderId,
  t,
  onApproved,
}: {
  orderId: string
  t: OrderReviewMessages
  onApproved: (result: ApproveResult) => void
}) {
  const { t: fb } = useI18n(managerFeedbackMessages)
  const toast = useToast()
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
      toast.success(fb.orderApproved)
      onApproved(result)
    } catch {
      setError(t.approveFailed)
      toast.error(t.approveFailed)
      setBusy(false)
      approveInFlightRef.current = false
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="primary"
        onClick={() => setConfirming(true)}
        disabled={busy}
      >
        <OrderIcon name="check" size={16} />
        {t.approveAndCreateMission}
        <OrderIcon name="chevron-right" size={16} />
      </Button>
      {confirming ? (
        <Modal
          title={t.approveTitle}
          subtitle={t.approveHint}
          icon="check"
          tone="success"
          onClose={() => {
            if (!busy) setConfirming(false)
          }}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setConfirming(false)}
                disabled={busy}
              >
                {t.approveCancel}
              </Button>
              <Button
                variant="primary"
                onClick={handleApprove}
                loading={busy}
              >
                {busy ? t.approving : t.approveContinue}
              </Button>
            </>
          }
        >
          {t.approveChecklist.map((item) => (
            <div key={item} style={{ fontSize: 13, lineHeight: 1.7 }}>
              <CheckOutlined aria-hidden="true" /> {item}
            </div>
          ))}
        </Modal>
      ) : null}
      {error ? <span className="odm-or-note-error">{error}</span> : null}
    </>
  )
}
