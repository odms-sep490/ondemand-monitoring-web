import type { Mission } from '../../../mission/types/mission'
import { missionRoles } from './liveDispatchConstants'
import { useEffect } from 'react'
import { missionApi } from '../../../mission/api/missionApi'
import {
  planningError,
  resourceAssignmentConflict,
} from '../../lib/planningErrors'
import { ApiError } from '../../../../shared/api/httpClient'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { useI18n } from '../../../../shared/i18n'
import { useToast } from '../../../../shared/components/ui'
import { managerFeedbackMessages } from '../../feedback.messages'
import type { MissionStaffRole } from '../../../mission/types/mission'
import type { OrderDispatchContext, DispatchStep } from './liveDispatchTypes'
import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import type { Dispatch, SetStateAction, RefObject } from 'react'
import type { AvailableDrone } from '../../../staff/api/droneApi'
import type { AvailableOperator } from '../../../staff/api/operatorApi'

export function useDispatchAssign({
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
}: {
  staffByRole: Partial<Record<MissionStaffRole, string[]>>
  orderContext: OrderDispatchContext | undefined
  droneIds: string[]
  busy: boolean
  activeStep: DispatchStep
  resourcesReady: boolean
  mission: UseApiQueryState<Mission>
  missionId: string
  setError: Dispatch<SetStateAction<string | null>>
  setBusy: Dispatch<SetStateAction<boolean>>
  availability: UseApiQueryState<{
    scope: string
    devices: AvailableDrone[]
    people: AvailableOperator[]
  } | null>
  conflictStep: RefObject<'staff' | 'device' | null>
  setActiveStep: Dispatch<SetStateAction<DispatchStep>>
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  const { t: fb } = useI18n(managerFeedbackMessages)
  const toast = useToast()
  const selectedStaffIds = missionRoles.flatMap(
    (role) => staffByRole[role] ?? [],
  )
  const hasAllRoles = missionRoles.every(
    (role) => (staffByRole[role] ?? []).length > 0,
  )

  const dirty = Boolean(
    orderContext &&
    (JSON.stringify(droneIds) !== JSON.stringify(orderContext.initialDevices) ||
      missionRoles.some(
        (role) =>
          JSON.stringify(staffByRole[role] ?? []) !==
          JSON.stringify(orderContext.initialStaff[role] ?? []),
      )),
  )
  const draftCallback = orderContext?.onDraftState
  useEffect(() => {
    draftCallback?.(dirty, busy)
  }, [dirty, busy, draftCallback])
  const globalStepCallback = orderContext?.onGlobalStep
  useEffect(() => {
    globalStepCallback?.(activeStep === 'confirm' ? 7 : 6)
  }, [activeStep, globalStepCallback])

  async function assign() {
    if (
      busy ||
      !resourcesReady ||
      (orderContext &&
        (!orderContext.canAssign ||
          mission.data?.id !== missionId ||
          mission.data.orderId !== orderContext.orderId))
    )
      return
    if (droneIds.length === 0 || !hasAllRoles) {
      setError(t.selectDroneAndOperator)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await missionApi.assignResources(missionId, droneIds, staffByRole)
      toast.success(fb.resourcesAssigned)
      orderContext?.onAssigned()
      mission.reload()
      availability.reload()
    } catch (cause) {
      setError(planningError(cause))
      toast.error(planningError(cause))
      if (resourceAssignmentConflict(cause)) {
        conflictStep.current =
          cause instanceof ApiError && cause.path.includes('assign-device')
            ? 'device'
            : 'staff'
        setActiveStep(conflictStep.current)
      }
      orderContext?.onChanged()
      availability.reload()
      mission.reload()
    } finally {
      setBusy(false)
    }
  }
  return { selectedStaffIds, hasAllRoles, assign }
}
