import { missionsApi } from '../../api/missionsApi'
import { ApiError } from '../../../../shared/api/httpClient'
import type { Mission } from '../../types/missions'
import { missionDispatchPageMessages } from './MissionDispatchPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'
import type {
  ResourceSuggestions,
  OperatorCandidate,
} from '../../types/missions'
import type { LockedDrone } from './dispatchTypes'

export function useDispatchActions({
  setLockingDrone,
  setDroneError,
  mission,
  setMission,
  suggestions,
  setLockedDrone,
  lockedDrone,
  selectedOperator,
  setAssigning,
  setAssignError,
  selectedOperatorCandidate,
  setToast,
  setSelectedOperator,
  setReleaseModal,
  onMissionChanged,
}: {
  setLockingDrone: Dispatch<SetStateAction<boolean>>
  setDroneError: Dispatch<SetStateAction<string | null>>
  mission: Mission
  setMission: Dispatch<SetStateAction<Mission>>
  suggestions: ResourceSuggestions
  setLockedDrone: Dispatch<SetStateAction<LockedDrone | null>>
  lockedDrone: LockedDrone | null
  selectedOperator: string | null
  setAssigning: Dispatch<SetStateAction<boolean>>
  setAssignError: Dispatch<SetStateAction<string | null>>
  selectedOperatorCandidate: OperatorCandidate | undefined
  setToast: Dispatch<SetStateAction<string | null>>
  setSelectedOperator: Dispatch<SetStateAction<string | null>>
  setReleaseModal: Dispatch<SetStateAction<boolean>>
  onMissionChanged: () => void
}) {
  const { t } = useI18n(missionDispatchPageMessages)
  async function handleLockDrone(droneCode: string) {
    setLockingDrone(true)
    setDroneError(null)
    try {
      const updated = await missionsApi.assignDrone(mission.id, droneCode)
      setMission(updated)
      const candidate =
        suggestions.topDrones.find((d) => d.code === droneCode) ?? null
      setLockedDrone({
        candidate,
        code: droneCode,
        name: candidate?.name ?? droneCode,
        assignmentId: updated.droneAssignmentId ?? '',
      })
    } catch (err) {
      setDroneError(err instanceof ApiError ? err.message : t.cannotSelectDrone)
    } finally {
      setLockingDrone(false)
    }
  }

  async function handleAssignOperator() {
    if (!lockedDrone || !selectedOperator) return
    setAssigning(true)
    setAssignError(null)
    try {
      const updated = await missionsApi.assignOperator(
        mission.id,
        selectedOperator,
      )
      setMission(updated)
      const name = selectedOperatorCandidate?.fullName ?? selectedOperator
      setToast(t.assignSuccess(name))
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SCHEDULE_CONFLICT') {
        setAssignError(err.message)
      } else {
        setAssignError(err instanceof ApiError ? err.message : t.assignFailed)
      }
    } finally {
      setAssigning(false)
    }
  }

  async function handleAutoAssign() {
    const topDrone = suggestions.topDrones[0]
    const topOperator = suggestions.topOperators[0]
    if (!topDrone || !topOperator) return
    // Step 1: lock drone
    setLockingDrone(true)
    setDroneError(null)
    let updated: Mission
    try {
      updated = await missionsApi.assignDrone(mission.id, topDrone.code)
      setMission(updated)
      setLockedDrone({
        candidate: topDrone,
        code: topDrone.code,
        name: topDrone.name,
        assignmentId: updated.droneAssignmentId ?? '',
      })
    } catch (err) {
      setDroneError(err instanceof ApiError ? err.message : t.cannotSelectDrone)
      setLockingDrone(false)
      return
    }
    setLockingDrone(false)
    // Step 2: assign operator
    setAssigning(true)
    setAssignError(null)
    try {
      const afterOp = await missionsApi.assignOperator(
        mission.id,
        topOperator.code,
      )
      setMission(afterOp)
      setSelectedOperator(topOperator.code)
      setToast(t.autoAssignSuccess(topDrone.name, topOperator.fullName))
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SCHEDULE_CONFLICT') {
        setAssignError(err.message)
      } else {
        setAssignError(err instanceof ApiError ? err.message : t.assignFailed)
      }
    } finally {
      setAssigning(false)
    }
  }

  async function handleRelease(reason: string) {
    if (mission.droneAssignmentId) {
      await missionsApi.releaseAssignment(
        mission.id,
        mission.droneAssignmentId,
        reason,
      )
    }
    if (mission.operatorAssignmentId) {
      await missionsApi.releaseAssignment(
        mission.id,
        mission.operatorAssignmentId,
        reason,
      )
    }
    setReleaseModal(false)
    setLockedDrone(null)
    setSelectedOperator(null)
    onMissionChanged()
  }
  return {
    handleLockDrone,
    handleAssignOperator,
    handleAutoAssign,
    handleRelease,
  }
}
