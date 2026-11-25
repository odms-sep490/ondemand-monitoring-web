// MNG-09: 3D drone room and mission assignment workspace.
import { useEffect, useMemo, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { dronesApi } from '../../api/dronesApi'
import { managerHref } from '../../routes'
import type { DeviceResponse } from '../../types/drones'
import { dronesPageMessages } from './DronesPage.messages'
import '../../manager.css'
import './drones.scss'
import './components/droneFleetRoom.scss'
import { DroneFleetRoom } from './components/DroneFleetRoom'
import { StatusChangeModal } from './components/StatusChangeModal'
import { CreateDroneModal } from './components/CreateDroneModal'

type DronesPageProps = {
  droneId?: string
  assignmentMissionId?: string
}

export function DronesPage({ droneId, assignmentMissionId }: DronesPageProps) {
  const { t } = useI18n(dronesPageMessages)
  const [activeAssignmentMissionId, setActiveAssignmentMissionId] =
    useState(assignmentMissionId)
  const [changingDrone, setChangingDrone] = useState<DeviceResponse | null>(
    null,
  )
  const [creatingDrone, setCreatingDrone] = useState(false)
  const [drones, setDrones] = useState<DeviceResponse[] | null>(null)

  const query = useApiQuery((signal) => dronesApi.listDrones({ signal }), [])
  const allDrones = drones ?? query.data?.items ?? []

  const fleetCounts = useMemo(() => {
    let available = 0
    let inMission = 0
    let maintenance = 0
    for (const drone of allDrones) {
      const status = (drone.status ?? '').toUpperCase()
      if (status === 'AVAILABLE' || status === 'CHARGING') available += 1
      else if (
        status === 'ASSIGNED' ||
        status === 'RESERVED' ||
        status === 'PREFLIGHT' ||
        status === 'IN_FLIGHT' ||
        status === 'IN_MISSION'
      )
        inMission += 1
      else if (status === 'MAINTENANCE') maintenance += 1
    }
    return { total: allDrones.length, available, inMission, maintenance }
  }, [allDrones])

  useEffect(() => {
    setActiveAssignmentMissionId(assignmentMissionId)
  }, [assignmentMissionId])

  function handleAssignmentMissionChange(missionId?: string) {
    setActiveAssignmentMissionId(missionId)
    window.history.replaceState(
      window.history.state,
      '',
      managerHref({
        screen: 'drones',
        ...(droneId ? { droneId } : {}),
        ...(missionId ? { assignmentMissionId: missionId } : {}),
      }),
    )
  }

  function handleAssignmentChanged() {
    setDrones(null)
    query.reload()
  }

  function handleChanged(updated: DeviceResponse) {
    const base = drones ?? query.data?.items ?? []
    setDrones(base.map((drone) => (drone.id === updated.id ? updated : drone)))
    setChangingDrone(null)
  }

  function handleCreated(created: DeviceResponse) {
    const base = drones ?? query.data?.items ?? []
    setDrones([created, ...base])
    setCreatingDrone(false)
  }

  return (
    <div className="mgr-view mgr-drones mgr-drones-workspace">
      <header className="mgr-drone-room-topbar">
        <div className="mgr-drone-room-topbar-title">
          <h1>{t.workspace.room}</h1>
          {!query.loading && !query.error && (
            <div className="mgr-drone-room-kpi-pills" aria-label={t.subtitle(fleetCounts.total)}>
              <span className="mgr-drone-kpi-pill">
                <strong>{fleetCounts.total}</strong> {t.columns.device.toLowerCase()}
              </span>
              <span className="mgr-drone-kpi-pill is-available">
                <i aria-hidden="true" />
                <strong>{fleetCounts.available}</strong> {t.stats.available}
              </span>
              {fleetCounts.inMission > 0 && (
                <span className="mgr-drone-kpi-pill is-mission">
                  <i aria-hidden="true" />
                  <strong>{fleetCounts.inMission}</strong> {t.stats.inMission}
                </span>
              )}
              {fleetCounts.maintenance > 0 && (
                <span className="mgr-drone-kpi-pill is-maintenance">
                  <i aria-hidden="true" />
                  <strong>{fleetCounts.maintenance}</strong> {t.stats.maintenance}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mgr-drone-room-topbar-actions">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={query.loading || Boolean(query.error)}
            onClick={() => setCreatingDrone(true)}
          >
            {t.create}
          </Button>
        </div>
      </header>

      <DroneFleetRoom
        drones={allDrones}
        loading={query.loading}
        error={query.error}
        onRetry={query.reload}
        onChangeStatus={setChangingDrone}
        initialDroneId={droneId}
        assignmentMissionId={activeAssignmentMissionId}
        returnMissionId={assignmentMissionId}
        onMissionChange={handleAssignmentMissionChange}
        onAssignmentChanged={handleAssignmentChanged}
      />

      {changingDrone && (
        <StatusChangeModal
          drone={changingDrone}
          onClose={() => setChangingDrone(null)}
          onChanged={handleChanged}
        />
      )}

      {creatingDrone && (
        <CreateDroneModal
          onClose={() => setCreatingDrone(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
