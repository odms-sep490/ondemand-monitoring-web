import { env } from '../../../../config/env'
import { MissionScopedAssignmentPage } from './components/MissionScopedAssignment'
import '../../manager.css'
import { MockDispatchPage } from './components/MockDispatchPage'

/**
 * MNG-05 "Phân công nguồn lực" (dispatch). Route
 * #portal/manager/missions/:missionId/dispatch. Layout and copy for the
 * default / xung đột lịch / không đủ nguồn lực / đang tính điểm / lỗi
 * states are copied from evd/design/MNG-05.dc.html. Deviation: the
 * design's day timeline is a pixel-positioned Gantt bar chart; this page
 * renders the same booking data as a simple per-resource list instead
 * (no exact start/end times are sourced for most of the bookings shown in
 * the design, only DRN-04's conflict) — see evd/P5-manager-mission-dispatch.md.
 */
export function MissionDispatchPage({
  missionId,
  setupMode = false,
}: {
  missionId: string
  setupMode?: boolean
}) {
  return env.useMockApi ? (
    <MockDispatchPage missionId={missionId} setupMode={setupMode} />
  ) : (
    <MissionScopedAssignmentPage key={missionId} missionId={missionId} />
  )
}
