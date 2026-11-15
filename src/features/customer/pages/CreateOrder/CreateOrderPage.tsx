import { Button } from 'antd'
import { BorderOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'

import { ErrorState, LoadingState } from '../../components/common/StateView'
import { Modal, PageHeader } from '../../components/common/ui'
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
import './CreateOrder.refinement.css'
import { useCreateOrderWizard } from './hooks/useCreateOrderWizard'
import { ChecklistEditor } from '../../components/checklist/ChecklistEditor'
import { selectionEstimate } from '../../lib/checklist/selectionEstimate'
import {
  coverageAreaMetrics,
  formatAreaM2,
  isValidCoverageArea,
} from '../../lib/createOrder/coverageGeometry'
import type { Step } from '../../lib/createOrder/types'

/** Customer wizard: service, location, content, site details, schedule, then confirmation. */
export function CreateOrderPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const confirmTriggerRef = useRef<HTMLElement | null>(null)
  const leaveTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const { t } = useI18n(createOrderPageMessages)
  const { f, meta, wizard, submit, service, time, checklist } =
    useCreateOrderWizard()
  const { form, step } = f
  const estimate = selectionEstimate(
    meta.pricingEstimate,
    checklist.quote.preview,
  )
  const additionalChecklists = checklist.rows.filter(
    (row) => row.selected && row.packageItem === false,
  )
  const packageChecklists = checklist.rows.filter(
    (row) => row.packageItem === true,
  )
  const packageSelectedCount = packageChecklists.filter(
    (row) => row.selected,
  ).length
  const areaMetrics = isValidCoverageArea(form.coverageArea)
    ? coverageAreaMetrics(form.coverageArea)
    : null
  const areaLocationSummary =
    form.locationStatus === 'confirmed' && form.locationConfirmedAt
      ? form.normalizedAddress.trim() ||
        `${Number(form.latitude).toFixed(6)}, ${Number(form.longitude).toFixed(6)}`
      : ''
  const stepTwoSummary = step === 2 && (
    <div className="co-area-footer-summary" aria-label={t.areaSummaryLabel}>
      {areaLocationSummary && (
        <span className="co-area-footer-chip">
          <EnvironmentOutlined aria-hidden="true" />
          <span>{areaLocationSummary}</span>
        </span>
      )}
      {areaMetrics && (
        <span className="co-area-footer-chip">
          <BorderOutlined aria-hidden="true" />
          <span>
            {t.areaSummaryValue} {formatAreaM2(areaMetrics.areaM2)}
          </span>
        </span>
      )}
    </div>
  )

  function openSubmitConfirmation() {
    const activeElement = document.activeElement
    confirmTriggerRef.current =
      activeElement instanceof HTMLElement ? activeElement : null
    submit.openConfirm()
  }

  function closeSubmitConfirmation() {
    if (submit.submitting) return
    submit.closeConfirm()
    window.requestAnimationFrame(() => {
      const trigger = confirmTriggerRef.current
      if (trigger?.isConnected && !trigger.matches(':disabled')) trigger.focus()
    })
  }

  function openLeaveConfirmation() {
    const activeElement = document.activeElement
    leaveTriggerRef.current =
      activeElement instanceof HTMLButtonElement ? activeElement : null
    setLeaveConfirmOpen(true)
  }

  function closeLeaveConfirmation() {
    setLeaveConfirmOpen(false)
    window.requestAnimationFrame(() => {
      const trigger = leaveTriggerRef.current
      if (trigger?.isConnected && !trigger.disabled) trigger.focus()
    })
  }

  function leaveCreateOrder() {
    window.location.hash = customerHref({ screen: 'orders' })
  }

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
    <nav className="co-action-dock" aria-label={t.navigationLabel}>
      <WizardFooter
        step={step}
        nextLabel={t.stepLabels[Math.min(6, step + 1) as Step]}
        submitDisabled={meta.loading || submit.submitting || !checklist.valid}
        submitting={submit.submitting}
        nextDisabled={step === 3 && !checklist.valid}
        blockedReason={
          (step === 3 || step === 6) && !checklist.valid
            ? t.blockedChecklist
            : step === 6 && meta.loading
              ? t.blockedLoading
              : null
        }
        summary={stepTwoSummary}
        onBack={wizard.back}
        onNext={wizard.next}
        onSubmit={openSubmitConfirmation}
      />
    </nav>
  )

  return (
    <div
      ref={pageRef}
      className={`cus-page co-page${step === 6 ? ' is-review-step' : ''}`}
    >
      <div className="co-create-hero">
        <PageHeader
          title={step === 6 ? t.reviewTitle : t.pageTitle}
          subtitle={step === 6 ? t.reviewSubtitle : t.pageSubtitle}
          actions={
            <Button
              disabled={submit.submitting}
              onClick={openLeaveConfirmation}
            >
              {t.cancel}
            </Button>
          }
        />
      </div>
      <StepTabs
        step={step}
        reached={wizard.reached}
        labels={t.stepLabels}
        onSelect={wizard.goTo}
      />

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
        />
      )}
      {step === 2 && (
        <LocationStep form={form} errors={f.errors} update={f.update} />
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
          checklist={
            <ChecklistEditor
              variant="compact"
              quote
              checklist={checklist}
              disabled={submit.submitting}
              onReload={() => f.setSubmitError(null)}
            />
          }
        />
      )}
      {step === 4 && (
        <SiteDetailsStep form={form} errors={f.errors} update={f.update} />
      )}
      {step === 5 && (
        <ScheduleStep
          form={form}
          errors={f.errors}
          update={f.update}
          preferredTimes={meta.preferredTimes}
          service={service}
          time={time}
        />
      )}
      {step === 6 && (
        <ReviewStep
          form={form}
          errors={f.errors}
          update={f.update}
          service={service}
          time={time}
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
        />
      )}

      {f.submitError && !submit.confirmOpen && (
        <div className="co-notice is-danger" role="alert">
          {f.submitError}
        </div>
      )}

      {footer}

      {submit.confirmOpen && (
        <ConfirmSubmitModal
          form={form}
          service={service}
          pricingEstimate={estimate}
          checklistCount={checklist.selectedCount}
          mediaTotals={checklist.mediaTotals}
          time={time}
          submitting={submit.submitting}
          error={f.submitError}
          onConfirm={() => void submit.submit()}
          onClose={closeSubmitConfirmation}
        />
      )}

      {leaveConfirmOpen && (
        <Modal
          title={t.leaveConfirmTitle}
          subtitle={t.leaveConfirmSubtitle}
          width={440}
          onClose={closeLeaveConfirmation}
          footer={
            <>
              <Button onClick={closeLeaveConfirmation}>
                {t.stayOnRequest}
              </Button>
              <Button type="primary" onClick={leaveCreateOrder}>
                {t.leaveRequest}
              </Button>
            </>
          }
        >
          <p className="co-notice is-info" role="note">
            {t.leaveConfirmBody}
          </p>
        </Modal>
      )}
    </div>
  )
}
