import type {
  MissionResponse,
  PlanWaypointResponse,
  MissionPlanResponse,
} from '../../../types/missions'
import type { DetailData } from '../../../components/common/missionDetailTypes'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type {
  MissionChecklistResponse,
  MissionChecklistExecution,
} from '../../../../mission/types/checklistExecution'
import type { RefObject } from 'react'
import type { MissionDetailTab } from '../missionDetailTypes'
import { CompletedMissionOverview } from './CompletedMissionOverview'
import { ActiveMissionOverview } from './ActiveMissionOverview'

export function OverviewTab({
  activeTab,
  onTabChange,
  isCompleted,
  mission,
  detail,
  checklist,
  loading,
  refreshDetail,
  mediaLibrary,
  resultApproved,
  checklistExecutions,
  compliantCount,
  missionId,
  waypoints,
  plan,
}: {
  activeTab: MissionDetailTab
  onTabChange: (tab: MissionDetailTab) => void
  isCompleted: boolean
  mission: MissionResponse
  detail: DetailData
  checklist: UseApiQueryState<MissionChecklistResponse>
  loading: boolean
  refreshDetail: () => void
  mediaLibrary: RefObject<HTMLElement | null>
  resultApproved: boolean
  checklistExecutions: MissionChecklistExecution[]
  compliantCount: number
  missionId: string
  waypoints: PlanWaypointResponse[]
  plan: MissionPlanResponse | null
}) {
  return (
    <>
      {isCompleted ? (
        <CompletedMissionOverview
          activeTab={activeTab}
          onTabChange={onTabChange}
          mission={mission}
          detail={detail}
          checklist={checklist}
          loading={loading}
          refreshDetail={refreshDetail}
          mediaLibrary={mediaLibrary}
          isCompleted={isCompleted}
          resultApproved={resultApproved}
          checklistExecutions={checklistExecutions}
          compliantCount={compliantCount}
          missionId={missionId}
          waypoints={waypoints}
          plan={plan}
        />
      ) : (
        <ActiveMissionOverview
          activeTab={activeTab}
          onTabChange={onTabChange}
          mission={mission}
          waypoints={waypoints}
          plan={plan}
          detail={detail}
          checklist={checklist}
          loading={loading}
          refreshDetail={refreshDetail}
          mediaLibrary={mediaLibrary}
          missionId={missionId}
        />
      )}
    </>
  )
}
