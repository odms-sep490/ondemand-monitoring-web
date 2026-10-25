import type { DroneCandidate } from '../../types/missions'

export type LockedDrone = {
  candidate: DroneCandidate | null
  code: string
  name: string
  assignmentId: string
}
