import { useState } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { missionApi } from '../../../mission/api/missionApi'
import { flightControlApi } from '../../api/flightControlApi'
import { useActiveMission } from '../../api/useActiveMission'
import { formatDeviceLabel } from '../../lib/deviceLabel'
import { operatorHref } from '../../routes'
import { ConnectStatusPanel } from './components/ConnectStatusPanel'
import { FlightStepHeader } from '../../components/common/FlightStepper'
import { connectDronePageMessages } from './ConnectDronePage.messages'
import { DroneChip } from './components/DroneChip'
import { type ConnectState } from './connectTypes'
import { ConnectForm } from './components/ConnectForm'
import { ConnectMissionSummary } from './components/ConnectMissionSummary'
import './ConnectDronePage.css'

/** OPR-04W — Kết nối thiết bị và trạng thái kết nối. */
export function ConnectDronePage({ missionId }: { missionId?: string }) {
  const mission = useActiveMission(missionId)
  const { t } = useI18n(connectDronePageMessages)
  const [state, setState] = useState<ConnectState>('default')
  const [gcsId, setGcsId] = useState(t.gcsOptions[0])
  const [error, setError] = useState<string | null>(null)
  const deviceLabel = mission.data ? formatDeviceLabel(mission.data) : null

  async function handleConnect() {
    setState('connecting')
    setError(null)
    try {
      const data = mission.data
      const deviceId = data?.deviceId
      if (!mission.missionId || !deviceId) throw new Error(t.noMissionAssigned)
      await flightControlApi.bindSession(mission.missionId, deviceId)
      if (
        data?.status === 'PENDING_CONFIRMATION' ||
        data?.status === 'PLANNING' ||
        data?.status === 'READY'
      )
        await missionApi.connectGcs(mission.missionId)
      setState('connected')
      window.location.hash = operatorHref({
        screen: 'preflight',
        missionId: mission.missionId,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.connectFailed)
      setState('failed')
    }
  }

  return (
    <div className="odm-card connect-drone-page">
      <FlightStepHeader
        title={t.stepTitle}
        missionId={
          mission.data?.missionCode ?? mission.missionId ?? t.noMissionSelected
        }
        active={2}
        right={<DroneChip label={deviceLabel ?? t.noDroneAssigned} />}
      />
      <div className="connect-drone-page__body">
        <div className="connect-drone-page__layout">
          <div className="connect-drone-page__primary">
            <ConnectMissionSummary mission={mission.data} />
            <ConnectForm
              state={state}
              gcsId={gcsId}
              onGcsChange={setGcsId}
              onConnect={handleConnect}
            />
          </div>
          <ConnectStatusPanel
            state={state}
            error={error}
            missionId={mission.data?.id}
          />
        </div>
      </div>
    </div>
  )
}
