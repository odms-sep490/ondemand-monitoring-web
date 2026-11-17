import { useEffect, useState } from 'react'
import { Alert, Skeleton } from 'antd'

import { ChecklistGuidance } from '../../../../shared/components/ChecklistGuidance'
import { Button } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { financeApi } from '../../../finance/api'
import type { PricingChecklistItem } from '../../../finance/types'
import type { OrderDetail, OrderChecklistSnapshot } from '../../types/orders'
import { OrderIcon } from './OrderIcon'
import { StatusTag } from './StatusTag'
import { orderChecklistDetailsCardMessages } from './OrderChecklistDetailsCard.messages'
import { orderReviewPageMessages } from '../../pages/OrderReview/OrderReviewPage.messages'

const statusTone = {
  PENDING: 'warning',
  INCLUDED: 'success',
  ADDITIONAL: 'info',
  DUPLICATE: 'neutral',
  REJECTED: 'danger',
} as const

export function OrderChecklistDetailsCard({
  order,
  open,
}: {
  order: OrderDetail
  open: boolean
}) {
  const { t } = useI18n(orderReviewPageMessages)
  const { t: m } = useI18n(orderChecklistDetailsCardMessages)
  const [reviewItems, setReviewItems] = useState<PricingChecklistItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [retryVersion, setRetryVersion] = useState(0)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setReviewItems(null)
    setLoading(true)
    setLoadFailed(false)
    financeApi
      .getPricingReview(order.id, controller.signal)
      .then((review) => setReviewItems(review.checklistItems))
      .catch(() => {
        if (!controller.signal.aborted) setLoadFailed(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [open, order.id, retryVersion])

  const fallbackItems = order.checklistItems ?? []
  const items: Array<PricingChecklistItem | OrderChecklistSnapshot> = [
    ...(reviewItems ?? fallbackItems),
  ].sort((left, right) => left.displayOrder - right.displayOrder || left.id.localeCompare(right.id))

  return (
    <section className="odm-or-card mgr-order-checklist-details">
      <header className="odm-or-card-head">
        <h2 className="odm-or-card-title">
          <OrderIcon name="doc" size={18} />
          {m.title}
          <span className="mgr-order-checklist-count">{items.length}</span>
        </h2>
      </header>
      <div className="odm-or-card-body">
        {loadFailed ? (
          <Alert
            type="warning"
            showIcon
            message={m.loadingError}
            action={
              <Button size="sm" onClick={() => setRetryVersion((value) => value + 1)}>
                {m.retry}
              </Button>
            }
          />
        ) : null}
        {items.length > 0 ? (
          <ol className="mgr-order-checklist-list">
            {items.map((item, index) => {
              const managerItem = 'managerNote' in item ? item : null
              const status = managerItem?.reviewStatus
              const requestedImages = managerItem?.requestedImageCount ?? 0
              const requestedVideos = managerItem?.requestedVideoCount ?? 0
              const hasRequestedMedia = requestedImages + requestedVideos > 0
              return (
                <li key={item.id} className="mgr-order-checklist-item">
                  <div className="mgr-order-checklist-item-head">
                    <span className="mgr-order-checklist-index">{String(index + 1).padStart(2, '0')}</span>
                    <div className="mgr-order-checklist-identity">
                      <strong>{item.content}</strong>
                      <div className="mgr-order-checklist-meta">
                        <span>
                          {item.sourceType === 'SERVICE_TEMPLATE'
                            ? t.serviceRequirement
                            : t.customerRequirement}
                        </span>
                        {status ? (
                          <StatusTag tone={statusTone[status]}>
                            {m.status[status]}
                          </StatusTag>
                        ) : null}
                        {hasRequestedMedia ? (
                          <span>{m.imageVideo(requestedImages, requestedVideos)}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <ChecklistGuidance guidance={item} />
                  {managerItem?.managerNote?.trim() ? (
                    <div className="mgr-order-checklist-note">
                      <strong>{m.itemNote}</strong>
                      <p>{managerItem.managerNote}</p>
                    </div>
                  ) : null}
                  {managerItem?.managerPriceAdjustmentReason?.trim() ? (
                    <div className="mgr-order-checklist-note is-pricing">
                      <strong>{m.pricingReason}</strong>
                      <p>{managerItem.managerPriceAdjustmentReason}</p>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ol>
        ) : loading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : (
          <p className="odm-or-empty">
            {order.checklistSnapshotAt ? t.requirementsEmpty : t.requirementsLegacy}
          </p>
        )}
      </div>
    </section>
  )
}
