import type { MissionResultApprovalStatus } from '../../../../mission/types/mission'
import type { OperatorMission } from '../../../types/mission'
import type { WeatherPreflightStatus } from '../types'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { isWeatherCheckFreshAfterPermit } from '../weatherReadiness'

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
  const steps = t.workflowSteps

  let currentStep = -1
  let detail = t.workflowTerminal
  let terminalMessage: string | null = null

  if (status === 'CANCELLED') {
    terminalMessage = t.workflowCancelled
  } else if (status === 'FAILED') {
    terminalMessage = t.workflowFailed
  } else if (status === 'COMPLETED' || resultApprovalStatus === 'APPROVED') {
    currentStep = steps.length
    detail = t.workflowComplete
  } else if (
    status === 'AWAITING_REVIEW' ||
    status === 'PENDING_REVIEW' ||
    resultApprovalStatus === 'PENDING_MANAGER_APPROVAL'
  ) {
    currentStep = 5
    detail = t.workflowManagerReview
  } else if (mission.completedAt) {
    currentStep = 5
    detail = t.workflowSubmitResult
  } else if (
    status === 'IN_PROGRESS' ||
    status === 'IN_FLIGHT' ||
    status === 'RETURNING' ||
    status === 'POSTFLIGHT_CHECKING'
  ) {
    currentStep = 4
    if (deviceStatus === 'POSTFLIGHT_CHECKING' || mission.actualEndAt) {
      detail = t.workflowPostflight
    } else if (deviceStatus === 'RETURNING' || status === 'RETURNING') {
      detail = t.workflowReturning
    } else {
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
    } else if (weather?.safeToFly !== true) {
      detail = t.workflowWeatherUnsafe
    } else if (weather.inspectorAccepted !== true) {
      detail = t.workflowWeatherApproval
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
      currentStep = 2
      detail = t.workflowWaitCrewForHandover(accepted, total)
    } else if (deviceStatus === 'READY_TO_FLY') {
      currentStep = 2
      detail = t.workflowHandover
    } else if (deviceStatus === 'CONNECTED' || deviceStatus === 'PREFLIGHT_CHECKING') {
      currentStep = 1
      detail = t.workflowPreflight
    } else if (deviceStatus === 'FAILED') {
      currentStep = 1
      detail = t.workflowPreflightFailed
    } else {
      currentStep = 1
      detail = t.workflowConnectDevice
    }
  }

  if (currentStep < 0 && !terminalMessage) return null

  return (
    <section className="mds-workflow-progress" aria-label={t.workflowTitle}>
      <div className="mds-workflow-progress__heading">
        <h2>{t.workflowTitle}</h2>
        {terminalMessage ? (
          <strong className="mds-workflow-progress__terminal">
            {terminalMessage}
          </strong>
        ) : currentStep === steps.length ? (
          <strong className="mds-workflow-progress__complete">
            {t.workflowComplete}
          </strong>
        ) : (
          <strong aria-live="polite" aria-atomic="true">
            {t.workflowStep(currentStep + 1, steps.length)} · {steps[currentStep]}
          </strong>
        )}
      </div>
      {!terminalMessage && (
        <>
          <ol className="mds-workflow-progress__steps">
            {steps.map((label, index) => {
              const completed = currentStep === steps.length || index < currentStep
              const current = index === currentStep
              return (
                <li
                  key={label}
                  className={[
                    'mds-workflow-progress__step',
                    completed ? 'is-complete' : '',
                    current ? 'is-current' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={current ? 'step' : undefined}
                >
                  <span className="mds-workflow-progress__marker" aria-hidden="true">
                    {completed ? '✓' : index + 1}
                  </span>
                  <span>{label}</span>
                </li>
              )
            })}
          </ol>
          <p className="mds-workflow-progress__detail" role="status">
            {detail}
          </p>
        </>
      )}
    </section>
  )
}
