import { MissionScopedAssignmentPage } from './components/MissionScopedAssignment'
import '../../manager.css'

/**
 * MNG-05 resource assignment. Route
 * #portal/manager/missions/:missionId/dispatch. Resolves the mission's order
 * and renders the order-level assignment wizard scoped to this mission.
 */
export function MissionDispatchPage({
  missionId,
}: {
  missionId: string
  setupMode?: boolean
}) {
  return <MissionScopedAssignmentPage key={missionId} missionId={missionId} />
}
