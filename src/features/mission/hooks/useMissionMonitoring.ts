import { useCallback, useRef } from 'react'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { missionApi } from '../api/missionApi'
import { checklistExecutionApi } from '../api/checklistExecutionApi'
import { ApiError } from '../../../shared/api/httpClient'
import { useMissionWorkspaceUpdates } from '../realtime/useMissionWorkspaceUpdates'
import type { WorkspaceComponent } from '../realtime/missionWorkspaceUpdates'

const monitoredComponents = ['checklist', 'result', 'permissions'] as const
type MonitoringData = {
  checklist: Awaited<
    ReturnType<typeof checklistExecutionApi.getMissionChecklistExecutions>
  >
  result: Awaited<ReturnType<typeof missionApi.getMissionResult>>
  permissions: Awaited<ReturnType<typeof missionApi.getPermissions>>
}

type MissionMonitoringOptions = {
  autoRefresh?: boolean
}

/** Revalidate only changed sections; manual retries still fetch a complete authorization snapshot. */
export function useMissionMonitoring(
  missionId: string,
  revision?: unknown,
  options: MissionMonitoringOptions = {},
) {
  const { autoRefresh = true } = options
  const cached = useRef<
    { missionId: string; revision: unknown; data: MonitoringData } | undefined
  >(undefined)
  const dirty = useRef(new Set<WorkspaceComponent>())
  const query = useApiQuery(
    async (signal) => {
      const previous =
        cached.current?.missionId === missionId &&
        Object.is(cached.current.revision, revision)
          ? cached.current.data
          : undefined
      const all = !previous || dirty.current.size === 0
      const parts = new Set(dirty.current)
      const [checklist, result, permissions] = await Promise.all([
        all || parts.has('checklist')
          ? checklistExecutionApi.getMissionChecklistExecutions(
              missionId,
              signal,
            )
          : previous!.checklist,
        all || parts.has('result')
          ? missionApi.getMissionResult(missionId, signal)
          : previous!.result,
        all || parts.has('permissions')
          ? missionApi.getPermissions(missionId)
          : previous!.permissions,
      ])
      if (!permissions || typeof permissions !== 'object')
        throw new ApiError('Mission permissions unavailable', {
          code: 'MISSION_PERMISSIONS_UNAVAILABLE',
          status: 503,
          method: 'GET',
          path: `/api/missions/${missionId}/permissions`,
        })
      if (
        checklist.missionId !== missionId ||
        (result && result.missionId !== missionId)
      )
        throw new ApiError('Invalid Mission monitoring scope', {
          code: 'CHECKLIST_EXECUTION_PARENT_MISMATCH',
          status: 409,
          method: 'GET',
          path: `/api/missions/${missionId}`,
        })
      const data = { checklist, result, permissions }
      if (!signal.aborted) {
        cached.current = { missionId, revision, data }
        dirty.current.clear()
      }
      return data
    },
    [missionId, revision],
  )

  useMissionWorkspaceUpdates(
    missionId,
    monitoredComponents,
    (changed) => {
      changed.forEach((part) => dirty.current.add(part))
      query.reload()
    },
    autoRefresh,
  )
  const reload = useCallback(() => {
    monitoredComponents.forEach((part) => dirty.current.add(part))
    query.reload()
  }, [query.reload])
  return {
    ...query,
    data:
      query.data?.checklist.missionId === missionId ? query.data : undefined,
    reload,
  }
}
