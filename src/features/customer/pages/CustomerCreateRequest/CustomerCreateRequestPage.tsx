import {
  ErrorState,
  LoadingState,
} from '../../components/common/StateView'
import { PageHeader } from '../../components/common/ui'
import { CustomerLayout } from '../../CustomerLayout'
import { customerAppMessages } from '../../CustomerApp.messages'
import { useNewMediaCount } from '../../hooks/useNewMediaCount'
import { useI18n } from '../../../../shared/i18n'
import { ConfirmSubmitModal } from '../CreateOrder/components/ConfirmSubmitModal'
import { CreatedSuccess } from '../CreateOrder/components/CreatedSuccess'
import { DeliverablesCard } from '../CreateOrder/components/DeliverablesCard'
import { DeliveryOptionsCard } from '../CreateOrder/components/DeliveryOptionsCard'
import { LocationStep } from '../CreateOrder/components/LocationStep'
import { PricingEstimateCard } from '../CreateOrder/components/PricingEstimateCard'
import { RequestSummaryCard } from '../CreateOrder/components/RequestSummaryCard'
import { ScheduleCard } from '../CreateOrder/components/ScheduleCard'
import { ServicePicker } from '../CreateOrder/components/ServicePicker'
import '../CreateOrder/CreateOrder.css'
import { RequestBasicsCard } from './components/RequestBasicsCard'
import { SubmitBar } from './components/SubmitBar'
import { customerCreateRequestPageMessages } from './CustomerCreateRequestPage.messages'
import { useCreateRequest } from './hooks/useCreateRequest'
import { ChecklistEditor } from '../../components/checklist/ChecklistEditor'
import { selectionEstimate } from '../../lib/checklist/selectionEstimate'

/**
 * Quick single-page variant of the create-order wizard, routed outside the
 * customer shell (`#portal/customer/request`). Posts a BE `OrderCreateRequest`.
 */
export function CustomerCreateRequestPage() {
  const { t } = useI18n(customerCreateRequestPageMessages)
  const { t: appT } = useI18n(customerAppMessages)
  const newMediaCount = useNewMediaCount()
  const r = useCreateRequest()
  const { form, errors, update, meta, submit } = r
  const estimate = selectionEstimate(
    meta.pricingEstimate,
    r.checklist.quote.preview,
  )
  const additionalChecklists = r.checklist.rows.filter(
    (row) => row.selected && row.packageItem === false,
  )
  const packageChecklists = r.checklist.rows.filter((row) => row.packageItem === true)
  const packageSelectedCount = packageChecklists.filter((row) => row.selected).length

  return (
    <CustomerLayout
      route={{ screen: 'createOrder' }}
      breadcrumb={appT.breadcrumb.createOrder}
      newMediaCount={newMediaCount}
    >
      {submit.createdId ? (
        <CreatedSuccess
          orderId={submit.createdId}
          orderCode={submit.createdCode}
        />
      ) : (
        <div className="cus-page co-page">
          <PageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />
          {meta.loading && !meta.services.length && <LoadingState />}
          {Boolean(meta.error) && (
            <ErrorState
              title={t.metaErrorTitle}
              error={meta.error}
              onRetry={meta.reload}
            />
          )}

          <LocationStep form={form} errors={errors} update={update} />
          <div className="co-grid">
            <div className="co-stack">
              <RequestBasicsCard form={form} errors={errors} update={update} />
              <ServicePicker
                services={meta.services}
                loading={meta.loading}
                selectedId={form.serviceId}
                error={errors.serviceId}
                onSelect={(id) => update('serviceId', id)}
              />
              <ChecklistEditor
                quote
                checklist={r.checklist}
                disabled={submit.submitting}
                onReload={r.clearSubmitError}
              />
            </div>
            <div className="co-stack">
              <ScheduleCard
                form={form}
                errors={errors}
                update={update}
                preferredTimes={meta.preferredTimes}
              />
              <DeliverablesCard
                deliverables={meta.deliverables}
                loading={meta.deliverablesLoading}
                error={meta.deliverablesError}
                onRetry={meta.reloadDeliverables}
                mediaTotals={r.checklist.mediaTotals}
              />
              <DeliveryOptionsCard
                mediaTotals={r.checklist.mediaTotals}
                form={form}
                errors={errors}
                update={update}
              />
            </div>
          </div>
          <div className="co-grid">
            <RequestSummaryCard
              mediaTotals={r.checklist.mediaTotals}
              form={form}
              service={r.service}
              time={r.time}
              deliverable={r.deliverable}
              checklistCounts={{
                total: packageSelectedCount + additionalChecklists.length,
                packageSelected: packageSelectedCount,
                packageTotal: packageChecklists.length,
                additional: additionalChecklists.length,
              }}
            />
            <PricingEstimateCard
              estimate={estimate}
              loading={r.checklist.quote.loading}
              hasService={Boolean(r.service)}
              additionalChecklists={additionalChecklists}
            />
          </div>

          <SubmitBar
            error={submit.confirmOpen ? null : r.submitError}
            disabled={
              meta.loading ||
              submit.submitting ||
              (Boolean(form.serviceId) && !r.checklist.valid)
            }
            onSubmit={submit.openConfirm}
          />
          {submit.confirmOpen && (
            <ConfirmSubmitModal
              form={form}
              service={r.service}
              pricingEstimate={estimate}
              checklistCount={r.checklist.selectedCount}
              mediaTotals={r.checklist.mediaTotals}
              time={r.time}
              submitting={submit.submitting}
              error={r.submitError}
              onConfirm={() => void submit.submit()}
              onClose={submit.closeConfirm}
            />
          )}
        </div>
      )}
    </CustomerLayout>
  )
}
