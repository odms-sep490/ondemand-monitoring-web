import type { Mission, ResourceSuggestions } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { missionDispatchPageMessages } from '../MissionDispatchPage.messages'
import { useState, useEffect } from 'react'
import type { LockedDrone } from '../dispatchTypes'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import {
  missionStatusTone,
  getMissionStatusLabel,
} from '../../../../../shared/lib/statusTone'
import { OrderWorkflowStepper } from '../../../components/common/OrderWorkflowStepper'
import { TimelineCard } from './TimelineCard'
import { ReleaseModal } from './ReleaseModal'
import { DispatchToast } from './DispatchToast'
import { MissionInfoCard } from './MissionInfoCard'
import { NoEligibleDrones } from './NoEligibleDrones'
import { DroneChoiceStep } from './DroneChoiceStep'
import { DispatchAssignmentStep } from './DispatchAssignmentStep'
import { RejectedCandidates } from './RejectedCandidates'
import { DispatchBottomBar } from './DispatchBottomBar'
import { SetupSummary } from './SetupSummary'
import { useDispatchActions } from '../useDispatchActions'

export function DispatchBody({
  mission: initialMission,
  suggestions,
  onMissionChanged,
  setupMode,
}: {
  mission: Mission
  suggestions: ResourceSuggestions
  onMissionChanged: () => void
  setupMode: boolean
}) {
  const { t, lang } = useI18n(missionDispatchPageMessages)
  const [mission, setMission] = useState(initialMission)
  // Phase 1: null = drone not yet locked; set = drone locked via API
  const [lockedDrone, setLockedDrone] = useState<LockedDrone | null>(() => {
    if (!initialMission.droneId || !initialMission.droneAssignmentId)
      return null
    const candidate =
      suggestions.topDrones.find((d) => d.code === initialMission.droneId) ??
      null
    return {
      candidate,
      code: initialMission.droneId,
      name: candidate?.name ?? initialMission.droneId,
      assignmentId: initialMission.droneAssignmentId,
    }
  })
  // Phase 2: operator selection
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null)
  const [lockingDrone, setLockingDrone] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [droneError, setDroneError] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [rejectedOpen, setRejectedOpen] = useState(false)
  const [releaseModal, setReleaseModal] = useState(false)

  // Auto-dismiss toast after 4 s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const selectedOperatorCandidate = suggestions.topOperators.find(
    (o) => o.code === selectedOperator,
  )

  const {
    handleLockDrone,
    handleAssignOperator,
    handleAutoAssign,
    handleRelease,
  } = useDispatchActions({
    setLockingDrone,
    setDroneError,
    mission,
    setMission,
    suggestions,
    setLockedDrone,
    lockedDrone,
    selectedOperator,
    setAssigning,
    setAssignError,
    selectedOperatorCandidate,
    setToast,
    setSelectedOperator,
    setReleaseModal,
    onMissionChanged,
  })

  const bothAssigned = Boolean(mission.droneId && mission.operatorId)
  const assignedStaffCount = mission.operatorId ? 1 : 0

  return (
    <div className="odm-mgr-dash">
      {/* Toast notification */}
      {toast ? <DispatchToast toast={toast} /> : null}

      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">
            {setupMode ? 'Thiết lập nhiệm vụ' : t.title}
          </h1>
          <div className="odm-mgr-dash-date">
            {setupMode
              ? `${mission.orderCode ?? 'Đơn hàng'} → ${mission.missionCode}`
              : t.subtitle}
          </div>
        </div>
        <StatusBadge tone={missionStatusTone[mission.status]} size="lg">
          {getMissionStatusLabel(mission.status, lang)}
        </StatusBadge>
      </div>

      {setupMode ? (
        <OrderWorkflowStepper currentStep={bothAssigned ? 7 : 6} />
      ) : null}

      <MissionInfoCard mission={mission} suggestions={suggestions} />

      {!suggestions.feasible ? (
        <NoEligibleDrones suggestions={suggestions} />
      ) : null}

      {droneError ? (
        <div className="odm-mgr-modal-error" style={{ marginBottom: 10 }}>
          {droneError}
        </div>
      ) : null}

      {assignError ? (
        <div className="odm-mgr-modal-error" style={{ marginBottom: 10 }}>
          {assignError}
        </div>
      ) : null}

      {/* ── Bước 1: chọn drone ─────────────────────────────────────────────── */}
      {!lockedDrone ? (
        <DroneChoiceStep
          suggestions={suggestions}
          lockingDrone={lockingDrone}
          handleLockDrone={handleLockDrone}
        />
      ) : (
        <DispatchAssignmentStep
          lockedDrone={lockedDrone}
          suggestions={suggestions}
          selectedOperator={selectedOperator}
          setSelectedOperator={setSelectedOperator}
        />
      )}

      <RejectedCandidates
        setRejectedOpen={setRejectedOpen}
        rejectedOpen={rejectedOpen}
        suggestions={suggestions}
      />

      <TimelineCard timeline={suggestions.timeline} />

      <DispatchBottomBar
        setReleaseModal={setReleaseModal}
        bothAssigned={bothAssigned}
        lockedDrone={lockedDrone}
        handleAutoAssign={handleAutoAssign}
        lockingDrone={lockingDrone}
        assigning={assigning}
        suggestions={suggestions}
        handleAssignOperator={handleAssignOperator}
        selectedOperator={selectedOperator}
      />

      {releaseModal ? (
        <ReleaseModal
          onClose={() => setReleaseModal(false)}
          onConfirm={handleRelease}
        />
      ) : null}

      {setupMode ? (
        <SetupSummary
          mission={mission}
          suggestions={suggestions}
          assignedStaffCount={assignedStaffCount}
          bothAssigned={bothAssigned}
          setToast={setToast}
        />
      ) : null}
    </div>
  )
}
