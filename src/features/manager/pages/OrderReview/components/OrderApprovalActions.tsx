import { useState } from 'react'
import type { OrderReviewMessages } from '../OrderReviewPage.messages'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { DecisionModal } from './DecisionModal'
import { type ApproveResult, type ModalKind } from '../approvalTypes'
import { ApproveButton } from './ApproveButton'
import { Button } from '../../../../../shared/components/ui'

/**
 * Sticky bottom action bar for the order review step: request more info,
 * reject, or approve & continue to scheduling. Owns the approve-confirm and
 * reject/need-info dialogs; the parent decides where to go afterwards.
 */
export function OrderApprovalActions({
  orderId,
  orderCode,
  t,
  onApproved,
  onDecisionDone,
  showApprove = true,
}: {
  orderId: string
  orderCode: string
  t: OrderReviewMessages
  onApproved: (result: ApproveResult) => void
  onDecisionDone: () => void
  showApprove?: boolean
}) {
  const [modal, setModal] = useState<ModalKind>(null)
  return (
    <>
      <div className="odm-or-actionbar">
        <div className="odm-or-actionbar-hint">
          <span className="odm-or-actionbar-hint-icon">
            <OrderIcon name="info" size={18} />
          </span>
          <span>{t.actionHintNext}</span>
        </div>
        <div className="odm-or-actionbar-actions">
          <Button
            type="button"
            onClick={() => setModal('info')}
          >
            <OrderIcon name="alert" size={16} />
            {t.requestInfo}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => setModal('reject')}
          >
            <OrderIcon name="x" size={16} />
            {t.reject}
          </Button>
          {showApprove ? (
            <ApproveButton orderId={orderId} t={t} onApproved={onApproved} />
          ) : null}
        </div>
      </div>

      {modal ? (
        <DecisionModal
          kind={modal}
          orderCode={orderCode}
          orderId={orderId}
          onClose={() => setModal(null)}
          onDone={onDecisionDone}
          t={t}
        />
      ) : null}
    </>
  )
}
