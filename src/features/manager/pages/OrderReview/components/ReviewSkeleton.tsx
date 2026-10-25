import type { PageMessages } from '../reviewTypes'
import { ReviewBreadcrumbHeader } from './ReviewBreadcrumbHeader'

export function ReviewSkeleton({
  orderId,
  t,
}: {
  orderId: string
  t: PageMessages
}) {
  return (
    <div className="odm-or" aria-busy="true" aria-live="polite">
      <ReviewBreadcrumbHeader orderId={orderId} t={t} />
      <span className="odm-sk" style={{ width: '100%', height: 68 }} />
      <div className="odm-or-grid">
        <div className="odm-or-col">
          <span className="odm-sk" style={{ width: '100%', height: 400 }} />
          <span className="odm-sk" style={{ width: '100%', height: 220 }} />
        </div>
        <div className="odm-or-col">
          <span className="odm-sk" style={{ width: '100%', height: 170 }} />
          <span className="odm-sk" style={{ width: '100%', height: 150 }} />
          <span className="odm-sk" style={{ width: '100%', height: 150 }} />
        </div>
      </div>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
