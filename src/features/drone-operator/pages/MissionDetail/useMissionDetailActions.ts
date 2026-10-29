import { operatorApi } from '../../api/operatorApi'
import { getLanguage } from '../../../../shared/i18n'
import { actionErrorMessage } from './missionResponse'
import { missionDetailActionMessages } from './useMissionDetailActions.messages'
import { missionApi } from '../../../mission/api/missionApi'
import { formatVnDate } from './missionFormat'
import type { Dispatch, SetStateAction } from 'react'
import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import type { OperatorMission } from '../../types/mission'
import type { MissionChecklistResponse } from '../../../mission/types/checklistExecution'
import type { MissionResult } from '../../../mission/types/mission'
import type { MissionPermissions } from '../../../mission/types/permissions'

export function useMissionDetailActions({
  setActionError,
  setMediaRevision,
  query,
  monitoring,
  setSubmitting,
  mission,
  setShowReject,
  actions,
  submitting,
  resultSubmitting,
  setResultSubmitting,
}: {
  setActionError: Dispatch<unknown>
  setMediaRevision: Dispatch<SetStateAction<number>>
  query: UseApiQueryState<OperatorMission>
  monitoring: UseApiQueryState<{
    checklist: MissionChecklistResponse
    result: MissionResult | null
    permissions: MissionPermissions
  }>
  setSubmitting: Dispatch<SetStateAction<boolean>>
  mission: OperatorMission
  setShowReject: Dispatch<SetStateAction<boolean>>
  actions: {
    known: boolean
    submitted: boolean
    canComplete: boolean
    canSubmit: boolean
    completeReady: boolean
    submitReady: boolean
    readinessReason: string
  }
  submitting: boolean
  resultSubmitting: boolean
  setResultSubmitting: Dispatch<SetStateAction<boolean>>
}) {
  const refreshWorkspace = (clearError = true) => {
    if (clearError) setActionError(null)
    setMediaRevision((value) => value + 1)
    query.reload()
    monitoring.reload()
  }

  async function handleAccept() {
    setSubmitting(true)
    setActionError(null)
    try {
      await operatorApi.acceptMission(mission.id)
      // Permissions (for example "operate payload" -> Connect GCS) come from the monitoring call, so reload it too.
      refreshWorkspace(false)
    } catch (error) {
      setActionError(
        actionErrorMessage(
          error,
          missionDetailActionMessages[getLanguage()].acceptFailed,
          getLanguage(),
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStartWorkflow() {
    setSubmitting(true)
    setActionError(null)
    try {
      await missionApi.startMissionWorkflow(mission.id)
      refreshWorkspace(false)
    } catch (error) {
      setActionError(
        actionErrorMessage(
          error,
          missionDetailActionMessages[getLanguage()].startFailed,
          getLanguage(),
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject(reason: string, notes: string) {
    setSubmitting(true)
    setActionError(null)
    try {
      await operatorApi.rejectMission(mission.id, { reason, notes })
      setShowReject(false)
      refreshWorkspace(false)
    } catch (error) {
      setActionError(
        actionErrorMessage(
          error,
          missionDetailActionMessages[getLanguage()].rejectFailed,
          getLanguage(),
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  function buildMissionResultPayload() {
    return {
      status: 'COMPLETED',
      startedAt: mission.flightStartedAt ?? null,
      endedAt: mission.completedAt ?? null,
      completedAt: mission.completedAt ?? new Date().toISOString(),
      summary: [
        `Mission ${mission.missionCode ?? mission.id} đã hoàn thành.`,
        `Dịch vụ: ${mission.serviceLabel || 'Chưa rõ'}.`,
        `Địa điểm: ${mission.location || 'Chưa rõ'}.`,
        `Ngày bay: ${formatVnDate(mission.date)}.`,
        `Vùng giám sát: ${mission.radiusMeters == null ? 'chưa rõ bán kính' : `bán kính ${mission.radiusMeters} m`}.`,
      ].join(' '),
      notes: 'Kết quả giám sát được gửi cho manager duyệt.',
    } as const
  }

  async function submitResultToManager() {
    await missionApi.submitMissionResult(
      mission.id,
      buildMissionResultPayload(),
    )
  }

  async function handleCompleteMission() {
    if (!actions.completeReady || submitting || resultSubmitting) return
    setSubmitting(true)
    setActionError(null)
    try {
      await missionApi.completeMission(mission.id)
    } catch (error) {
      setActionError(error)
    } finally {
      refreshWorkspace(false)
      setSubmitting(false)
    }
  }

  async function handleSubmitResult() {
    if (!actions.submitReady || resultSubmitting || submitting) return
    setResultSubmitting(true)
    setActionError(null)
    try {
      if ((mission.backendStatus ?? mission.status) === 'PENDING_REVIEW') {
        await missionApi.completeMission(mission.id)
      }
      await submitResultToManager()
    } catch (error) {
      setActionError(error)
    } finally {
      refreshWorkspace(false)
      setResultSubmitting(false)
    }
  }
  return {
    refreshWorkspace,
    handleAccept,
    handleStartWorkflow,
    handleReject,
    handleCompleteMission,
    handleSubmitResult,
  }
}
