import type { Mission } from '../../../mission/types/mission'
import { displayOrderCode } from '../../../../shared/lib/orderCode'
import {
  dispatchSteps,
  SIMULATION_MAP_BOUNDS,
  SIMULATION_MAP_IMAGE_CROP,
  SIMULATION_MAP_TOP_IMAGE,
  SIMULATION_MAP_VERSION,
  missionRoles,
} from './liveDispatchConstants'
import {
  worldToViewportPercent,
  simulationMapImageStyle,
} from '../../../../shared/lib/simulationMapProjection'
import { env } from '../../../../config/env'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import type { DispatchStep } from './liveDispatchTypes'
import { fmtDateTime } from './liveDispatchHelpers'
import type { OrderDispatchContext } from './liveDispatchTypes'
import type { AvailableDrone } from '../../../staff/api/droneApi'
import type { Dispatch, SetStateAction } from 'react'
import type { MissionStaffRole } from '../../../mission/types/mission'
import type { AvailableOperator } from '../../../staff/api/operatorApi'

export function deriveDispatchView({
  current,
  orderContext,
  activeStep,
  drones,
  droneIds,
  setActiveStep,
  staffByRole,
  operators,
  t,
}: {
  current: Mission
  orderContext: OrderDispatchContext | undefined
  activeStep: DispatchStep
  drones: { data: AvailableDrone[] | undefined; reload: () => void }
  droneIds: string[]
  setActiveStep: Dispatch<SetStateAction<DispatchStep>>
  staffByRole: Partial<Record<MissionStaffRole, string[]>>
  operators: { data: AvailableOperator[] | undefined; reload: () => void }
  t: (typeof liveDispatchPageMessages)['vi']
}) {
  const currentOrderCode = displayOrderCode(current.orderCode, current.orderId)
  const assignable = orderContext
    ? ['RESOURCE_ASSIGNING', 'WAITING_CREW_CONFIRMATION'].includes(
        current.status,
      )
    : current.status === 'RESOURCE_ASSIGNING' || current.status === 'CREATED'
  const activeStepIndex = dispatchSteps.indexOf(activeStep)
  const selectedDrones = (drones.data ?? []).filter((drone) =>
    droneIds.includes(drone.id),
  )
  const assignedDeviceText =
    selectedDrones.length > 0
      ? selectedDrones.map((drone) => drone.label).join(', ')
      : (current.droneCode ??
        current.deviceCode ??
        current.deviceId ??
        current.droneId ??
        '—')
  const hasTarget = current.latitude != null && current.longitude != null
  const target = hasTarget
    ? worldToViewportPercent(
        { simX: current.longitude ?? 0, simY: current.latitude ?? 0 },
        SIMULATION_MAP_BOUNDS,
        SIMULATION_MAP_IMAGE_CROP,
      )
    : null
  const mapImageUrl = `${env.apiBaseUrl}${SIMULATION_MAP_TOP_IMAGE}?v=${SIMULATION_MAP_VERSION}`
  const imageStyle = simulationMapImageStyle(SIMULATION_MAP_IMAGE_CROP)
  const goNext = () => {
    if (activeStep === 'mission' && orderContext) {
      if (orderContext.onMissionNext()) setActiveStep('staff')
      return
    }
    setActiveStep(
      dispatchSteps[Math.min(activeStepIndex + 1, dispatchSteps.length - 1)],
    )
  }
  const goPrevious = () => {
    if (activeStep === 'staff' && orderContext) {
      orderContext.onReturn()
      return
    }
    setActiveStep(dispatchSteps[Math.max(activeStepIndex - 1, 0)])
  }
  const globalStep: 6 | 7 = activeStep === 'confirm' ? 7 : 6
  const roleSummary = missionRoles.map((role) => ({
    role,
    names: (staffByRole[role] ?? [])
      .map(
        (id) => (operators.data ?? []).find((item) => item.id === id)?.fullName,
      )
      .filter(Boolean) as string[],
  }))
  const missingRoles = roleSummary.filter(
    (item) => item.names.length === 0,
  ).length
  const missingRoleNames = roleSummary
    .filter((item) => item.names.length === 0)
    .map((item) => t.roles[item.role])
  const stepHint: Record<DispatchStep, string> = {
    order: t.orderFooterHint,
    mission: t.missionFooterHint,
    staff: t.staffFooterHint,
    device: t.deviceFooterHint,
    confirm: t.footerHint,
  }
  const scheduleText = `${fmtDateTime(current.scheduledStartAt)}${
    current.scheduledEndAt ? ` → ${fmtDateTime(current.scheduledEndAt)}` : ''
  }`
  return {
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
  }
}
