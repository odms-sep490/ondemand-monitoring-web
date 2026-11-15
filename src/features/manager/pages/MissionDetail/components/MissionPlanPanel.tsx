import { Button, Descriptions } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { managerHref } from '../../../routes'
import { useState } from 'react'
import { MissionResourceReplacementDialog, type ReplacementTarget } from './MissionResourceReplacementDialog'
import type { MissionResponse } from '../../../types/missions'
import { formatDateTime, formatDuration, formatNumber } from '../../../components/common/missionDetailHelpers'
import { MissionCrewCard } from './MissionCrewCard'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'

export function MissionPlanPanel({ mission, onUpdated }: { mission: MissionResponse; onUpdated: () => void }) {
  const [target, setTarget] = useState<ReplacementTarget | null>(null)
  const canReplace = ['PENDING_CONFIRMATION', 'READY'].includes(mission.status)
  const { t, locale } = useI18n(missionDetailPageMessages)
  const plan = mission.plan
  return (
    <section className="mgr-mission-plan" aria-label={t.tabs.plan}>
      {mission.orderId ? (
        <div>
          <Button
            icon={<ArrowLeftOutlined />}
            href={managerHref({ screen: 'orderReview', orderId: mission.orderId })}
          >
            {t.backToOrderPlanning}
          </Button>
        </div>
      ) : null}
      {(mission.scheduledStartAt || mission.scheduledEndAt) && (
        <dl className="mgr-mission-plan-times">
          <div>
            <dt>{t.fields.scheduledStart}</dt>
            <dd>{formatDateTime(mission.scheduledStartAt, locale)}</dd>
          </div>
          <div>
            <dt>{t.fields.scheduledEnd}</dt>
            <dd>{formatDateTime(mission.scheduledEndAt, locale)}</dd>
          </div>
        </dl>
      )}
      <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} items={[
        ...(plan?.plannedDistanceM != null && Number.isFinite(plan.plannedDistanceM) ? [{ key: 'distance', label: t.map.distance, children: formatNumber(plan.plannedDistanceM, ' m') }] : []),
        ...(plan?.maxPlannedAltitudeM != null && Number.isFinite(plan.maxPlannedAltitudeM) ? [{ key: 'altitude', label: t.map.altitude, children: formatNumber(plan.maxPlannedAltitudeM, ' m') }] : []),
        ...(plan?.plannedDurationSec != null && Number.isFinite(plan.plannedDurationSec) ? [{ key: 'duration', label: t.kpi.plannedDuration, children: formatDuration(plan.plannedDurationSec) }] : []),
        ...(plan?.waypoints?.length ? [{ key: 'waypoints', label: t.map.waypoint, children: plan.waypoints.length }] : []),
      ]} />
      <MissionCrewCard staff={(mission.staffAssignments ?? []).filter(a => a.isCurrent !== false)} deviceCode={null} deviceLabel={t.notRecorded}
        deviceAssignments={(mission.deviceAssignments ?? [])}
        missionId={mission.id} canReplaceStaff={canReplace}
        onReplaceDevice={canReplace ? assignment => setTarget({ kind: 'DEVICE', id: assignment.id, name: assignment.deviceName || assignment.deviceCode || assignment.deviceId }) : undefined} />
      {target && <MissionResourceReplacementDialog key={`${target.kind}:${target.id}`} mission={mission} target={target} onClose={() => setTarget(null)} onSaved={onUpdated} />}
    </section>
  )
}
