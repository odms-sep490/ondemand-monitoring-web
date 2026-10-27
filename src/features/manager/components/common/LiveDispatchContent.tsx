import type { OrderDispatchContext, DispatchStep } from './liveDispatchTypes'
import { commonMiscMessages } from './commonMisc.messages'
import { useI18n } from '../../../../shared/i18n'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { useState, useRef } from 'react'
import type { MissionStaffRole } from '../../../mission/types/mission'
import { StateView } from '../../../../shared/components/odm/StateView'
import { OrderWorkflowStepper } from './OrderWorkflowStepper'
import { DispatchWizardTabs } from './DispatchWizardTabs'
import { useDispatchResources } from './useDispatchResources'
import { useDispatchStaffSync } from './useDispatchStaffSync'
import { useDispatchAssign } from './useDispatchAssign'
import { deriveDispatchView } from './deriveDispatchView'
import { DispatchPageHead } from './DispatchPageHead'
import { DispatchLoadError } from './DispatchLoadError'
import { DispatchOverviewCard } from './DispatchOverviewCard'
import { DispatchScheduleCard } from './DispatchScheduleCard'
import { DispatchStaffStep } from './DispatchStaffStep'
import { DispatchDeviceStep } from './DispatchDeviceStep'
import { DispatchReviewStep } from './DispatchReviewStep'
import { DispatchActionBar } from './DispatchActionBar'
import { DispatchSideSummary } from './DispatchSideSummary'
import '../layout/mgrLayout.css'
import './missionPages.css'
import '../../pages/MissionDispatch/missionDispatch.scss'
import { Button, Skeleton } from '../../../../shared/components/ui'

export function LiveDispatchContent({
  missionId,
  orderContext,
}: {
  missionId: string
  orderContext?: OrderDispatchContext
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  const { t: m } = useI18n(commonMiscMessages)
  const {
    mission,
    scope,
    validWindow,
    availability,
    resourcesReady,
    drones,
    operators,
  } = useDispatchResources({ missionId, orderContext })
  const [droneIds, setDroneIds] = useState<string[]>(
    orderContext?.initialDevices ?? [],
  )
  const [staffByRole, setStaffByRole] = useState<
    Partial<Record<MissionStaffRole, string[]>>
  >(orderContext?.initialStaff ?? {})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<DispatchStep>(
    orderContext?.initialStep ?? 'staff',
  )
  const [openStaffRole, setOpenStaffRole] = useState<MissionStaffRole | null>(
    null,
  )
  const [devicePickerOpen, setDevicePickerOpen] = useState(false)
  const conflictStep = useRef<'staff' | 'device' | null>(null)
  useDispatchStaffSync({
    resourcesReady,
    availability,
    droneIds,
    staffByRole,
    setDroneIds,
    setStaffByRole,
    conflictStep,
    setActiveStep,
    setOpenStaffRole,
    setDevicePickerOpen,
    setError,
  })

  const { selectedStaffIds, hasAllRoles, assign } = useDispatchAssign({
    staffByRole,
    orderContext,
    droneIds,
    busy,
    activeStep,
    resourcesReady,
    mission,
    missionId,
    setError,
    setBusy,
    availability,
    conflictStep,
    setActiveStep,
  })

  if (
    mission.loading ||
    availability.loading ||
    (validWindow && !availability.error && availability.data?.scope !== scope)
  ) {
    return (
      <div className="mgr-page" role="status" aria-busy="true">
        <span>
          {activeStep === 'device' ? t.checkingDevices : t.checkingStaff}
        </span>
        <Skeleton variant="block" height={220} />
      </div>
    )
  }
  if (mission.error || availability.error || !mission.data || !resourcesReady) {
    return (
      <StateView
        state="error"
        title={t.loadError}
        error={
          new Error(!validWindow ? t.scheduleRequired : m.resourcesLoadFailed)
        }
        onRetry={() => {
          mission.reload()
          availability.reload()
        }}
      />
    )
  }

  const current = mission.data
  if (
    orderContext &&
    (current.id !== missionId ||
      current.orderId !== orderContext.orderId ||
      !['RESOURCE_ASSIGNING', 'WAITING_CREW_CONFIRMATION'].includes(
        current.status,
      ))
  )
    return (
      <section className="odm-or-card odm-or-card-body">
        <p role="alert">{m.missionNotEligible}</p>
        <Button onClick={() => orderContext.onReturn()}>
          {orderContext.missionScoped
            ? orderContext.returnLabel
            : m.chooseOtherMission}
        </Button>
      </section>
    )
  const {
    currentOrderCode,
    assignable,
    activeStepIndex,
    selectedDrones,
    assignedDeviceText,
    target,
    mapImageUrl,
    imageStyle,
    goNext,
    goPrevious,
    globalStep,
    roleSummary,
    missingRoles,
    missingRoleNames,
    stepHint,
    scheduleText,
  } = deriveDispatchView({
    current,
    orderContext,
    activeStep,
    drones,
    droneIds,
    setActiveStep,
    staffByRole,
    operators,
    t,
  })

  return (
    <div className="odm-or mgr-view mgr-mdp">
      {!orderContext?.embeddedInOrderReview && (
        <DispatchPageHead
          orderContext={orderContext}
          current={current}
          busy={busy}
        />
      )}

      {!assignable ? (
        <>
          <OrderWorkflowStepper currentStep={8} />
          <DispatchLoadError
            current={current}
            scheduleText={scheduleText}
            assignedDeviceText={assignedDeviceText}
          />
        </>
      ) : (
        <>
          {!orderContext?.embeddedInOrderReview && (
            <OrderWorkflowStepper currentStep={globalStep} />
          )}

          <DispatchWizardTabs
            activeStep={activeStep}
            onStep={(step) => setActiveStep(step)}
          />

          <div className="mgr-detail-grid">
            <div className="mgr-detail-main">
              {activeStep === 'order' && (
                <DispatchOverviewCard
                  target={target}
                  currentOrderCode={currentOrderCode}
                  current={current}
                  mapImageUrl={mapImageUrl}
                  imageStyle={imageStyle}
                />
              )}

              {activeStep === 'mission' &&
                orderContext &&
                orderContext.missionSelection}
              {activeStep === 'mission' && !orderContext && (
                <DispatchScheduleCard
                  current={current}
                  scheduleText={scheduleText}
                />
              )}

              {activeStep === 'staff' && (
                <DispatchStaffStep
                  missingRoles={missingRoles}
                  current={current}
                  scheduleText={scheduleText}
                  staffByRole={staffByRole}
                  setStaffByRole={setStaffByRole}
                  setError={setError}
                  operators={operators}
                  openStaffRole={openStaffRole}
                  setOpenStaffRole={setOpenStaffRole}
                  selectedStaffIds={selectedStaffIds}
                />
              )}

              {activeStep === 'device' && (
                <DispatchDeviceStep
                  selectedDrones={selectedDrones}
                  drones={drones}
                  droneIds={droneIds}
                  devicePickerOpen={devicePickerOpen}
                  setDevicePickerOpen={setDevicePickerOpen}
                  setOpenStaffRole={setOpenStaffRole}
                  setDroneIds={setDroneIds}
                  setError={setError}
                />
              )}

              {activeStep === 'confirm' && (
                <DispatchReviewStep
                  current={current}
                  scheduleText={scheduleText}
                  roleSummary={roleSummary}
                  selectedDrones={selectedDrones}
                  missingRoles={missingRoles}
                />
              )}

              {error && (
                <div role="alert" className="odm-or-error">
                  {error}
                </div>
              )}
            </div>
            <aside className="mgr-detail-side">
              <DispatchSideSummary
                current={current}
                scheduleText={scheduleText}
                roleSummary={roleSummary}
                selectedDrones={selectedDrones}
                showSelection={activeStep !== 'confirm'}
              />
              <DispatchActionBar
                stepHint={stepHint}
                activeStep={activeStep}
                missingRoleNames={missingRoleNames}
                activeStepIndex={activeStepIndex}
                goPrevious={goPrevious}
                missingRoles={missingRoles}
                selectedDrones={selectedDrones}
                goNext={goNext}
                busy={busy}
                droneIds={droneIds}
                hasAllRoles={hasAllRoles}
                orderContext={orderContext}
                assign={assign}
              />
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
