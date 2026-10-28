import type { OrderDispatchContext, DispatchStep } from './liveDispatchTypes'
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

export function LiveDispatchContent({
  missionId,
  orderContext,
}: {
  missionId: string
  orderContext?: OrderDispatchContext
}) {
  const { t } = useI18n(liveDispatchPageMessages)
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
      <div className="odm-mgr-dash" role="status">
        {activeStep === 'device' ? t.checkingDevices : t.checkingStaff}
      </div>
    )
  }
  if (mission.error || availability.error || !mission.data || !resourcesReady) {
    return (
      <StateView
        state="error"
        title={t.loadError}
        error={
          new Error(
            !validWindow
              ? t.scheduleRequired
              : 'Không thể tải nguồn lực của nhiệm vụ này. Vui lòng thử lại.',
          )
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
      !['RESOURCE_ASSIGNING', 'READY'].includes(
        current.status,
      ))
  )
    return (
      <section className="odm-or-card odm-or-card-body">
        <p role="alert">
          Nhiệm vụ không còn đủ điều kiện phân công trong Order này. Vui lòng
          chọn lại nhiệm vụ.
        </p>
        <button
          className="odm-or-btn-outline"
          onClick={() => orderContext.onReturn()}
        >
          {orderContext.missionScoped
            ? orderContext.returnLabel
            : 'Chọn nhiệm vụ khác'}
        </button>
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
    <div className="odm-or">
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
        </>
      )}
    </div>
  )
}
