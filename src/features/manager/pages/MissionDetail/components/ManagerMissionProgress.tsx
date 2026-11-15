import { FlightStepper } from '../../../../drone-operator/components/common/FlightStepper'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import type { MissionResponse } from '../../../types/missions'

const statusStep: Record<string, number> = {
  CREATED: 0, WAITING_DEPOSIT: 0, PLANNING: 0, RESOURCE_ASSIGNING: 0,
  PENDING_CONFIRMATION: 0, WAITING_OPERATOR_ACCEPTANCE: 0,
  SCHEDULED: 1, CONNECTED: 2, PREFLIGHT_CHECKING: 2, FAILED_PREFLIGHT: 2,
  READY: 3, READY_TO_FLY: 3,
  IN_PROGRESS: 4, IN_FLIGHT: 4, RETURNING: 4,
  POSTFLIGHT_CHECKING: 5,
  AWAITING_REVIEW: 6, PENDING_REVIEW: 6, PENDING_APPROVAL: 6, COMPLETED: 6,
}

export function ManagerMissionProgress({ mission }: { mission: MissionResponse }) {
  const { t } = useI18n(missionDetailPageMessages)
  const crew = (mission.staffAssignments ?? []).filter((item) => item.isCurrent !== false)
  const crewAccepted = crew.length > 0 && crew.every((item) => item.responseStatus === 'ACCEPTED')
  const active = mission.status === 'PENDING_CONFIRMATION' && crewAccepted
    ? mission.preflightPassed ? 3 : 2
    : statusStep[mission.status]

  if (active == null) return null

  return (
    <section className="mgr-mission-progress" aria-label={t.workflowTitle}>
      <h2>{t.workflowTitle}</h2>
      <FlightStepper
        active={active}
        completed={mission.status === 'COMPLETED'}
        failed={mission.status === 'FAILED_PREFLIGHT'}
      />
    </section>
  )
}
