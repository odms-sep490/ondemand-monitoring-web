import type {
  PostflightItemKey,
  PreflightItemResult,
  FaultType,
  MaintenanceSeverity,
} from '../../types/mission'
import type { PostflightCategoryDef, ResultsState } from './postflightTypes'
import {
  ALL_KEYS,
  buildInspectionResults,
  categoryKeys,
  clearCompletedMissionState,
  postflightCategories,
} from './postflightHelpers'
import { missionApi } from '../../../mission/api/missionApi'
import { postflightPageMessages } from './PostflightPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'
import type { BackendMission } from '../../api/liveMission'
import type { ManualPostflightReadings } from './manualInspection'

export function usePostflightAssessment({
  onSaved,
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
  categories,
}: {
  onSaved?: () => Promise<boolean>
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
  telemetrySnapshot: ManualPostflightReadings | null
  missionLabel: string
  setCompleted: Dispatch<
    SetStateAction<{
      overallOk: boolean
      ticketCreated: boolean
      droneStatus: string
      failed?: boolean
    } | null>
  >
  setTicketSubmitting: Dispatch<SetStateAction<boolean>>
  setNotes: Dispatch<SetStateAction<string>>
  setShowTicketDialog: Dispatch<SetStateAction<boolean>>
  setTicketCreated: Dispatch<SetStateAction<boolean>>
  /** Backend-driven categories; defaults to the built-in list. */
  categories?: PostflightCategoryDef[]
}) {
  const { t, lang } = useI18n(postflightPageMessages)
  const activeCategories = categories ?? postflightCategories(lang)
  const activeKeys = categories ? categoryKeys(categories) : ALL_KEYS
  function handleSetResult(
    key: PostflightItemKey,
    result: PreflightItemResult,
  ) {
    setResults((prev) => ({ ...prev, [key]: result }))
  }

  function handlePassAll() {
    const next: ResultsState = {}
    for (const key of activeKeys) {
      next[key] = 'ok'
    }
    setResults(next)
  }

  async function handleComplete() {
    if (!effectiveMissionId) {
      setError(t.noMissionId)
      return
    }
    if (telemetrySnapshot?.batteryPercent == null || !Number.isFinite(telemetrySnapshot.batteryPercent)
      || telemetrySnapshot.batteryPercent < 0 || telemetrySnapshot.batteryPercent > 100) {
      setError('Vui lòng nhập mức pin sau bay từ 0 đến 100%.')
      return
    }
    if (!allAssessed) {
      setError(t.assessAllRequired(activeKeys.length))
      return
    }

    setSaving(true)
    setError(null)

    try {
      const mainDeviceStatus = activeData?.deviceAssignments?.find(
        (assignment) => assignment.deviceRole === 'MAIN',
      )?.status
      if (
        mainDeviceStatus === 'RETURNING' ||
        activeData?.status === 'RETURNING'
      ) {
        await missionApi.startPostflight(effectiveMissionId)
      }

      const inspectionResults = buildInspectionResults(
        activeCategories,
        results,
      )

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

      if (onSaved && !(await onSaved())) return

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
