import { useEffect, useRef } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../components/common/StateView'
import { PageHeader } from '../../components/common/ui'
import { useI18n } from '../../../../shared/i18n'
import { customerHref } from '../../routes'
import { ConfirmSubmitModal } from './components/ConfirmSubmitModal'
import { CreatedSuccess } from './components/CreatedSuccess'
import { ContentStep } from './components/ContentStep'
import { LocationStep } from './components/LocationStep'
import { ReviewStep } from './components/ReviewStep'
import { ScheduleStep } from './components/ScheduleStep'
import { ServiceStep } from './components/ServiceStep'
import { SiteDetailsStep } from './components/SiteDetailsStep'
import { StepTabs } from './components/StepTabs'
import { WizardFooter } from './components/WizardFooter'
import { createOrderPageMessages } from './CreateOrderPage.messages'
import './CreateOrder.css'
import { useCreateOrderWizard } from './hooks/useCreateOrderWizard'
import { ChecklistEditor } from '../../components/checklist/ChecklistEditor'
import { selectionEstimate } from '../../lib/checklist/selectionEstimate'
import type { Step } from '../../lib/createOrder/types'

/** Customer wizard: service, location, content, site details, schedule, then confirmation. */
export function CreateOrderPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const { t } = useI18n(createOrderPageMessages)
  const {
    f,
    meta,
    wizard,
    submit,
    service,
    time,
    deliverable,
    checklist,
  } = useCreateOrderWizard()
  const { form, step } = f
  const estimate = selectionEstimate(
    meta.pricingEstimate,
    checklist.quote.preview,
  )
  const additionalChecklists = checklist.rows.filter(
    (row) => row.selected && row.packageItem === false,
  )
  const packageChecklists = checklist.rows.filter((row) => row.packageItem === true)
  const packageSelectedCount = packageChecklists.filter((row) => row.selected).length

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (typeof pageRef.current?.scrollIntoView === 'function') {
        pageRef.current.scrollIntoView({ block: 'start', behavior: 'instant' })
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [step])

  if (submit.createdId) {
    return (
      <CreatedSuccess
        orderId={submit.createdId}
        orderCode={submit.createdCode}
      />
    )
  }

  const footer = (
    <WizardFooter
      step={step}
      nextLabel={t.stepLabels[Math.min(6, step + 1) as Step]}
      submitDisabled={meta.loading || submit.submitting || !checklist.valid}
      nextDisabled={step === 3 && !checklist.valid}
      blockedReason={
        (step === 3 || step === 6) && !checklist.valid
          ? t.blockedChecklist
          : step === 6 && meta.loading
            ? t.blockedLoading
            : null
      }
      onBack={wizard.back}
      onNext={wizard.next}
      onSubmit={submit.openConfirm}
    />
  )

  return (
    <div ref={pageRef} className="co-page">
      <PageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        actions={
          <a
            href={customerHref({ screen: 'orders' })}
            className="odm-btn odm-btn-gh"
            onClick={(event) => {
              if (!window.confirm(t.cancelConfirm)) event.preventDefault()
            }}
          >
            {t.cancel}
          </a>
        }
      />
      <StepTabs step={step} reached={wizard.reached} labels={t.stepLabels} onSelect={wizard.goTo} />

      {meta.loading && !meta.services.length && <LoadingState />}
      {Boolean(meta.error) && (
        <ErrorState
          title={t.metaErrorTitle}
          error={meta.error}
          onRetry={meta.reload}
        />
      )}

      {step === 1 && (
        <ServiceStep
          form={form}
          errors={f.errors}
          update={f.update}
          services={meta.services}
          servicesLoading={meta.loading}
          pricingEstimate={estimate}
          pricingLoading={checklist.quote.loading}
          additionalChecklists={additionalChecklists}
          footer={footer}
        />
      )}
      {step === 2 && (
        <LocationStep form={form} errors={f.errors} update={f.update} footer={footer} />
      )}
      {step === 3 && (
        <ContentStep
          selected={meta.services.find((s) => s.id === form.serviceId)}
          selectedCount={checklist.selectedCount}
          packageSelectedCount={packageSelectedCount}
          packageCount={packageChecklists.length}
          additionalChecklists={additionalChecklists}
          valid={checklist.valid}
          pricingEstimate={estimate}
          pricingLoading={checklist.quote.loading}
          aiAnalysisRequested={false}
          checklist={
            <ChecklistEditor
              variant="compact"
              quote
              checklist={checklist}
              disabled={submit.submitting}
              onReload={() => f.setSubmitError(null)}
            />
          }
          footer={footer}
        />
      )}
      {step === 4 && (
        <SiteDetailsStep
          form={form}
          errors={f.errors}
          update={f.update}
          footer={footer}
        />
      )}
      {step === 5 && (
        <ScheduleStep
          form={form}
          errors={f.errors}
          update={f.update}
          preferredTimes={meta.preferredTimes}
          service={service}
          time={time}
          footer={footer}
        />
      )}
      {step === 6 && (
        <ReviewStep
          form={form}
          errors={f.errors}
          update={f.update}
          service={service}
          time={time}
          deliverable={deliverable}
          deliverables={meta.deliverables}
          deliverablesLoading={meta.deliverablesLoading}
          deliverablesError={meta.deliverablesError}
          reloadDeliverables={meta.reloadDeliverables}
          mediaTotals={checklist.mediaTotals}
          pricingEstimate={estimate}
          pricingLoading={checklist.quote.loading}
          additionalChecklists={additionalChecklists}
          packageSelectedCount={packageSelectedCount}
          packageCount={packageChecklists.length}
          onEdit={wizard.goTo}
          footer={footer}
        />
      )}

      {f.submitError && !submit.confirmOpen && (
        <div className="co-notice is-danger" role="alert">
          {f.submitError}
        </div>
      )}

      {submit.confirmOpen && (
        <ConfirmSubmitModal
          form={form}
          service={service}
          pricingEstimate={estimate}
          checklistCount={checklist.selectedCount}
          mediaTotals={checklist.mediaTotals}
          time={time}
          aiAnalysisRequested={false}
          submitting={submit.submitting}
          error={f.submitError}
          onConfirm={() => void submit.submit()}
          onClose={submit.closeConfirm}
        />
      )}
    </div>
  )
}
