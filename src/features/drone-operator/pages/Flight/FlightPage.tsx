import { useEffect, useState } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { missionApi } from '../../../mission/api/missionApi'
import type { MissionPermissions } from '../../../mission/types/permissions'
import {
  missionHasSafeStop,
  missionStopLabel,
  missionMayTerminate,
} from '../../../mission/lib/missionOperationalState'
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
  const autoStart =
    window.sessionStorage.getItem('odm.operator.autoStartSimulation') === 'true'
  const { t } = useI18n(flightPageMessages)

  useEffect(() => {
    if (!missionId) return
    let active = true
    let timer: number | undefined
    const refresh = async () => {
      try {
        const [result, access] = await Promise.all([
          missionApi.getMissionById(missionId),
          missionApi.getPermissions(missionId),
        ])
        if (active) {
          setMission(result as BackendMission)
          setPermissions(access)
          setError(null)
        }
      } catch {
        if (active) {
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
        !missionHasSafeStop(mission) && permissions?.canControlFlight === true
      }
      terminationAllowed={missionMayTerminate(
        mission,
        permissions?.canTerminateFlight,
      )}
      operationalMessage={missionStopLabel(mission) ?? undefined}
      autoStartPlan={autoStart && !missionHasSafeStop(mission)}
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
      onRTB={() => {
        void missionApi
          .markReturning(mission.id)
          .then(async (returned) => {
            if (missionHasSafeStop(mission)) {
              // RTL is a return command, not evidence that the drone has landed.
              setMission(returned as BackendMission)
              return
            }
            await missionApi.startPostflight(mission.id)
            setActiveMissionId(mission.id)
            window.location.hash = operatorHref({
              screen: 'postflight',
              missionId: mission.id,
            })
          })
          .catch((cause) =>
            setError(cause instanceof Error ? cause.message : t.rtbFailed),
          )
      }}
      onEmergency={() => {
        const reason = window.prompt(t.emergencyPrompt)
        if (!reason?.trim()) return
        void missionApi
          .failMission(mission.id, reason.trim())
          .catch((cause) =>
            setError(
              cause instanceof Error ? cause.message : t.emergencyUpdateFailed,
            ),
          )
      }}
    />
  )
}
