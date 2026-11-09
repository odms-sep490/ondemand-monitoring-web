import { expect, it } from 'vitest'
import { reworkPlanningWorkspace } from './reworkPlanningWorkspace'
import type { ResultRevisionCase } from '../../delivery/api'
import type { MissionResponse } from '../types/missions'
import type { OrderDetail } from '../types/orders'
import type {
  ExecutionPlan,
  ChecklistAssignmentSelection,
} from '../types/planning'

it('counts only active rework assignments in this case, preserving the original order plan', () => {
  const order = {
    id: 'order',
    checklistItems: ['A', 'B', 'C'].map((id) => ({ id })),
  } as OrderDetail
  const originalPlan = {
    planStatus: 'FINALIZED',
    revision: 9,
    coverage: { covered: 3 },
    missions: [],
  } as unknown as ExecutionPlan
  const revisionCase = {
    caseId: 'case',
    items: [
      {
        orderChecklistItemId: 'A',
        scopeDecision: 'IN_SCOPE',
        strategy: 'REWORK',
      },
      {
        orderChecklistItemId: 'B',
        scopeDecision: 'IN_SCOPE',
        strategy: 'REWORK',
      },
      {
        orderChecklistItemId: 'C',
        scopeDecision: 'OUT_OF_SCOPE',
        strategy: 'UNDECIDED',
      },
    ],
  } as ResultRevisionCase
  const missions = [
    {
      id: 'original',
      orderId: 'order',
      purpose: 'ORIGINAL',
      status: 'COMPLETED',
    },
    {
      id: 'current',
      orderId: 'order',
      purpose: 'REWORK',
      resultRevisionCaseId: 'case',
      status: 'PLANNING',
    },
    {
      id: 'failed',
      orderId: 'order',
      purpose: 'REWORK',
      resultRevisionCaseId: 'case',
      status: 'FAILED',
    },
    {
      id: 'foreign',
      orderId: 'order',
      purpose: 'REWORK',
      resultRevisionCaseId: 'other',
      status: 'PLANNING',
    },
  ] as MissionResponse[]
  const selections = ['original', 'current', 'failed', 'foreign'].map(
    (missionId) => ({
      missionId,
      assignments: (missionId === 'current' ? ['A'] : ['A', 'B', 'C']).map(
        (orderChecklistItemId) => ({ active: true, orderChecklistItemId }),
      ),
    }),
  ) as ChecklistAssignmentSelection[]
  const view = reworkPlanningWorkspace(
    order,
    originalPlan,
    missions,
    revisionCase,
    selections,
  )
  expect(view.order.checklistItems?.map((item) => item.id)).toEqual(['A', 'B'])
  expect(view.missions.map((mission) => mission.id)).toEqual([
    'current',
    'failed',
  ])
  expect(view.plan.coverage).toMatchObject({
    total: 2,
    covered: 1,
    uncovered: 1,
    uncoveredItemIds: ['B'],
    repeated: 0,
  })
  expect(originalPlan.coverage.covered).toBe(3)
  expect(order.checklistItems).toHaveLength(3)
})
