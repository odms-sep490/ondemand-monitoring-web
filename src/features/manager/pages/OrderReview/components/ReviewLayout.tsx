import { useState, type ReactNode } from 'react'

import '../../../components/layout/mgrLayout.css'
import { OrderAttachmentsCard } from '../../../components/common/OrderAttachmentsCard'
import { OrderCustomerCard } from '../../../components/common/OrderCustomerCard'
import { useI18n } from '../../../../../shared/i18n'
import type { OrderDetail } from '../../../types/orders'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'
import type { ReviewStep } from '../reviewTypes'
import { ReviewActionsSlot } from './ReviewActionsSlot'

/**
 * Detail layout of the review stages. Intake keeps customer information and
 * actions in a sidebar; later stages use the full workspace with actions below.
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
  const actionTarget = <div ref={setSlot} className="mgr-actions-slot" />
  const showCustomerInSidebar = !wide && reviewStep === 1
  const showCustomerInMain =
    !wide && !showCustomerInSidebar && reviewStep !== 2 && reviewStep !== 3
  const hasAttachments = Boolean(order.attachments?.length)
  const showExtraInMain =
    showCustomerInMain || (hasAttachments && !showCustomerInSidebar)
  const sidebar = (
    <aside className="mgr-detail-side">
      {showCustomerInSidebar ? (
        <OrderCustomerCard order={order} t={t} hideEmpty />
      ) : null}
      {!wide ? actionTarget : null}
    </aside>
  )
  const main = (
    <div className="mgr-detail-main">
      {children}
      {wide ? actionTarget : null}
      {showCustomerInSidebar && hasAttachments ? (
        <OrderAttachmentsCard order={order} t={t} />
      ) : null}
      {showExtraInMain ? (
        <div
          className={`mgr-detail-extra${
            showCustomerInMain && hasAttachments ? '' : ' is-single'
          }`}
        >
          {showCustomerInMain ? (
            <OrderCustomerCard order={order} t={t} hideEmpty />
          ) : null}
          {hasAttachments ? <OrderAttachmentsCard order={order} t={t} /> : null}
        </div>
      ) : null}
    </div>
  )
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
        {wide ? (
          main
        ) : (
          <>
            {main}
            {sidebar}
          </>
        )}
      </div>
    </ReviewActionsSlot.Provider>
  )
}
