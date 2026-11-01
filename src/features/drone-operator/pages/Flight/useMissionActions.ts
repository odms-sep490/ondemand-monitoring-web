import { useCallback } from 'react'
import { markActiveMissionFlowStep } from '../../api/liveMission'
import { navigateOperator } from './navigateOperator'
import { operatorHref } from '../../routes'
import { getLanguage, useI18n } from '../../../../shared/i18n'
import { missionApi } from '../../../mission/api/missionApi'
import { missionHasSafeStop } from '../../../mission/lib/missionOperationalState'
import { flightControlApi } from '../../api/flightControlApi'
import type { FlightCommand, WeatherPreset } from './inFlightTypes'
import { controlBaseUrl } from './inFlightConstants'
import { inFlightControlMessages } from './components/InFlightControl.messages'
import type { Mission, Drone } from '../../types/omss'
import type { Dispatch, SetStateAction, RefObject } from 'react'
import type { ControlStatus } from './inFlightTypes'

export function useMissionActions({
  mission,
  onReviewMedia,
  onStartFlight,
  startFlightBusy,
  setStartFlightBusy,
  setLastCommand,
  finishFlightBusy,
  setFinishFlightBusy,
  drone,
  normalFlightAllowed,
  referenceBusyRef,
  setReferenceBusy,
  controlStatus,
  setLidarDetailsOpen,
  sendCommand,
  setIsOnline,
  onPreflightReady,
  preflightStorageKey,
  setPreflightReady,
}: {
  mission: Mission
  onReviewMedia: (() => void) | undefined
  onStartFlight: (() => Promise<void>) | undefined
  startFlightBusy: boolean
  setStartFlightBusy: Dispatch<SetStateAction<boolean>>
  setLastCommand: Dispatch<SetStateAction<string>>
  finishFlightBusy: boolean
  setFinishFlightBusy: Dispatch<SetStateAction<boolean>>
  drone: Drone
  normalFlightAllowed: boolean
  referenceBusyRef: RefObject<boolean>
  setReferenceBusy: Dispatch<SetStateAction<boolean>>
  controlStatus: ControlStatus | null
  setLidarDetailsOpen: Dispatch<SetStateAction<boolean>>
  sendCommand: (command: FlightCommand) => Promise<void>
  setIsOnline: Dispatch<SetStateAction<boolean>>
  onPreflightReady: (() => Promise<void>) | undefined
  preflightStorageKey: string
  setPreflightReady: Dispatch<SetStateAction<boolean>>
}) {
  const { t } = useI18n(inFlightControlMessages)
  const handleReviewMedia = useCallback(() => {
    const missionId = mission.backendId ?? mission.id
    markActiveMissionFlowStep(missionId, 5)
    if (onReviewMedia) {
      onReviewMedia()
      return
    }
    navigateOperator(operatorHref({ screen: 'checklist', missionId }))
  }, [mission.backendId, mission.id, onReviewMedia])
  const handleStartFlight = useCallback(async () => {
    if (!onStartFlight || startFlightBusy) return
    setStartFlightBusy(true)
    setLastCommand(
      getLanguage() === 'en'
        ? 'Starting flight...'
        : 'Đang bắt đầu chuyến bay...',
    )
    try {
      await onStartFlight()
      setLastCommand(
        getLanguage() === 'en'
          ? 'Mission is in flight'
          : 'Mission đã chuyển sang Đang bay',
      )
    } catch (error) {
      setLastCommand(
        error instanceof Error ? error.message : t.status.controllerOffline,
      )
    } finally {
      setStartFlightBusy(false)
    }
  }, [onStartFlight, startFlightBusy, t.status.controllerOffline])
  const handleFinishFlight = useCallback(async () => {
    if (finishFlightBusy) return
    const missionId = mission.backendId ?? mission.id
    setFinishFlightBusy(true)
    setLastCommand(t.status.finishingFlight)
    try {
      const current = await missionApi.getMissionById(missionId)
      const stopping = missionHasSafeStop(current)
      if (stopping) {
        const latest = await flightControlApi.status()
        if (
          latest.missionId !== missionId ||
          latest.deviceId !== drone.id ||
          latest.inAir !== false
        )
          throw new Error(
            'Cần hạ cánh và kiểm tra đúng phiên Mission trước khi kết thúc vận hành.',
          )
        if (current.status === 'IN_FLIGHT' || current.status === 'IN_PROGRESS')
          await missionApi.markReturning(missionId)
        await flightControlApi.releaseSession(missionId)
      } else {
        await missionApi.markReturning(missionId).catch(() => undefined)
      }
      await missionApi.startPostflight(missionId)
      markActiveMissionFlowStep(missionId, 5)
      setLastCommand(t.status.flightFinished)
      navigateOperator(
        operatorHref(
          stopping
            ? { screen: 'missionDetail', missionId }
            : { screen: 'missions' },
        ),
      )
    } catch (error) {
      setLastCommand(
        error instanceof Error ? error.message : t.status.controllerOffline,
      )
    } finally {
      setFinishFlightBusy(false)
    }
  }, [
    finishFlightBusy,
    mission.backendId,
    mission.id,
    drone.id,
    onReviewMedia,
    t,
  ])
  const handleReferenceCapture = useCallback(async () => {
    if (!normalFlightAllowed) return
    if (referenceBusyRef.current) return
    referenceBusyRef.current = true
    setReferenceBusy(true)
    const en = getLanguage() === 'en'
    setLastCommand(en ? 'Getting drone position…' : 'Đang lấy vị trí drone...')
    try {
      const missionKey = mission.backendId ?? mission.id
      // The telemetry sender only publishes GPS once the flight controller is bound to this mission.
      let justBound = false
      if (
        controlStatus?.missionId !== missionKey ||
        controlStatus?.deviceId !== drone.id
      ) {
        await flightControlApi.bindSession(missionKey, drone.id)
        justBound = true
      }
      const waitMs = (ms: number) =>
        new Promise((resolve) => window.setTimeout(resolve, ms))
      if (justBound) await waitMs(3000)
      let result: Awaited<
        ReturnType<typeof missionApi.captureReferenceImage>
      > | null = null
      for (let attempt = 0; attempt < 4 && !result; attempt += 1) {
        try {
          result = await missionApi.captureReferenceImage(missionKey)
        } catch (error) {
          const waitingForTelemetry =
            error instanceof Error && /vị trí GPS|quá cũ/i.test(error.message)
          if (!waitingForTelemetry || attempt === 3) throw error
          await waitMs(2500)
        }
      }
      if (!result)
        throw new Error(
          en
            ? 'Cannot capture reference image.'
            : 'Không thể chụp ảnh tham chiếu.',
        )
      const distance =
        result.distanceMeters == null ? null : Math.round(result.distanceMeters)
      setLastCommand(
        en
          ? `Reference image saved${distance == null ? '' : ` (${distance} m from drone)`}.`
          : `Đã lưu ảnh tham chiếu${distance == null ? '' : ` · cách drone ${distance} m`}.`,
      )
    } catch (error) {
      setLastCommand(
        error instanceof Error && error.message
          ? error.message
          : en
            ? 'Cannot capture reference image.'
            : 'Không thể chụp ảnh tham chiếu.',
      )
    } finally {
      referenceBusyRef.current = false
      setReferenceBusy(false)
    }
  }, [
    normalFlightAllowed,
    controlStatus?.missionId,
    controlStatus?.deviceId,
    drone.id,
    mission.backendId,
    mission.id,
  ])
  const handleCommand = useCallback(
    (command: FlightCommand) => {
      if (command === 'lidar_monitor_toggle') {
        setLidarDetailsOpen((value) => !value)
        if (controlStatus?.lidar?.enabled === true) {
          setLastCommand(t.status.lidarToggled)
          return
        }
      }
      void sendCommand(command)
    },
    [controlStatus?.lidar?.enabled, sendCommand, t],
  )
  const handleWeatherPreset = useCallback(
    async (preset: WeatherPreset) => {
      setLastCommand(
        t.status.settingWeather(preset.replaceAll('_', ' ').toLowerCase()),
      )
      try {
        const response = await fetch(`${controlBaseUrl}/api/control/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'weather_set', preset }),
        })
        const payload = await response.json()
        const weather = payload.weather as
          { status?: string; weatherLabel?: string } | undefined
        if (!response.ok || !weather) throw new Error(`HTTP ${response.status}`)
        const label = weather?.weatherLabel ?? preset.replaceAll('_', ' ')
        const status = weather?.status ?? 'UPDATED'
        setLastCommand(
          payload.ok === false
            ? t.status.weatherPending(label, status)
            : t.status.weatherUpdated(label, status),
        )
        setIsOnline(true)
      } catch {
        setLastCommand(t.status.weatherOffline)
        setIsOnline(false)
      }
    },
    [t],
  )
  const handlePreflightReady = useCallback(async () => {
    if (!normalFlightAllowed)
      throw new Error('Mission đang dừng hoặc chưa có quyền bay.')
    await onPreflightReady?.()
    try {
      window.localStorage.setItem(preflightStorageKey, 'true')
    } catch {
      // Ignore storage failures; the current screen can still continue.
    }
    setPreflightReady(true)
    setLastCommand(t.status.preflightCompleted)
  }, [normalFlightAllowed, onPreflightReady, preflightStorageKey, t])
  return {
    handleReviewMedia,
    handleStartFlight,
    handleFinishFlight,
    handleReferenceCapture,
    handleCommand,
    handleWeatherPreset,
    handlePreflightReady,
  }
}
