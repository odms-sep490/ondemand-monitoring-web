import type { OperatorMission } from '../../../types/mission'
import { useI18n } from '../../../../../shared/i18n'
import { missionListPageMessages } from '../MissionListPage.messages'
import { formatDeviceLabel } from '../../../lib/deviceLabel'
import {
  latestMissionStatus,
  railActionFor,
  railStatusTone,
} from '../missionListHelpers'
import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import { hasAcknowledgedHandover } from '../../../lib/flightWorkflowStorage'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { setActiveMissionId } from '../../../api/liveMission'

export function NextFlightCard({
  mission,
  start,
  now,
  today,
}: {
  mission: OperatorMission
  start: Date
  now: Date
  today: string
}) {
  const { t, locale } = useI18n(missionListPageMessages)
  const totalMinutes = Math.max(
    0,
    Math.round((start.getTime() - now.getTime()) / 60000),
  )
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const dayLabel =
    mission.date === today ? t.today2 : start.toLocaleDateString(locale)
  const deviceLabel = formatDeviceLabel(mission)
  const status = latestMissionStatus(mission)
  const statusLabel =
    missionStopLabel(mission) ??
    (status === 'READY_TO_FLY' && hasAcknowledgedHandover(mission.id)
      ? t.handedOver
      : undefined) ??
    (t.statusLabel as Record<string, string>)[status] ??
    (t.statusLabel as Record<string, string>)[mission.status] ??
    status
  const action = railActionFor(mission, t)

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <span className="odm-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>
          {mission.missionCode ?? mission.id}
        </span>
        <StatusBadge tone={railStatusTone(status)}>{statusLabel}</StatusBadge>
      </div>
      <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 8 }}>
        {t.timeLeft(hours, minutes)}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
        {mission.title}
      </div>
      <div
        className="odm-tn"
        style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 4 }}
      >
        {mission.startTime}–{mission.endTime} · {dayLabel}
      </div>
      <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 4 }}>
        {mission.location}
      </div>
      <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 12 }}>
        {deviceLabel ?? t.unassignedDevice}
      </div>
      <a
        className="odm-btn odm-btn-ok"
        style={{ width: '100%', justifyContent: 'center' }}
        href={action.href}
        onClick={() => setActiveMissionId(mission.id)}
      >
        {action.label}
      </a>
    </div>
  )
}
