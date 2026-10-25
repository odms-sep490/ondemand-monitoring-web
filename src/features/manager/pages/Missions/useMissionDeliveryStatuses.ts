import { useEffect } from 'react'
import { deliveryApi } from '../../../delivery/api'
import type { DeliveryStatus as WorkflowDeliveryStatus } from '../../../delivery/types'
import { missionsApi } from '../../api/missionsApi'
import type { DeliveryStatus } from './missionsTypes'
import type { MissionCalendarItem } from '../../types/missions'
import type { Dispatch, SetStateAction } from 'react'

export function useMissionDeliveryStatuses({
  missions,
  setOrderDeliveryStatuses,
  setDeliveryStatuses,
  missionId,
  setSelectedMission,
}: {
  missions: MissionCalendarItem[]
  setOrderDeliveryStatuses: Dispatch<
    SetStateAction<Record<string, WorkflowDeliveryStatus>>
  >
  setDeliveryStatuses: Dispatch<SetStateAction<Record<string, DeliveryStatus>>>
  missionId: string | undefined
  setSelectedMission: Dispatch<SetStateAction<string | null>>
}) {
  useEffect(() => {
    let cancelled = false
    const orderIds = [...new Set(missions.map((m) => m.orderId))]
    void Promise.allSettled(
      orderIds.map(
        async (orderId) =>
          [
            orderId,
            (await deliveryApi.managerGet(orderId)).deliveryStatus,
          ] as const,
      ),
    ).then((results) => {
      if (cancelled) return
      const next: Record<string, WorkflowDeliveryStatus> = {}
      results.forEach((result) => {
        if (result.status === 'fulfilled')
          next[result.value[0]] = result.value[1]
      })
      setOrderDeliveryStatuses(next)
    })
    return () => {
      cancelled = true
    }
  }, [missions])

  useEffect(() => {
    const completed = missions.filter(
      (mission) => mission.status === 'COMPLETED',
    )
    if (completed.length === 0) {
      setDeliveryStatuses({})
      return
    }

    let cancelled = false
    setDeliveryStatuses((previous) => {
      const next = { ...previous }
      for (const mission of completed) {
        if (!next[mission.id]) next[mission.id] = 'LOADING'
      }
      return next
    })

    void Promise.allSettled(
      completed.map(async (mission) => {
        try {
          const result = await missionsApi.getMissionResult(mission.id)
          return [mission.id, result?.approvalStatus ?? 'NO_RESULT'] as const
        } catch {
          return [mission.id, 'NOT_READY'] as const
        }
      }),
    ).then((results) => {
      if (cancelled) return
      setDeliveryStatuses((previous) => {
        const next: Record<string, DeliveryStatus> = {}
        const visibleIds = new Set(missions.map((mission) => mission.id))
        for (const [missionId, status] of Object.entries(previous)) {
          if (visibleIds.has(missionId)) next[missionId] = status
        }
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const [missionId, status] = result.value
            next[missionId] = status
          }
        })
        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [missions])

  useEffect(() => {
    if (missionId && missions.length > 0) {
      setSelectedMission(missionId)
    }
  }, [missionId, missions])
}
