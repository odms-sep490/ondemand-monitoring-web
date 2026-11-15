import { scopedMissionPlanningWorkspace } from './scopedMissionPlanningWorkspace'
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
  const related = missions.filter(
    (mission) =>
      mission.orderId === order.id &&
      mission.purpose === 'REWORK' &&
      mission.resultRevisionCaseId === revisionCase.caseId,
  )
  return scopedMissionPlanningWorkspace(order, plan, related, ids, selections)
}
