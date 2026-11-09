import type { MissionCalendarItem } from '../types/missions'

type MissionDroneAssignmentTarget = Pick<
  MissionCalendarItem,
  'status' | 'scheduledStartAt'
> & {
  scheduledEndAt?: MissionCalendarItem['scheduledEndAt']
}

export function canAssignMissionDrone(
  mission: MissionDroneAssignmentTarget,
) {
  return (
    (mission.status === 'PLANNING' || mission.status === 'READY') &&
    Boolean(mission.scheduledStartAt && mission.scheduledEndAt)
  )
}
