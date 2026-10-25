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

/** OPR-04W — Kết nối thiết bị: token/gcs form + trạng thái kết nối. */
export function ConnectDronePage({ missionId }: { missionId?: string }) {
  const mission = useActiveMission(missionId)
  const { t } = useI18n(connectDronePageMessages)
  const [state, setState] = useState<ConnectState>('default')
  const [token, setToken] = useState(t.tokenPlaceholder)
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
      if (data?.status === 'SCHEDULED')
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
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title={t.stepTitle}
        missionId={
          mission.data?.missionCode ?? mission.missionId ?? t.noMissionSelected
        }
        active={2}
        right={<DroneChip label={deviceLabel ?? t.noDroneAssigned} />}
      />
      <div style={{ padding: '18px 22px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,1fr)',
            gap: 18,
            alignItems: 'start',
          }}
        >
          <ConnectForm
            state={state}
            token={token}
            gcsId={gcsId}
            onTokenChange={setToken}
            onGcsChange={setGcsId}
            onConnect={handleConnect}
            onRetryExpired={() => setState('default')}
          />
          <ConnectStatusPanel
            state={state}
            error={error}
            mission={mission.data}
          />
        </div>
      </div>
    </div>
  )
}
