import type { OrderDetail } from '../../types/orders'
import type { OrderReviewMessages } from '../../pages/OrderReview/OrderReviewPage.messages'
import { OrderIcon } from './OrderIcon'
import { Button } from '../../../../shared/components/ui'

export function OrderAttachmentsCard({
  order,
  t,
}: {
  order: OrderDetail
  t: OrderReviewMessages
}) {
  const attachments = order.attachments
  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="file" size={18} />
          {t.attachments}
        </span>
      </header>
      {attachments == null ? (
        <div className="odm-or-card-body odm-or-empty">
          {t.noAttachmentsData}
        </div>
      ) : attachments.length === 0 ? (
        <div className="odm-or-card-body odm-or-empty">{t.noAttachments}</div>
      ) : (
        <div className="odm-or-card-body odm-or-attachments">
          {attachments.map((att) => (
            <div key={att.url} className="odm-or-attachment">
              <OrderIcon name="file" size={18} />
              <div className="odm-or-attachment-main">
                <div className="odm-or-attachment-name">{att.name}</div>
                <div className="odm-or-attachment-meta">
                  {att.sizeLabel} · {att.mimeType}
                </div>
              </div>
              <Button size="sm" href={att.url}>
                {t.download}
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
