import { Skeleton } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { PageHeader } from '../../../components/common/PageHeader'
import { managerHref } from '../../../routes'
import '../../../components/layout/mgrLayout.css'
import type { PageMessages } from '../reviewTypes'

export function ReviewSkeleton({
  orderId,
  t,
}: {
  orderId: string
  t: PageMessages
}) {
  return (
    <div className="odm-or mgr-view mgr-or" aria-busy="true" aria-live="polite">
      <PageHeader
        crumb={<a href={managerHref({ screen: 'orderQueue' })}>{t.breadcrumb}</a>}
        title={t.pageTitle}
        description={orderId}
      />
      <CardComponent>
        <Skeleton active paragraph={{ rows: 1 }} />
      </CardComponent>
      <div className="mgr-detail-grid">
        <div className="mgr-detail-main">
          <CardComponent>
            <Skeleton active paragraph={{ rows: 6 }} />
          </CardComponent>
        </div>
        <div className="mgr-detail-side">
          <CardComponent>
            <Skeleton active paragraph={{ rows: 3 }} />
          </CardComponent>
          <CardComponent>
            <Skeleton active paragraph={{ rows: 2 }} />
          </CardComponent>
        </div>
      </div>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
