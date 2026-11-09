import type { MissionStatus } from '../../../shared/types/domain'
import type { MissionStaffAssignmentResponse } from '../types/missions'

/**
 * Planning assignments are persisted before they become current operational resources.
 * Keep them visible while the mission is PLANNING; later stages show only current staff.
 */
export function getVisibleMissionStaffAssignments(
  missionStatus: MissionStatus | null | undefined,
  assignments: MissionStaffAssignmentResponse[] | null | undefined,
): MissionStaffAssignmentResponse[] {
  const staffAssignments = assignments ?? []
  return missionStatus === 'PLANNING'
    ? staffAssignments
    : staffAssignments.filter((assignment) => assignment.isCurrent !== false)
}
