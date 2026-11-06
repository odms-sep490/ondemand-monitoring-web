// MNG-09: 3D drone room and mission assignment workspace.
import { useEffect, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd'

import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { dronesApi } from '../../api/dronesApi'
import { managerHref } from '../../routes'
import { PageHeader } from '../../components/common/PageHeader'
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
    <div className="mgr-view mgr-drones">
      <PageHeader
        title={t.workspace.room}
        description={t.workspace.roomDescription}
        actions={
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={query.loading || Boolean(query.error)}
              onClick={() => setCreatingDrone(true)}
            >
              {t.create}
            </Button>
          </Space>
        }
      />

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
