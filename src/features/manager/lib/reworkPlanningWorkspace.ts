import type { ResultRevisionCase } from '../../delivery/api'
import type { OrderDetail } from '../types/orders'
import type { MissionResponse } from '../types/missions'
import type {
  ChecklistAssignmentSelection,
  ExecutionPlan,
} from '../types/planning'

/** A read projection of this case's rework; never changes the original Order plan. */
export function reworkPlanningWorkspace(
  order: OrderDetail,
  plan: ExecutionPlan,
  missions: MissionResponse[],
  revisionCase: ResultRevisionCase,
  selections: ChecklistAssignmentSelection[],
) {
  const ids = new Set(
    revisionCase.items
      .filter(
        (item) =>
          item.scopeDecision === 'IN_SCOPE' && item.strategy === 'REWORK',
      )
      .map((item) => item.orderChecklistItemId),
  )
  const items = (order.checklistItems ?? []).filter((item) => ids.has(item.id))
  const related = missions.filter(
    (mission) =>
      mission.orderId === order.id &&
      mission.purpose === 'REWORK' &&
      mission.resultRevisionCaseId === revisionCase.caseId,
  )
  const scopes = related.map((mission) => {
    const selected = selections.find(
      (selection) => selection.missionId === mission.id,
    )
    const checklistItemIds = (selected?.assignments ?? [])
      .filter((item) => item.active && ids.has(item.orderChecklistItemId))
      .map((item) => item.orderChecklistItemId)
    return {
      missionId: mission.id,
      scopeLabel: mission.scopeLabel ?? mission.missionCode,
      assignmentCount: checklistItemIds.length,
      checklistItemIds,
    }
  })
  const occurrences = scopes
    .filter(
      (scope) =>
        !['FAILED', 'CANCELLED'].includes(
          related.find((mission) => mission.id === scope.missionId)!.status,
        ),
    )
    .flatMap((scope) => scope.checklistItemIds)
  const covered = new Set(occurrences)
  const uncoveredItemIds = items
    .filter((item) => !covered.has(item.id))
    .map((item) => item.id)
  return {
    order: { ...order, checklistItems: items },
    missions: related,
    plan: {
      ...plan,
      planStatus:
        related.some(
          (mission) => !['FAILED', 'CANCELLED'].includes(mission.status),
        ) && !related.some((mission) => mission.status === 'PLANNING')
          ? 'FINALIZED'
          : 'DRAFT',
      missions: scopes,
      blockers: [],
      coverage: {
        total: items.length,
        covered: items.length - uncoveredItemIds.length,
        uncovered: uncoveredItemIds.length,
        repeated: occurrences.length - covered.size,
        coverageReady: uncoveredItemIds.length === 0,
        uncoveredItemIds,
      },
    } satisfies ExecutionPlan,
  }
}
