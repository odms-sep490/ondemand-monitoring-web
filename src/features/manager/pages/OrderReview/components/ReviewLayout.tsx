import { useState, type ReactNode } from 'react'

import '../../../components/layout/mgrLayout.css'
import { OrderAttachmentsCard } from '../../../components/common/OrderAttachmentsCard'
import { OrderCustomerCard } from '../../../components/common/OrderCustomerCard'
import { useI18n } from '../../../../../shared/i18n'
import type { OrderDetail } from '../../../types/orders'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'
import type { ReviewStep } from '../reviewTypes'
import { OrderSummaryCard } from './OrderSummaryCard'
import { ReviewActionsSlot } from './ReviewActionsSlot'

/**
 * Detail layout of the review stages: stage content on the left, a sticky
 * sidebar on the right (summary, stage actions, customer, attachments).
 * `wide` drops the sidebar content below the stage, used by the quote stage
 * which already has its own checklist | quote split.
 */
export function ReviewLayout({
  order,
  wide = false,
  reviewStep,
  children,
}: {
  order: OrderDetail
  wide?: boolean
  reviewStep?: ReviewStep
  children: ReactNode
}) {
  const { t } = useI18n(orderReviewPageMessages)
  const [slot, setSlot] = useState<HTMLDivElement | null>(null)
  return (
    <ReviewActionsSlot.Provider value={slot}>
      <div
        className={[
          'mgr-detail-grid',
          wide ? 'is-wide' : '',
          reviewStep && reviewStep < 4
            ? `is-review-step-${reviewStep}`
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="mgr-detail-main">
          {children}
          {wide ? null : (
            <div className="mgr-detail-extra">
              <OrderCustomerCard order={order} t={t} />
              <OrderAttachmentsCard order={order} t={t} />
            </div>
          )}
        </div>
        <aside className="mgr-detail-side">
          <OrderSummaryCard order={order} />
          <div ref={setSlot} className="mgr-actions-slot" />
        </aside>
      </div>
    </ReviewActionsSlot.Provider>
  )
}
