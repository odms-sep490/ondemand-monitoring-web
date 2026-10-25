import type { PageMessages } from '../reviewTypes'
import { managerHref } from '../../../routes'

export function ReviewBreadcrumbHeader({
  orderId,
  t,
}: {
  orderId: string
  t: PageMessages
}) {
  return (
    <div className="odm-mgr-review-breadcrumb">
      <a href={managerHref({ screen: 'orderQueue' })}>{t.breadcrumb}</a>
      <span aria-hidden="true">/</span>
      <span>{orderId}</span>
    </div>
  )
}
