import type {
  PostflightItemKey,
  PreflightItemResult,
  FaultType,
  MaintenanceSeverity,
} from '../../types/mission'
import type { ResultsState } from './postflightTypes'
import { ALL_KEYS, clearCompletedMissionState } from './postflightHelpers'
import { missionApi } from '../../../mission/api/missionApi'
import { flightControlApi } from '../../api/flightControlApi'
import { postflightPageMessages } from './PostflightPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'
import type { BackendMission } from '../../api/liveMission'
import type { FlightControlStatus } from '../../api/flightControlApi'

export function usePostflightAssessment({
  setResults,
  effectiveMissionId,
  setError,
  allAssessed,
  setSaving,
  activeData,
  results,
  failItems,
  deviceId,
  notes,
  telemetrySnapshot,
  missionLabel,
  setCompleted,
  setTicketSubmitting,
  setNotes,
  setShowTicketDialog,
  setTicketCreated,
}: {
  setResults: Dispatch<
    SetStateAction<Partial<Record<PostflightItemKey, PreflightItemResult>>>
  >
  effectiveMissionId: string
  setError: Dispatch<SetStateAction<string | null>>
  allAssessed: boolean
  setSaving: Dispatch<SetStateAction<boolean>>
  activeData: BackendMission | undefined
  results: Partial<Record<PostflightItemKey, PreflightItemResult>>
  failItems: PostflightItemKey[]
  deviceId: string
  notes: string
  telemetrySnapshot: FlightControlStatus | null
  missionLabel: string
  setCompleted: Dispatch<
    SetStateAction<{
      overallOk: boolean
      ticketCreated: boolean
      droneStatus: string
    } | null>
  >
  setTicketSubmitting: Dispatch<SetStateAction<boolean>>
  setNotes: Dispatch<SetStateAction<string>>
  setShowTicketDialog: Dispatch<SetStateAction<boolean>>
  setTicketCreated: Dispatch<SetStateAction<boolean>>
}) {
  const { t } = useI18n(postflightPageMessages)
  function handleSetResult(
    key: PostflightItemKey,
    result: PreflightItemResult,
  ) {
    setResults((prev) => ({ ...prev, [key]: result }))
  }

  function handlePassAll() {
    const next: ResultsState = {}
    for (const key of ALL_KEYS) {
      next[key] = 'ok'
    }
    setResults(next)
  }

  async function handleComplete() {
    if (!effectiveMissionId) {
      setError(t.noMissionId)
      return
    }
    if (!allAssessed) {
      setError(t.assessAllRequired(ALL_KEYS.length))
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (activeData?.status === 'RETURNING') {
        await missionApi.startPostflight(effectiveMissionId).catch(() => {
          // Proceed if already in postflight checking state
        })
      }

      const getResult = (key: PostflightItemKey): 'PASS' | 'FAIL' =>
        results[key] === 'ok' ? 'PASS' : 'FAIL'

      const inspectionResults: Record<string, 'PASS' | 'FAIL'> = {
        a1: getResult('physical_condition_ok'),
        a2: getResult('physical_condition_ok'),
        p1: getResult('motor_ok'),
        p2: getResult('motor_ok'),
        e1: getResult('battery_ok'),
        e4: getResult('battery_ok'),
        e2: getResult('camera_ok'),
        e3: getResult('gps_ok'),
        d1: getResult('communication_ok'),
      }

      const hasFailures = failItems.length > 0
      const targetDroneStatus = hasFailures ? 'MAINTENANCE' : 'AVAILABLE'

      // Submit Postflight status to Backend
      // BE automatically creates MaintenanceTicket if targetDroneStatus is MAINTENANCE
      await missionApi.postFlightStatus(
        effectiveMissionId,
        deviceId,
        targetDroneStatus,
        notes,
        inspectionResults,
        telemetrySnapshot,
      )

      await missionApi
        .disconnectGcs(effectiveMissionId, 'POSTFLIGHT_COMPLETED')
        .catch(() => {
          // Postcheck is complete; local cleanup must still happen even if the session was already closed.
        })
      await flightControlApi.releaseSession(effectiveMissionId).catch(() => {
        // Controller may be offline after landing; local cleanup still allows the operator flow to reset.
      })
      clearCompletedMissionState(effectiveMissionId, missionLabel, deviceId)

      setCompleted({
        overallOk: !hasFailures,
        ticketCreated: hasFailures,
        droneStatus: targetDroneStatus,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateTicket(
    _issueType: FaultType,
    _severity: MaintenanceSeverity,
    description: string,
  ) {
    setTicketSubmitting(true)
    try {
      setNotes((current) =>
        [current, `${t.incidentDetailsPrefix} ${description}`]
          .filter(Boolean)
          .join('\n'),
      )
      setShowTicketDialog(false)
      setTicketCreated(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.noteWriteFailed)
    } finally {
      setTicketSubmitting(false)
    }
  }
  return { handleSetResult, handlePassAll, handleComplete, handleCreateTicket }
}
