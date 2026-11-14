import { Descriptions } from 'antd'
import { RocketOutlined } from '@ant-design/icons'
import { MissionStatusTag } from '../../../components/common/MissionStatusTag'
import type { MissionResponse } from '../../../types/missions'
import { formatDateTime, formatDuration, formatNumber } from '../../../components/common/missionDetailHelpers'
import { MissionCrewCard } from './MissionCrewCard'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'

export function MissionPlanPanel({ mission }: { mission: MissionResponse }) {
  const { t, locale } = useI18n(missionDetailPageMessages)
  const plan = mission.plan
  return <>
    <section aria-label={t.tabs.plan}>
      <header className="mgr-mission-plan-heading">
        <span className="mgr-mission-plan-heading__icon" aria-hidden="true"><RocketOutlined /></span>
        <div className="mgr-mission-plan-heading__identity">
          <span className="mgr-mission-plan-heading__label">{t.tabs.plan}</span>
          <h2>{mission.missionCode}</h2>
        </div>
        <MissionStatusTag mission={mission} />
      </header>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} style={{ marginBottom: 20 }} items={[
        ...(mission.scheduledStartAt ? [{ key: 'start', label: t.fields.scheduledStart, children: formatDateTime(mission.scheduledStartAt, locale) }] : []),
        ...(mission.scheduledEndAt ? [{ key: 'end', label: t.fields.scheduledEnd, children: formatDateTime(mission.scheduledEndAt, locale) }] : []),
        ...(plan?.plannedDistanceM != null && Number.isFinite(plan.plannedDistanceM) ? [{ key: 'distance', label: t.map.distance, children: formatNumber(plan.plannedDistanceM, ' m') }] : []),
        ...(plan?.maxPlannedAltitudeM != null && Number.isFinite(plan.maxPlannedAltitudeM) ? [{ key: 'altitude', label: t.map.altitude, children: formatNumber(plan.maxPlannedAltitudeM, ' m') }] : []),
        ...(plan?.plannedDurationSec != null && Number.isFinite(plan.plannedDurationSec) ? [{ key: 'duration', label: t.kpi.plannedDuration, children: formatDuration(plan.plannedDurationSec) }] : []),
        ...(plan?.waypoints?.length ? [{ key: 'waypoints', label: t.map.waypoint, children: plan.waypoints.length }] : []),
      ]} />
      <MissionCrewCard staff={mission.staffAssignments ?? []} deviceCode={null} deviceLabel={t.notRecorded}
        deviceAssignments={mission.deviceAssignments} permitStatus={mission.flightPermitStatus ?? 'NOT_REQUESTED'}
        permitNote={mission.flightPermitNote} missionId={mission.id} canReplaceStaff={false} />
    </section>
  </>
}
