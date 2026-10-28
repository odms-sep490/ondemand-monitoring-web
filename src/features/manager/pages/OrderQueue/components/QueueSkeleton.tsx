import { Skeleton } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { PageHeader } from '../../../components/common/PageHeader'
import { orderQueuePageMessages } from '../OrderQueuePage.messages'

export function QueueSkeleton() {
  const { t } = useI18n(orderQueuePageMessages)
  return (
    <div className="mgr-view" aria-busy="true" aria-live="polite">
      <PageHeader title={t.title} />
      <div className="mgr-kpi-strip">
        {Array.from({ length: 4 }, (_, i) => (
          <CardComponent key={i}>
            <Skeleton active paragraph={{ rows: 1 }} />
          </CardComponent>
        ))}
      </div>
      <CardComponent>
        <Skeleton active paragraph={{ rows: 5 }} />
      </CardComponent>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
