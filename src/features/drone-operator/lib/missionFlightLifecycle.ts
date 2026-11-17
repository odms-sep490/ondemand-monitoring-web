/** Mission business review can remain IN_PROGRESS after physical flight ends. */
export function hasMissionFlightEnded(mission: {
  actualEndAt?: string | null
  completedAt?: string | null
  deviceAssignmentStatus?: string | null
}) {
  return Boolean(mission.actualEndAt || mission.completedAt)
    || mission.deviceAssignmentStatus === 'POSTFLIGHT_CHECKING'
    || mission.deviceAssignmentStatus === 'COMPLETED'
}
