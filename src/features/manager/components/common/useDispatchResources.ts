import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { missionApi } from '../../../mission/api/missionApi'
import { droneApi } from '../../../staff/api/droneApi'
import { operatorApi } from '../../../staff/api/operatorApi'
import type { OrderDispatchContext } from './liveDispatchTypes'

export function useDispatchResources({
  missionId,
  orderContext,
}: {
  missionId: string
  orderContext: OrderDispatchContext | undefined
}) {
  const mission = useApiQuery(
    () => missionApi.getMissionById(missionId),
    [missionId, orderContext?.scheduledStartAt, orderContext?.scheduledEndAt],
  )
  const currentMission =
    mission.data?.id === missionId ? mission.data : undefined
  const start = currentMission?.scheduledStartAt
  const end = currentMission?.scheduledEndAt
  const scope = JSON.stringify([missionId, start, end])
  const validWindow = Boolean(
    start && end && new Date(start).getTime() < new Date(end).getTime(),
  )
  const availability = useApiQuery(async () => {
    if (!validWindow) return null
    const [devices, people] = await Promise.all([
      droneApi.getAvailable(missionId),
      operatorApi.getAvailable(missionId),
    ])
    return { scope, devices, people }
  }, [scope, validWindow])
  const resourcesReady =
    !mission.loading &&
    !mission.error &&
    validWindow &&
    !availability.loading &&
    !availability.error &&
    availability.data?.scope === scope
  const drones = {
    data: resourcesReady ? availability.data?.devices : undefined,
    reload: availability.reload,
  }
  const operators = {
    data: resourcesReady ? availability.data?.people : undefined,
    reload: availability.reload,
  }
  return {
    mission,
    scope,
    validWindow,
    availability,
    resourcesReady,
    drones,
    operators,
  }
}
