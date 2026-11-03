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
import { deliveryApi } from '../../../delivery/api'
import { useI18n } from '../../../../shared/i18n'
import { missionCreatePageMessages } from './MissionCreatePage.messages'

/**
 * Shared mission creation for approved Orders and authorized rework on completed Orders.
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
  reworkCaseId,
}: {
  orderId: string
  initialBrief?: OrderMissionBrief
  now?: Date
  onCreated?: (missionId: string) => void
  reworkCaseId?: string
}) {
  const { t } = useI18n(missionCreatePageMessages)
  const [now] = useState(() => nowProp ?? new Date())
  const briefQuery = useApiQuery(
    async (signal) => {
      const [brief, reworkCase] = await Promise.all([
        initialBrief
          ? Promise.resolve(initialBrief)
          : reworkCaseId
            ? ordersApi.getOrderForMission(orderId, signal, 'REWORK')
            : ordersApi.getOrderForMission(orderId, signal),
        reworkCaseId
          ? deliveryApi.managerGetRevisionCase(orderId, signal)
          : Promise.resolve(null),
      ])
      if (
        reworkCaseId &&
        (!reworkCase ||
          reworkCase.orderId !== orderId ||
          reworkCase.caseId !== reworkCaseId ||
          !reworkCase.active ||
          reworkCase.status !== 'OPEN')
      )
        throw new Error(t.reworkUnavailable)
      return { brief, reworkCase }
    },
    [orderId, initialBrief, reworkCaseId],
  )

  const content = briefQuery.loading ? (
    <CreateMissionSkeleton />
  ) : briefQuery.error || !briefQuery.data ? (
    <CreateMissionErrorState error={briefQuery.error} />
  ) : (
    <CreateMissionForm
      key={orderId}
      orderId={orderId}
      brief={briefQuery.data.brief}
      reworkCase={briefQuery.data.reworkCase ?? undefined}
      now={now}
      onCreated={onCreated}
    />
  )

  return content
}
