import type { MissionResultApprovalStatus } from '../../../../mission/types/mission'
import type { OperatorMission } from '../../../types/mission'
import type { WeatherPreflightStatus } from '../types'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { isWeatherCheckFreshAfterPermit } from '../weatherReadiness'
import { FlightStepper } from '../../../components/common/FlightStepper'

type Props = {
  mission: OperatorMission
  weather: WeatherPreflightStatus | null
  resultApprovalStatus: MissionResultApprovalStatus | null
  canOperatePayload?: boolean
}

export function MissionWorkflowProgress({
  mission,
  weather,
  resultApprovalStatus,
  canOperatePayload = false,
}: Props) {
  const { t } = useI18n(missionDetailPageMessages)
  const status = mission.backendStatus ?? mission.status
  const deviceStatus = mission.deviceAssignmentStatus ?? ''
  const accepted = mission.acceptedStaffCount ?? 0
  const total = mission.assignedStaffCount ?? 0
  const crewAccepted = total > 0 && accepted >= total
  const totalSteps = 7

  let currentStep = -1
  let detail: string | null = t.workflowTerminal
  let terminalMessage: string | null = null

  if (status === 'CANCELLED') {
    terminalMessage = t.workflowCancelled
  } else if (status === 'FAILED') {
    terminalMessage = t.workflowFailed
  } else if (status === 'COMPLETED' || resultApprovalStatus === 'APPROVED') {
    currentStep = totalSteps
    detail = t.workflowComplete
  } else if (
    status === 'AWAITING_REVIEW' ||
    status === 'PENDING_REVIEW' ||
    resultApprovalStatus === 'PENDING_MANAGER_APPROVAL'
  ) {
    currentStep = 6
    detail = t.workflowManagerReview
  } else if (mission.completedAt) {
    currentStep = 6
    detail = t.workflowSubmitResult
  } else if (
    status === 'IN_PROGRESS' ||
    status === 'IN_FLIGHT' ||
    status === 'RETURNING' ||
    status === 'POSTFLIGHT_CHECKING'
  ) {
    if (deviceStatus === 'COMPLETED' || mission.actualEndAt) {
      currentStep = 6
      detail = t.workflowSubmitResult
    } else if (deviceStatus === 'POSTFLIGHT_CHECKING') {
      currentStep = 5
      detail = t.workflowPostflight
    } else if (deviceStatus === 'RETURNING' || status === 'RETURNING') {
      currentStep = 4
      detail = t.workflowReturning
    } else {
      currentStep = 4
      detail = t.workflowFlight
    }
  } else if (status === 'READY') {
    currentStep = 3
    const permitApproved = mission.flightPermitStatus === 'APPROVED'
    const weatherFresh = isWeatherCheckFreshAfterPermit(
      weather,
      mission.flightPermitUpdatedAt,
    )
    if (!permitApproved) {
      detail =
        mission.flightPermitStatus === 'REJECTED'
          ? t.workflowPermitRejected
          : t.workflowPermitApproval
    } else if (!weatherFresh) {
      detail = t.workflowWeatherCheck
    } else if (weather?.inspectorAccepted !== true) {
      detail =
        weather?.safeToFly !== true
          ? t.workflowWeatherUnsafe
          : t.workflowWeatherApproval
    } else {
      detail = t.workflowStartReady
    }
  } else if (status === 'PENDING_CONFIRMATION') {
    const devicePassedPreflight = deviceStatus === 'READY_TO_FLY'
    if (
      !crewAccepted &&
      !devicePassedPreflight &&
      !canOperatePayload
    ) {
      currentStep = 0
      detail =
        mission.myResponseStatus === 'ACCEPTED'
          ? t.workflowWaitCrew(accepted, total)
          : t.workflowAcceptMission
    } else if (devicePassedPreflight && !crewAccepted) {
      currentStep = 3
      detail = t.workflowWaitCrewForHandover(accepted, total)
    } else if (deviceStatus === 'READY_TO_FLY') {
      currentStep = 3
      detail = t.workflowHandover
    } else if (
      deviceStatus === 'ASSIGNED' ||
      deviceStatus === 'CONNECTION_LOST' ||
      deviceStatus === 'CONNECTED' ||
      deviceStatus === 'PREFLIGHT_CHECKING'
    ) {
      currentStep = 2
      detail = t.workflowPreflight
    } else if (deviceStatus === 'FAILED') {
      currentStep = 2
      detail = t.workflowPreflightFailed
    } else if (crewAccepted) {
      currentStep = 2
      detail = null
    } else {
      currentStep = 1
      detail = t.workflowWaitCrew(accepted, total)
    }
  }

  if (currentStep < 0 && !terminalMessage) return null

  return (
    <section className="mds-workflow-progress" aria-label={t.workflowTitle}>
      <div className="mds-workflow-progress__heading">
        <h2>{t.workflowTitle}</h2>
      </div>
      {terminalMessage ? (
        <strong className="mds-workflow-progress__terminal">
          {terminalMessage}
        </strong>
      ) : (
        <>
          <FlightStepper
            active={Math.min(currentStep, totalSteps - 1)}
            completed={currentStep === totalSteps}
          />
          {detail === null ? null : (
            <p className="mds-workflow-progress__detail" role="status">
              {currentStep === totalSteps ? t.workflowComplete : detail}
            </p>
          )}
        </>
      )}
    </section>
  )
}
