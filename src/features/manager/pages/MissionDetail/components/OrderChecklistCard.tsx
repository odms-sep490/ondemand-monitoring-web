import type { OrderDetail } from '../../../types/orders'
import type { OrderReviewMessages } from '../../OrderReview/OrderReviewPage.messages'
import { OrderIcon } from '../../../components/common/OrderIcon'
import './OrderChecklistCard.css'
import { ChecklistGuidance } from '../../../../../shared/components/ChecklistGuidance'

export function OrderChecklistCard({
  order,
  t,
}: {
  order: OrderDetail
  t: OrderReviewMessages
}) {
  const items = [...(order.checklistItems ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
  )
  return (
    <section className="odm-or-card" aria-label={t.monitoringRequirements}>
      <header className="odm-or-card-head">
        <h2 className="odm-or-card-title odm-or-checklist-title">
          <OrderIcon name="doc" size={18} />
          {t.monitoringRequirements}
        </h2>
      </header>
      <div className="odm-or-card-body">
        <p className="odm-or-empty odm-or-checklist-hint">
          {t.requirementsHistory}
        </p>
        {items.length ? (
          <ol className="odm-or-checklist-list">
            {items.map((item) => (
              <li key={item.id}>
                <p className="odm-or-checklist-content">{item.content}</p>
                <ChecklistGuidance guidance={item} />
                <span className="odm-or-checklist-source">
                  {item.sourceType === 'CUSTOMER_CUSTOM'
                    ? t.customerRequirement
                    : t.serviceRequirement}
                </span>
                {(item.minimumEvidenceCount !== undefined ||
                  item.requiredEvidenceType !== undefined) && (
                  <span className="odm-or-checklist-evidence">
                    {item.requiredEvidenceType === 'IMAGE_AND_VIDEO'
                      ? t.imageAndVideoRequirement(
                          item.minimumImageCount ?? 0,
                          item.minimumVideoCount ?? 0,
                        )
                      : t.evidenceRequirement(
                          item.minimumEvidenceCount ?? 1,
                          item.requiredEvidenceType === 'IMAGE'
                            ? t.image
                            : item.requiredEvidenceType === 'VIDEO'
                              ? t.video
                              : t.imageOrVideo,
                        )}
                  </span>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="odm-or-empty">
            {order.checklistSnapshotAt
              ? t.requirementsEmpty
              : t.requirementsLegacy}
          </p>
        )}
      </div>
    </section>
  )
}
