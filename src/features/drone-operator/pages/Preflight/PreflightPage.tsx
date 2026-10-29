import { Alert } from 'antd'
import { useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { missionApi } from '../../../mission/api/missionApi'
import { flightControlApi } from '../../api/flightControlApi'
import { useActiveMission } from '../../api/useActiveMission'
import { formatDeviceLabel } from '../../lib/deviceLabel'
import { backendPreflightTokenStorageKey } from '../../lib/flightWorkflowStorage'
import { operatorHref } from '../../routes'
import { preflightPageMessages } from './PreflightPage.messages'
import { NO_MISSION_SENTINEL, NO_DRONE_SENTINEL } from './preflightConstants'
import { isMissionInFlight, demoFlightToken } from './preflightHelpers'
import { PreflightChecklistPanel } from './components/PreflightChecklistPanel'

export function PreflightPage({ missionId }: { missionId?: string }) {
  const mission = useActiveMission(missionId)
  const { t } = useI18n(preflightPageMessages)
  const [startError, setStartError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  async function handleContinueToHandover() {
    const data = mission.data
    const deviceId = data?.deviceId
    if (!mission.missionId || !deviceId) {
      setStartError(t.noDroneAssignedError)
      return
    }
    setStarting(true)
    setStartError(null)
    try {
      const permissions = await missionApi.getPermissions(mission.missionId)
      if (!permissions.canOperatePayload)
        throw new Error('Operator assignment is required for preflight.')
      if (isMissionInFlight(data?.status)) {
        if (permissions.canControlFlight) {
          window.sessionStorage.setItem(
            'odm.operator.autoStartSimulation',
            'true',
          )
        }
        window.location.hash = operatorHref({
          screen: permissions.canControlFlight ? 'flight' : 'missionDetail',
          missionId: mission.missionId,
        })
        return
      }
      await flightControlApi.bindSession(mission.missionId, deviceId)
      const completedPreflight =
        data?.status === 'READY_TO_FLY'
          ? null
          : await missionApi.runPreflightCheck(mission.missionId, deviceId)
      const tokenValue =
        completedPreflight?.flightToken?.tokenValue ??
        window.sessionStorage.getItem(
          backendPreflightTokenStorageKey(mission.missionId, deviceId),
        ) ??
        demoFlightToken(mission.missionId, deviceId)
      window.sessionStorage.setItem(
        backendPreflightTokenStorageKey(mission.missionId, deviceId),
        tokenValue,
      )
      window.location.hash = operatorHref({
        screen: 'handover',
        missionId: mission.missionId,
      })
    } catch (cause) {
      setStartError(
        cause instanceof Error ? cause.message : t.confirmPrecheckFailed,
      )
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="stf-stack">
      {(mission.error || startError) && (
        <Alert
          type="error"
          showIcon
          message={
            startError ??
            (mission.error instanceof Error
              ? mission.error.message
              : t.loadMissionFailed)
          }
        />
      )}
      {starting && (
        <Alert type="info" showIcon message={t.confirmingTelemetry} />
      )}
      <PreflightChecklistPanel
        missionId={mission.missionId ?? NO_MISSION_SENTINEL}
        missionLabel={
          mission.data?.missionCode ?? mission.missionId ?? t.noMissionSelected
        }
        deviceId={mission.data?.deviceId ?? NO_DRONE_SENTINEL}
        deviceLabel={
          mission.data
            ? (formatDeviceLabel(mission.data) ?? undefined)
            : undefined
        }
        missionStatus={mission.data?.status}
        latitude={mission.data?.latitude ?? undefined}
        longitude={mission.data?.longitude ?? undefined}
        onReady={() => {
          void handleContinueToHandover()
        }}
      />
    </div>
  )
}
