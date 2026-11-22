import { operatorApi } from '../../api/operatorApi'
import { actionErrorMessage } from './missionResponse'
import { missionApi } from '../../../mission/api/missionApi'
import { formatVnDate } from './missionFormat'
import { defineMessages, getLanguage } from '../../../../shared/i18n'
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

const missionDetailActionMessages = defineMessages({
  vi: {
    acceptFailed: 'Không thể chấp nhận mission. Vui lòng thử lại.',
    missingCoordinates:
      'Mission chưa có tọa độ để kiểm tra thời tiết trước khi bay.',
    weatherCheckFailed:
      'Không kiểm tra được thời tiết. Hãy thử lại trước khi bắt đầu Mission.',
    weatherInvalid: 'Kết quả kiểm tra thời tiết không hợp lệ. Hãy thử lại.',
    weatherApprovalRequired:
      'Người phụ trách cần xác nhận quyết định thời tiết trước khi bắt đầu Mission.',
    startFailed:
      'Chưa thể bắt đầu nhiệm vụ. Hãy bảo đảm thiết bị đã đạt kiểm tra trước bay và quyền điều khiển đã được bàn giao.',
    weatherFreshnessRequired:
      'Chỉ có thể xác nhận quyết định khi thời tiết được kiểm tra lại sau khi cấp phép và còn mới trong 15 phút.',
    saveWeatherFailed:
      'Không thể lưu quyết định thời tiết. Vui lòng thử lại.',
    rejectFailed: 'Không thể từ chối mission. Vui lòng thử lại.',
    unknownValue: 'Chưa rõ',
    unknownRadius: 'chưa rõ bán kính',
    radiusValue: (m: number) => `bán kính ${m} m`,
    resultSummary: (
      code: string,
      service: string,
      location: string,
      date: string,
      radius: string,
    ) =>
      `Mission ${code} đã hoàn thành. Dịch vụ: ${service}. Địa điểm: ${location}. Ngày bay: ${date}. Vùng giám sát: ${radius}.`,
    resultNotes: 'Nghiệm thu viên xác nhận kết quả giám sát.',
  },
  en: {
    acceptFailed: 'Unable to accept the mission. Please try again.',
    missingCoordinates:
      'The Mission does not have coordinates for preflight weather checks.',
    weatherCheckFailed:
      'Unable to check the weather. Please retry before starting the Mission.',
    weatherInvalid: 'The weather check result is invalid. Please try again.',
    weatherApprovalRequired:
      'The responsible crew member must confirm the weather decision before starting the Mission.',
    startFailed:
      'Unable to start the mission. Ensure the device passed preflight checks and control has been handed over.',
    weatherFreshnessRequired:
      'The weather decision can only be confirmed when weather was checked after permit approval and within the last 15 minutes.',
    saveWeatherFailed:
      'Unable to save the weather decision. Please try again.',
    rejectFailed: 'Unable to decline the mission. Please try again.',
    unknownValue: 'Unknown',
    unknownRadius: 'unknown radius',
    radiusValue: (m: number) => `radius ${m} m`,
    resultSummary: (
      code: string,
      service: string,
      location: string,
      date: string,
      radius: string,
    ) =>
      `Mission ${code} completed. Service: ${service}. Location: ${location}. Flight date: ${date}. Monitoring area: ${radius}.`,
    resultNotes: 'The inspector confirmed the monitoring results.',
  },
})

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
    const t = missionDetailActionMessages[getLanguage()]
    setSubmitting(true)
    setActionError(null)
    try {
      await operatorApi.acceptMission(mission.id)
      // Refresh mission permissions after acceptance so the pre-flight actions update.
      refreshWorkspace(false)
    } catch (error) {
      setActionError(actionErrorMessage(error, t.acceptFailed))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStartWorkflow() {
    const t = missionDetailActionMessages[getLanguage()]
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
      if (!weatherIsFresh) {
        if (
          typeof mission.latitude !== 'number' ||
          typeof mission.longitude !== 'number' ||
          !Number.isFinite(mission.latitude) ||
          !Number.isFinite(mission.longitude)
        ) {
          throw new Error(t.missingCoordinates)
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
          throw new Error(t.weatherCheckFailed)
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
          throw new Error(t.weatherInvalid)
        }
        setWeatherStatus(weather as WeatherPreflightStatus)
        void monitoring.reload()
        // Let the assigned crew member review the measured conditions before starting.
        return
      }
      if (weatherStatus?.inspectorAccepted !== true) {
        throw new Error(t.weatherApprovalRequired)
      }
      await missionApi.startMission(mission.id)
      refreshWorkspace(false)
    } catch (error) {
      setActionError(
        actionErrorMessage(
          error,
          t.startFailed,
          flightPermitNotApprovedMessage,
          weatherAfterPermitRequiredMessage,
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAcceptWeather() {
    const t = missionDetailActionMessages[getLanguage()]
    if (
      !weatherStatus?.id ||
      mission.flightPermitStatus !== 'APPROVED' ||
      !isWeatherCheckFreshAfterPermit(
        weatherStatus,
        mission.flightPermitUpdatedAt,
      )
    ) {
      setActionError(t.weatherFreshnessRequired)
      return
    }
    setSubmitting(true)
    setActionError(null)
    try {
      const accepted = await acceptWeatherCheck(mission.id, weatherStatus.id)
      setWeatherStatus(accepted)
      void monitoring.reload()
    } catch (error) {
      setActionError(actionErrorMessage(error, t.saveWeatherFailed))
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
    const t = missionDetailActionMessages[getLanguage()]
    setSubmitting(true)
    setActionError(null)
    try {
      await operatorApi.rejectMission(mission.id, { reason, notes })
      setShowReject(false)
      refreshWorkspace(false)
    } catch (error) {
      setActionError(actionErrorMessage(error, t.rejectFailed))
    } finally {
      setSubmitting(false)
    }
  }

  function buildMissionResultPayload() {
    const t = missionDetailActionMessages[getLanguage()]
    return {
      status: 'COMPLETED',
      startedAt: mission.flightStartedAt ?? null,
      endedAt: mission.completedAt ?? null,
      completedAt: mission.completedAt ?? new Date().toISOString(),
      summary: t.resultSummary(
        mission.missionCode ?? mission.id,
        mission.serviceLabel || t.unknownValue,
        mission.location || t.unknownValue,
        formatVnDate(mission.date),
        mission.radiusMeters == null
          ? t.unknownRadius
          : t.radiusValue(mission.radiusMeters),
      ),
      notes: t.resultNotes,
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
