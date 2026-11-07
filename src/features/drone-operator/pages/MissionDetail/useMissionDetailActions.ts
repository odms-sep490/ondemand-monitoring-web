import { operatorApi } from '../../api/operatorApi'
import { actionErrorMessage } from './missionResponse'
import { missionApi } from '../../../mission/api/missionApi'
import { formatVnDate } from './missionFormat'
import type { Dispatch, SetStateAction } from 'react'
import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import type { OperatorMission } from '../../types/mission'
import type { MissionChecklistResponse } from '../../../mission/types/checklistExecution'
import type { MissionResult } from '../../../mission/types/mission'
import type { MissionPermissions } from '../../../mission/types/permissions'
import { authenticatedFetch } from '../../../auth/api/authApi'
import { env } from '../../../../config/env'
import type { WeatherPreflightStatus } from './types'
import { isWeatherCheckFreshAfterPermit } from './weatherReadiness'
import { acceptWeatherCheck } from './checkData'

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
  weatherStatus,
  setWeatherStatus,
  flightPermitNotApprovedMessage,
  weatherAfterPermitRequiredMessage,
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
  weatherStatus: WeatherPreflightStatus | null
  setWeatherStatus: Dispatch<SetStateAction<WeatherPreflightStatus | null>>
  flightPermitNotApprovedMessage: string
  weatherAfterPermitRequiredMessage: string
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
          'Không thể chấp nhận mission. Vui lòng thử lại.',
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
      if (mission.flightPermitStatus !== 'APPROVED') {
        throw new Error(flightPermitNotApprovedMessage)
      }
      const weatherIsFresh = isWeatherCheckFreshAfterPermit(
        weatherStatus,
        mission.flightPermitUpdatedAt,
      )
      if (!weatherIsFresh || weatherStatus?.safeToFly !== true) {
        if (
          typeof mission.latitude !== 'number' ||
          typeof mission.longitude !== 'number' ||
          !Number.isFinite(mission.latitude) ||
          !Number.isFinite(mission.longitude)
        ) {
          throw new Error('Mission chưa có tọa độ để kiểm tra thời tiết trước khi bay.')
        }
        const weatherResponse = await authenticatedFetch(
          `${env.apiBaseUrl}/api/weather/preflight-check`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              missionId: mission.id,
              latitude: mission.latitude,
              longitude: mission.longitude,
            }),
          },
        )
        if (!weatherResponse.ok) {
          throw new Error('Không kiểm tra được thời tiết. Hãy thử lại trước khi bắt đầu Mission.')
        }
        const weatherPayload = await weatherResponse.json()
        const weather = weatherPayload?.data ?? weatherPayload
        if (
          !weather ||
          typeof weather.safeToFly !== 'boolean' ||
          typeof weather.checkedAt !== 'string' ||
          typeof weather.windSpeedMps !== 'number' ||
          typeof weather.windGustMps !== 'number' ||
          typeof weather.precipitationMmH !== 'number' ||
          typeof weather.visibilityKm !== 'number' ||
          typeof weather.temperatureC !== 'number' ||
          typeof weather.humidityPercent !== 'number'
        ) {
          throw new Error('Kết quả kiểm tra thời tiết không hợp lệ. Hãy thử lại.')
        }
        setWeatherStatus(weather as WeatherPreflightStatus)
        void monitoring.reload()
        if (weather.safeToFly !== true) {
          return
        }
        // Let the inspector review the measured conditions before starting.
        return
      }
      if (weatherStatus?.safeToFly !== true) {
        throw new Error(weatherStatus?.summary || 'Thời tiết hiện tại chưa an toàn để bắt đầu Mission.')
      }
      if (weatherStatus.inspectorAccepted !== true) {
        throw new Error('Nghiệm thu cần bấm Đạt sau khi xem kết quả thời tiết trước khi bắt đầu Mission.')
      }
      await missionApi.startMission(mission.id)
      refreshWorkspace(false)
    } catch (error) {
      setActionError(
        actionErrorMessage(
          error,
          'Chưa thể bắt đầu nhiệm vụ. Hãy bảo đảm thiết bị đã đạt kiểm tra trước bay và quyền điều khiển đã được bàn giao.',
          flightPermitNotApprovedMessage,
          weatherAfterPermitRequiredMessage,
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAcceptWeather() {
    if (
      !weatherStatus?.id ||
      mission.flightPermitStatus !== 'APPROVED' ||
      !isWeatherCheckFreshAfterPermit(
        weatherStatus,
        mission.flightPermitUpdatedAt,
      ) ||
      weatherStatus.safeToFly !== true
    ) {
      setActionError('Chỉ có thể nghiệm thu kết quả thời tiết an toàn và còn mới trong 15 phút.')
      return
    }
    setSubmitting(true)
    setActionError(null)
    try {
      const accepted = await acceptWeatherCheck(mission.id, weatherStatus.id)
      setWeatherStatus(accepted)
      void monitoring.reload()
    } catch (error) {
      setActionError(
        actionErrorMessage(error, 'Không thể xác nhận thời tiết đạt. Vui lòng thử lại.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancelMission(reason: string) {
    setSubmitting(true)
    setActionError(null)
    try {
      await missionApi.cancelMission(mission.id, reason)
      refreshWorkspace(false)
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
          'Không thể từ chối mission. Vui lòng thử lại.',
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
      notes: 'Nghiệm thu viên xác nhận kết quả giám sát.',
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
    handleAcceptWeather,
    handleCancelMission,
    handleReject,
    handleCompleteMission,
    handleSubmitResult,
  }
}
