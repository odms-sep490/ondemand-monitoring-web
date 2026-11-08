import { useCallback, useEffect, useRef, useState } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { missionApi } from '../../../mission/api/missionApi'
import { flightControlApi } from '../../api/flightControlApi'
import type { MissionPermissions } from '../../../mission/types/permissions'
import {
  getActiveMissionId,
  markActiveMissionFlowStep,
  setActiveMissionId,
  toFlightDrone,
  toFlightMission,
  type BackendMission,
} from '../../api/liveMission'
import InFlightControlScreen from './components/InFlightControl'
import { operatorHref } from '../../routes'
import { flightPageMessages } from './FlightPage.messages'
import { missionIdFromCurrentFlightHash } from './flightHelpers'
import { FlightOpeningShell } from './components/FlightOpeningShell'
import { FlightEmptyState } from './components/FlightEmptyState'

export function FlightPage({
  missionId: routeMissionId,
}: {
  missionId?: string
}) {
  const missionId =
    routeMissionId ?? missionIdFromCurrentFlightHash() ?? getActiveMissionId()
  const [mission, setMission] = useState<BackendMission | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<MissionPermissions | null>(
    null,
  )
  const loadedMissionIdRef = useRef<string | null>(null)
  const failureRequestedRef = useRef(false)
  const failureWasAirborneRef = useRef(false)
  const manualLandingConfirmedRef = useRef(false)
  const postflightStartedRef = useRef(false)
  const pageActiveRef = useRef(true)
  const autoStart =
    window.sessionStorage.getItem('odm.operator.autoStartSimulation') === 'true'
  const { t } = useI18n(flightPageMessages)

  useEffect(() => {
    pageActiveRef.current = true
    return () => {
      pageActiveRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!missionId) return
    if (loadedMissionIdRef.current !== missionId) {
      loadedMissionIdRef.current = null
    }
    let active = true
    let timer: number | undefined
    const refresh = async () => {
      try {
        const [result, access] = await Promise.all([
          missionApi.getMissionById(missionId),
          missionApi.getPermissions(missionId),
        ])
        if (active) {
          loadedMissionIdRef.current = missionId
          setMission(result as BackendMission)
          if ((result as BackendMission).failureRequestedAt)
            failureRequestedRef.current = true
          setPermissions(access)
          setError(null)
        }
      } catch {
        if (active && loadedMissionIdRef.current !== missionId) {
          setPermissions(null)
          setError(t.loadMissionFailed)
        }
      } finally {
        if (active) timer = window.setTimeout(() => void refresh(), 2000)
      }
    }
    void refresh()
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [missionId, t.loadMissionFailed])

  const startPostflight = useCallback(async () => {
    if (!missionId || !pageActiveRef.current || postflightStartedRef.current) return
    postflightStartedRef.current = true
    try {
      await missionApi.startPostflight(missionId)
      setActiveMissionId(missionId)
      window.location.hash = operatorHref({ screen: 'postflight', missionId })
    } catch (cause) {
      postflightStartedRef.current = false
      window.alert(cause instanceof Error ? cause.message : t.rtbFailed)
    }
  }, [missionId, t.rtbFailed])

  const handleFailureLanded = useCallback(() => {
    if (!failureRequestedRef.current || !missionId) return
    const message =
      window.navigator.language.toLowerCase().startsWith('vi')
        ? 'Xác nhận drone đã hạ cánh hoàn toàn và động cơ đã dừng? Hệ thống sẽ mở kiểm tra sau bay.'
        : 'Confirm the drone has fully landed and the motors have stopped? Postflight inspection will open.'
    if (!window.confirm(message)) return
    manualLandingConfirmedRef.current = true
    void missionApi
      .markReturning(missionId)
      .then(startPostflight)
      .catch((cause) =>
        window.alert(cause instanceof Error ? cause.message : t.rtbFailed),
      )
  }, [missionId, startPostflight, t.rtbFailed])

  if (!missionId) {
    return <FlightOpeningShell />
  }
  if (error) {
    return (
      <FlightEmptyState
        tone="error"
        title={t.cockpitOpenFailed}
        message={error}
        primaryLabel={t.backToMission}
      />
    )
  }
  if (!mission || mission.id !== missionId) {
    return <FlightOpeningShell />
  }
  if (!mission.deviceId) {
    return (
      <FlightEmptyState
        tone="error"
        title={t.noDroneTitle}
        message={t.noDroneMessage}
      />
    )
  }

  return (
    <InFlightControlScreen
      mission={toFlightMission(mission)}
      drone={toFlightDrone(mission)}
      normalFlightAllowed={
        permissions?.canControlFlight === true && mission.status === 'IN_PROGRESS'
      }
      autoStartPlan={autoStart}
      onAutoStartPlanConsumed={() =>
        window.sessionStorage.removeItem('odm.operator.autoStartSimulation')
      }
      onReviewMedia={() => {
        setActiveMissionId(mission.id)
        markActiveMissionFlowStep(mission.id, 5)
        window.location.hash = operatorHref({
          screen: 'checklist',
          missionId: mission.id,
        })
      }}
      onFailureRequested={async (reason, wasAirborne) => {
        const updated = await missionApi.requestMissionFailure(mission.id, reason)
        failureRequestedRef.current = true
        failureWasAirborneRef.current = wasAirborne
        setMission((current) =>
          current
            ? { ...current, ...(updated as unknown as BackendMission) }
            : current,
        )
      }}
      onFailureLanded={handleFailureLanded}
      onRTB={async () => {
        try {
          await missionApi.markReturning(mission.id)
          if (failureRequestedRef.current) {
            while (
              pageActiveRef.current &&
              !manualLandingConfirmedRef.current &&
              !postflightStartedRef.current
            ) {
              const status = await flightControlApi.status().catch(() => null)
              const controllerMatches =
                !status?.missionId || status.missionId === mission.id
              if (status?.online && controllerMatches && status.inAir === true)
                failureWasAirborneRef.current = true
              if (
                failureWasAirborneRef.current &&
                status?.online &&
                controllerMatches &&
                status.inAir === false
              )
                break
              await new Promise<void>((resolve) =>
                window.setTimeout(resolve, 1200),
              )
            }
          }
          if (!pageActiveRef.current) return
          await startPostflight()
        } catch (cause) {
          window.alert(cause instanceof Error ? cause.message : t.rtbFailed)
        }
      }}
      onEmergency={() => {
        const reason =
          window.navigator.language.toLowerCase().startsWith('vi')
            ? 'Dừng khẩn cấp khi đang thực hiện'
            : 'Emergency stop during flight'
        void missionApi
          .requestMissionFailure(mission.id, reason)
          .then((updated) => {
            failureRequestedRef.current = true
            setMission((current) =>
              current
                ? { ...current, ...(updated as unknown as BackendMission) }
                : current,
            )
          })
          .catch((cause) =>
            window.alert(
              cause instanceof Error ? cause.message : t.emergencyUpdateFailed,
            ),
          )
      }}
    />
  )
}
