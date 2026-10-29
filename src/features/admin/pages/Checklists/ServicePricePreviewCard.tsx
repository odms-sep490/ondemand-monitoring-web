import { CardComponent } from '../../../../shared/components/antd'
import { checklistPricingApi } from '../../../../shared/api/checklistPricingApi'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { AdminLoading } from '../../components/common/AdminLoading'
import { ServicePriceSummary } from './ServicePriceSummary'
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
    <CardComponent
      title={
        <div className="checklist-card-title">
          <h2 className="mgr-card-title">{t.previewTitle}</h2>
          <p className="mgr-cell-sub">{t.previewHint}</p>
        </div>
      }
    >
      {query.loading && <AdminLoading />}
      {query.error !== undefined && (
        <ChecklistLoadError title={t.previewError} error={query.error} retry={query.reload} />
      )}
      {!query.loading && query.error === undefined && query.data && (
        <ServicePriceSummary preview={query.data} />
      )}
    </CardComponent>
  )
}
