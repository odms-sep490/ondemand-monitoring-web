import { Button } from 'antd'
import { useEffect } from 'react'

import { CardComponent } from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { customerMissionReportApi } from '../../api/customerMissionReportApi'
import type { CustomerMissionSummary } from '../../api/customerMissionReportApi'
import { CardTitle } from '../../pages/OrderDetail/components/CardTitle'
import { CustomerMissionCard } from './CustomerMissionCard'
import { customerReportMessages } from './messages'
import './reports.css'

export function CustomerOrderMissionsSection({ orderId, onMissionsChange }: { orderId: string; onMissionsChange?: (missions: CustomerMissionSummary[]) => void }) {
  const { t } = useI18n(customerReportMessages)
  const query = useApiQuery(
    (signal) => customerMissionReportApi.list(orderId, signal),
    [orderId],
  )
  useEffect(() => {
    if (query.data) onMissionsChange?.(query.data)
  }, [onMissionsChange, query.data])
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
        <p role="status" className="cr-note">
          {t.loading}
        </p>
      )}
      {query.error ? (
        <p role="alert" className="cr-error">
          {t.error}
        </p>
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
                  {query.data.filter((m) => m.status === 'COMPLETED').length}
                </dd>
              </div>
              <div className="cr-metric">
                <dt>{t.published}</dt>
                <dd>{query.data.filter((m) => m.reportAvailable).length}</dd>
              </div>
            </dl>
            <p className="cr-note">{t.progressNote}</p>
              </>
            )}
            {query.data.length === 0 ? (
              <div className="cr-empty">
                <strong>{t.empty}</strong>
                <p className="cr-note">{t.emptyHint}</p>
              </div>
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
