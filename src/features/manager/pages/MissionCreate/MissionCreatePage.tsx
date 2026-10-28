import { useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { ordersApi } from '../../api/ordersApi'
import type { OrderMissionBrief } from '../../types/orders'
import '../../manager.css'
import '../../components/common/missionPages.css'
import '../../components/common/planning.css'
import { CreateMissionSkeleton } from './components/CreateMissionSkeleton'
import { CreateMissionErrorState } from './components/CreateMissionErrorState'
import { CreateMissionForm } from './components/CreateMissionForm'

/**
 * MNG-04 "Tạo nhiệm vụ" — create-mission form for an already-APPROVED order.
 *
 * Phase 4 creates a planning-only Mission with copied Order scope and a
 * persisted retry key. It does not generate flight plans or enter dispatch.
 * Plan state/revision, not sibling count, determines planning eligibility.
 */
export function MissionCreatePage({
  orderId,
  initialBrief,
  now: nowProp,
  onCreated,
}: {
  orderId: string
  initialBrief?: OrderMissionBrief
  now?: Date
  onCreated?: (missionId: string) => void
}) {
  const [now] = useState(() => nowProp ?? new Date())
  const briefQuery = useApiQuery(
    (signal) =>
      initialBrief
        ? Promise.resolve(initialBrief)
        : ordersApi.getOrderForMission(orderId, signal),
    [orderId, initialBrief],
  )

  if (briefQuery.loading) return <CreateMissionSkeleton />
  if (briefQuery.error || !briefQuery.data) {
    return <CreateMissionErrorState error={briefQuery.error} />
  }

  return (
    <CreateMissionForm
      key={orderId}
      orderId={orderId}
      brief={briefQuery.data}
      now={now}
      onCreated={onCreated}
    />
  )
}
