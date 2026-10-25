import { useCallback } from 'react'
import type { FlightCommand } from './inFlightTypes'
import {
  maySendFlightCommand,
  missionHasSafeStop,
  missionMayTerminate,
} from '../../../mission/lib/missionOperationalState'
import { missionApi } from '../../../mission/api/missionApi'
import { getLanguage, useI18n } from '../../../../shared/i18n'
import { isInsideHcmcServiceArea } from '../../../../shared/lib/serviceArea'
import { buildExecutableFlightRoute } from './gpsRoutePlanner'
import { toControllerRouteWaypoints } from './planHelpers'
import { flightControlApi } from '../../api/flightControlApi'
import { captureSatelliteSnapshot } from './satelliteSnapshot'
import {
  controlBaseUrl,
  GPS_TARGET_CRUISE_SPEED_MPS,
} from './inFlightConstants'
import { inFlightControlMessages } from './components/InFlightControl.messages'
import type { Dispatch, SetStateAction } from 'react'
import type { Mission, Drone } from '../../types/omss'
import type { ControlStatus } from './inFlightTypes'
import type { RestrictedGpsZone } from './gpsRoutePlanner'

export function useFlightCommand({
  normalFlightAllowed,
  terminationAllowed,
  setLastCommand,
  operationalMessage,
  preflightReady,
  mission,
  controlStatus,
  restrictedGpsZones,
  setBusyCommand,
  drone,
  setIsOnline,
  onStartFlight,
  onRTB,
  onEmergency,
}: {
  normalFlightAllowed: boolean
  terminationAllowed: boolean
  setLastCommand: Dispatch<SetStateAction<string>>
  operationalMessage: string | undefined
  preflightReady: boolean
  mission: Mission
  controlStatus: ControlStatus | null
  restrictedGpsZones: RestrictedGpsZone[]
  setBusyCommand: Dispatch<SetStateAction<FlightCommand | null>>
  drone: Drone
  setIsOnline: Dispatch<SetStateAction<boolean>>
  onStartFlight: (() => Promise<void>) | undefined
  onRTB: () => void
  onEmergency: () => void
}) {
  const { t } = useI18n(inFlightControlMessages)
  const sendCommand = useCallback(
    async (command: FlightCommand) => {
      if (
        !maySendFlightCommand(command, normalFlightAllowed, terminationAllowed)
      ) {
        setLastCommand(
          operationalMessage ??
            'Chưa có quyền vận hành Mission. Làm mới trạng thái.',
        )
        return
      }
      if (!preflightReady && !terminationAllowed) {
        setLastCommand(t.status.preflightRequired)
        return
      }
      // Recheck exact Mission before dispatch; a cockpit may stay open across a stop request.
      try {
        const id = mission.backendId ?? mission.id
        const [current, access] = await Promise.all([
          missionApi.getMissionById(id),
          missionApi.getPermissions(id),
        ])
        if (
          !maySendFlightCommand(
            command,
            !missionHasSafeStop(current) && access.canControlFlight,
            missionMayTerminate(current, access.canTerminateFlight),
          )
        ) {
          setLastCommand(
            'Mission đang dừng hoặc chưa có quyền thực hiện lệnh này.',
          )
          return
        }
      } catch {
        setLastCommand('Không thể xác nhận quyền Mission. Chưa gửi lệnh.')
        return
      }
      const target =
        Number.isFinite(mission.lat) && Number.isFinite(mission.lng)
          ? { latitude: mission.lat, longitude: mission.lng }
          : null
      if (command === 'gps_target_start') {
        if (!target) {
          setLastCommand(
            getLanguage() === 'en'
              ? 'Mission has no GPS target'
              : 'Mission chưa có tọa độ GPS mục tiêu',
          )
          return
        }
        if (!isInsideHcmcServiceArea(target)) {
          setLastCommand(
            getLanguage() === 'en'
              ? 'Target is outside Ho Chi Minh City service area'
              : 'Mục tiêu nằm ngoài vùng phục vụ TP.HCM',
          )
          return
        }
      }
      let routeWaypoints: Array<{ latitude: number; longitude: number }> = []
      if (command === 'gps_target_start' && target) {
        const gpsRoute = buildExecutableFlightRoute(
          controlStatus?.positionGps ?? null,
          target,
          restrictedGpsZones,
        )
        routeWaypoints = toControllerRouteWaypoints(gpsRoute)
        if (routeWaypoints.length === 0) {
          setLastCommand(
            getLanguage() === 'en'
              ? 'Waiting for current GPS before starting route flight'
              : 'Chưa có GPS hiện tại để tạo đường bay né vùng cấm',
          )
          return
        }
      }
      const routePoints = (mission.routePoints ?? [])
        .slice()
        .sort((a, b) => a.sequence - b.sequence)
      if (command === 'auto_plan_start' && routePoints.length === 0) {
        setLastCommand(t.status.noWaypoints)
        return
      }
      setBusyCommand(command)
      try {
        const missionKey = mission.backendId ?? mission.id
        if (
          // Bind on the ground too (takeoff), so the session already belongs to this
          // mission before the drone is airborne and "Fly to point" never needs a mid-air switch.
          // Photo / video also bind on demand instead of failing when the status poll is stale.
          (command === 'gps_target_start' ||
            command === 'takeoff' ||
            command === 'photo' ||
            command === 'video_toggle') &&
          (controlStatus?.missionId !== missionKey ||
            controlStatus?.deviceId !== drone.id)
        ) {
          setLastCommand(
            getLanguage() === 'en'
              ? 'Binding drone controller...'
              : 'Đang kết nối bộ điều khiển drone...',
          )
          await flightControlApi.bindSession(missionKey, drone.id)
        }
        if (command === 'photo') {
          // The cockpit camera is satellite imagery, so capture exactly that view in the browser
          // and hand it to the controller's local media library for review/upload.
          const gps = controlStatus?.positionGps
          if (gps) {
            const altitudeForView =
              gps.relativeAltitudeM ?? controlStatus?.altitudeM ?? null
            const stamp = new Date()
            const blob = await captureSatelliteSnapshot({
              latitude: gps.latitude,
              longitude: gps.longitude,
              heading: controlStatus?.yawDeg ?? null,
              altitudeM: altitudeForView,
              caption: `${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}  ALT ${altitudeForView === null ? '--' : Math.round(altitudeForView)}m  ${stamp.toLocaleTimeString()}`,
            })
            const upload = await fetch(
              `${controlBaseUrl}/api/media/local/capture`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'image/jpeg',
                  'X-Media-Source-Type': 'SATELLITE_SNAPSHOT',
                },
                body: blob,
              },
            )
            if (!upload.ok) {
              const payload = (await upload.json().catch(() => null)) as {
                error?: string
              } | null
              throw new Error(payload?.error ?? `HTTP ${upload.status}`)
            }
            setLastCommand(
              getLanguage() === 'en'
                ? 'Photo saved — open Review to approve it'
                : 'Đã chụp ảnh — bấm Xem lại để duyệt và upload',
            )
            setIsOnline(true)
            return
          }
        }
        const currentAltitudeM =
          controlStatus?.positionGps?.relativeAltitudeM ??
          controlStatus?.altitudeM
        const targetAltitudeM =
          typeof currentAltitudeM === 'number' &&
          Number.isFinite(currentAltitudeM)
            ? Math.max(8, Math.min(50, currentAltitudeM))
            : 25
        const response = await fetch(`${controlBaseUrl}/api/control/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command,
            ...(command === 'auto_plan_start'
              ? {
                  missionId: missionKey,
                  waypoints: routePoints.map((point) => ({
                    sequence: point.sequence,
                    simX: point.simX,
                    simY: point.simY,
                    altitudeM: point.altitudeM,
                    speedMps: point.speedMps,
                    reason: point.reason,
                  })),
                }
              : {}),
            ...(command === 'gps_target_start' && target
              ? {
                  missionId: missionKey,
                  latitude: target.latitude,
                  longitude: target.longitude,
                  relativeAltitudeM: targetAltitudeM,
                  speedMps: GPS_TARGET_CRUISE_SPEED_MPS,
                  routeWaypoints: routeWaypoints.map((point, index) => ({
                    sequence: index,
                    latitude: point.latitude,
                    longitude: point.longitude,
                    relativeAltitudeM: targetAltitudeM,
                  })),
                }
              : {}),
          }),
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string
          } | null
          throw new Error(payload?.error ?? `HTTP ${response.status}`)
        }
        setLastCommand(
          command === 'auto_plan_start'
            ? t.status.autoPlanStarted(routePoints.length)
            : command === 'gps_target_start'
              ? getLanguage() === 'en'
                ? 'GPS target flight started'
                : 'Đã bắt đầu bay tới mục tiêu GPS'
              : command === 'camera_front'
                ? t.status.cameraReset
                : t.status.commandSent(command.replaceAll('_', ' ')),
        )
        setIsOnline(true)

        // Keep the business mission lifecycle in sync with the real flight.
        // Both a direct takeoff and "Fly to point" begin an actual flight, so
        // neither command may leave Inspector screens stuck at READY_TO_FLY.
        if (
          (command === 'takeoff' || command === 'gps_target_start') &&
          onStartFlight
        ) {
          const latestMission = await missionApi.getMissionById(missionKey)
          if (latestMission.status === 'READY_TO_FLY') await onStartFlight()
        }

        if (command === 'return_to_base') onRTB()
        if (command === 'emergency_stop') onEmergency()
      } catch (cause) {
        setLastCommand(
          cause instanceof TypeError
            ? t.status.controllerOffline
            : cause instanceof Error
              ? cause.message
              : t.status.controllerOffline,
        )
        if (cause instanceof TypeError) setIsOnline(false)
      } finally {
        setBusyCommand(null)
      }
    },
    [
      controlStatus?.deviceId,
      controlStatus?.altitudeM,
      controlStatus?.missionId,
      controlStatus?.positionGps,
      drone.id,
      mission.backendId,
      mission.id,
      mission.lat,
      mission.lng,
      mission.routePoints,
      onEmergency,
      onRTB,
      onStartFlight,
      normalFlightAllowed,
      terminationAllowed,
      operationalMessage,
      preflightReady,
      restrictedGpsZones,
      t,
    ],
  )
  return { sendCommand }
}
