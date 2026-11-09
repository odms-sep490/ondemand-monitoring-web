import { Alert, Button, Skeleton } from 'antd'

import { CardComponent, EmptyState } from '../../../../shared/components/antd'
import {
  useApiQuery,
  type UseApiQueryState,
} from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { customerMissionReportApi } from '../../api/customerMissionReportApi'
import type { CustomerMissionSummary } from '../../api/customerMissionReportApi'
import { CardTitle } from '../../pages/OrderDetail/components/CardTitle'
import { CustomerMissionCard } from './CustomerMissionCard'
import { customerReportMessages } from './messages'
import './reports.css'

type MissionListQuery = UseApiQueryState<CustomerMissionSummary[]>

export function CustomerOrderMissionsSection({ orderId }: { orderId: string }) {
  const query = useApiQuery(
    (signal) => customerMissionReportApi.list(orderId, signal),
    [orderId],
  )
  return <CustomerOrderMissionsView query={query} />
}

export function CustomerOrderMissionsView({
  query,
}: {
  query: MissionListQuery
}) {
  const { t } = useI18n(customerReportMessages)
  return (
    <CardComponent
      className="cr-section"
      role="region"
      aria-label={t.title}
      title={<CardTitle icon="drone">{t.title}</CardTitle>}
      extra={
        Boolean(query.error) && (
          <Button size="small" disabled={query.loading} onClick={query.reload}>
            {t.retry}
          </Button>
        )
      }
    >
      {query.loading && (
        <div role="status" aria-busy="true">
          <Skeleton active paragraph={{ rows: 2 }} title={false} />
          <span className="odm-visually-hidden">{t.loading}</span>
        </div>
      )}
      {query.error ? (
        <Alert type="error" showIcon message={t.error} />
      ) : (
        query.data && (
          <>
            {query.data.length > 0 && (
              <>
                <dl className="cr-metrics">
                  <div className="cr-metric">
                    <dt>{t.total}</dt>
                    <dd>{query.data.length}</dd>
                  </div>
                  <div className="cr-metric">
                    <dt>{t.finished}</dt>
                    <dd>
                      {
                        query.data.filter((m) => m.status === 'COMPLETED')
                          .length
                      }
                    </dd>
                  </div>
                  <div className="cr-metric">
                    <dt>{t.published}</dt>
                    <dd>
                      {query.data.filter((m) => m.reportAvailable).length}
                    </dd>
                  </div>
                </dl>
                <p className="cr-note">{t.progressNote}</p>
              </>
            )}
            {query.data.length === 0 ? (
              <EmptyState title={t.empty} description={t.emptyHint} />
            ) : (
              <div className="cr-missions">
                {query.data.map((m) => (
                  <CustomerMissionCard
                    key={m.missionId}
                    mission={m}
                    siblings={query.data}
                  />
                ))}
              </div>
            )}
          </>
        )
      )}
    </CardComponent>
  )
}
