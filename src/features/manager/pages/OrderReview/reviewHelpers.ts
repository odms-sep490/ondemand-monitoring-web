import type { PlanningWorkflowInfo } from './components/OrderMissionPlanningSection'
import { missionProgress } from '../../components/common/workflowModel'
import { getMissionStatusLabel } from '../../../../shared/lib/statusTone'

export const REVIEW_PAGE_COUNT = 4

/** Mission row of the workflow header: which Mission, its business status, and where it is. */
export function missionLayer(
  planning: PlanningWorkflowInfo | null,
  missionId: string | null,
  lang: 'vi' | 'en',
  stage?: 'permit' | 'review',
  options?: {
    onSelect?: (stage: import('../../components/common/workflowModel').MissionStage) => void
    selectable?: (
      stage: import('../../components/common/workflowModel').MissionStage,
      state: import('../../components/common/workflowModel').StageState,
    ) => boolean
    viewing?: import('../../components/common/workflowModel').MissionStage | null
  },
) {
  const total = planning?.missions.length
  const index = planning?.missions.findIndex((m) => m.id === missionId) ?? -1
  const mission = index >= 0 ? planning?.missions[index] : undefined
  const progress = mission ? missionProgress(mission.status, mission.flightPermitStatus) : null
  return {
    progress:
      stage === 'permit' || stage === 'review'
        ? { current: 'permit' as const, finished: false, terminal: null }
        : progress,
    index: mission ? index + 1 : undefined,
    total: mission ? total : undefined,
    code: mission?.code,
    statusLabel: mission
      ? getMissionStatusLabel(mission.status, lang)
      : undefined,
    onSelect: options?.onSelect,
    selectable: options?.selectable,
    viewing: options?.viewing,
  }
}
