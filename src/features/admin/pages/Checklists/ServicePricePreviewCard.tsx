import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { Skeleton } from 'antd'

import { CardComponent } from '../../../../shared/components/antd'
import { ServicePriceSummary } from './ServicePriceSummary'
import { checklistPricingApi } from '../../../../shared/api/checklistPricingApi'
import { checklistMessages } from './checklists.messages'
import { ChecklistLoadError } from './ChecklistUi'

/**
 * Default price of a service, computed by the backend from its default checklists and the active pricing policy.
 * `refreshKey` changes whenever the checklist set or an override is saved, so the figure never goes stale.
 */
export function ServicePricePreviewCard({
  serviceId,
  refreshKey,
}: {
  serviceId: string
  refreshKey: unknown
}) {
  const { t } = useI18n(checklistMessages)
  const query = useApiQuery(
    (signal) => checklistPricingApi.defaultPrice(serviceId, signal),
    [serviceId, refreshKey],
  )
  return (
    <CardComponent styles={{ body: { padding: 0 } }}>
      <div className="checklist-section-head">
        <div>
          <h2>{t.previewTitle}</h2>
          <p>{t.previewHint}</p>
        </div>
      </div>
      <div className="checklist-preview-card adm-card-pad">
        {query.loading && <Skeleton active aria-busy="true" />}
        {query.error !== undefined && (
          <ChecklistLoadError
            title={t.previewError}
            error={query.error}
            retry={query.reload}
          />
        )}
        {!query.loading && query.error === undefined && query.data && (
          <ServicePriceSummary preview={query.data} />
        )}
      </div>
    </CardComponent>
  )
}
