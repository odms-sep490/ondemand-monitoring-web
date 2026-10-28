import type { MissionStaffRole } from '../../mission/types/mission'

export const requiredAssignmentRoles: MissionStaffRole[] = [
  'PILOT',
  'OPERATOR',
  'MAINTAINER',
  'INSPECTOR',
]
type AssignmentSnapshot = {
  status: string
  deviceId?: string | null
  droneId?: string | null
  staffAssignments?: {
    staffId: string
    assignedRole: MissionStaffRole
    responseStatus?: string
  }[]
}

/** Manager submission is distinct from crew acceptance. Never infer it from checkbox/local state. */
export function assignmentReadiness(mission: AssignmentSnapshot) {
  const missingRoles = requiredAssignmentRoles.filter(
    (role) =>
      !mission.staffAssignments?.some(
        (person) =>
          person.assignedRole === role &&
          Boolean(person.staffId) &&
          person.responseStatus !== 'REJECTED',
      ),
  )
  const device = Boolean(mission.deviceId || mission.droneId)
  const setupState = [
    'RESOURCE_ASSIGNING',
    'READY',
  ].includes(mission.status)
  const submitted =
    mission.status !== 'RESOURCE_ASSIGNING' && mission.status !== 'CREATED'
  const complete = !missingRoles.length && device && submitted
  const step = missingRoles.length ? 'staff' : !device ? 'device' : 'confirm'
  const label = !setupState
    ? null
    : missingRoles.length
      ? 'Thiếu nhân sự'
      : !device
        ? 'Chưa gán thiết bị'
        : !submitted
          ? 'Chờ xác nhận phân công'
          : 'Đã phân công nguồn lực'
  return {
    missingRoles,
    device,
    complete,
    step,
    label,
    needsSetup: setupState && !complete,
  } as const
}
