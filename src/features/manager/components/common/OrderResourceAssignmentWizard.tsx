import { useCallback, useEffect, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { planningApi } from '../../api/planningApi'
import { ordersApi } from '../../api/ordersApi'
import { DispatchWizardTabs } from './DispatchWizardTabs'
import { OrderWorkflowStepper } from './OrderWorkflowStepper'
import type { MissionStaffRole } from '../../../mission/types/mission'
import { assignmentReadiness } from '../../lib/assignmentReadiness'
import { usePlanningConfirmation } from './usePlanningConfirmation'
import { WizardRoleSelection } from './WizardRoleSelection'
import { WizardOverviewStep } from './WizardOverviewStep'
import { WizardMissionStep } from './WizardMissionStep'

const roles: MissionStaffRole[] = [
  'PILOT',
  'OPERATOR',
  'MAINTAINER',
  'INSPECTOR',
]

/** Order orchestration only. Staff/device/review remain LiveDispatchPage's original wizard. */
export function OrderResourceAssignmentWizard({
  orderId,
  initialMissionId,
  onClose,
  returnLabel = 'Về kế hoạch Order',
  embedded = false,
  onStepChange,
}: {
  orderId: string
  initialMissionId?: string
  onClose: () => void
  returnLabel?: string
  embedded?: boolean
  /** Current legacy page position for an outer stepper. */
  onStepChange?: (step: 6 | 7 | 8 | 9) => void
}) {
  const confirmation = usePlanningConfirmation()
  const query = useApiQuery(
    async (signal) => {
      const [plan, missions, order] = await Promise.all([
        planningApi.getExecutionPlan(orderId, signal),
        planningApi.getOrderMissions(orderId, signal),
        ordersApi.getOrder(orderId, signal),
      ])
      const stops = await Promise.all(
        missions.map(async (mission) => {
          try {
            return await planningApi.getSafeStop(mission.id, signal)
          } catch {
            return null
          }
        }),
      )
      return { plan, missions, order, stops }
    },
    [orderId],
  )
  const [candidateId, setCandidateId] = useState<string | null>(
    initialMissionId ?? null,
  )
  const [activeId, setActiveId] = useState<string | null>(
    initialMissionId ?? null,
  )
  const [draft, setDraft] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [permitting, setPermitting] = useState(false)
  const [liveStep, setLiveStep] = useState<6 | 7>(6)
  const [busy, setBusy] = useState(false)
  const updateDraft = useCallback((dirty: boolean, saving: boolean) => {
    setDraft(dirty)
    setBusy(saving)
  }, [])
  const data = query.data
  const effective =
    data?.missions.filter((mission) => mission.status !== 'CANCELLED') ?? []
  const allAssigned =
    !query.loading &&
    !query.error &&
    data?.plan.planStatus === 'FINALIZED' &&
    effective.length > 0 &&
    effective.every(
      (mission) =>
        mission.status !== 'FAILED' && assignmentReadiness(mission).complete,
    )
  function eligible(id: string) {
    const mission = data?.missions.find((m) => m.id === id)
    const scope = data?.plan.missions.find((m) => m.missionId === id)
    const stop = data?.stops.find((s) => s?.missionId === id)
    return Boolean(
      !query.loading &&
      !query.error &&
      mission?.orderId === orderId &&
      data?.plan.planStatus === 'FINALIZED' &&
      ['APPROVED', 'IN_PROGRESS'].includes(data.order.status) &&
      (scope?.finalizedPlanRevision ?? 0) > 0 &&
      ['RESOURCE_ASSIGNING', 'READY'].includes(
        mission.status,
      ) &&
      stop &&
      !stop.status &&
      !stop.requestedAt,
    )
  }
  async function leave(close = false) {
    if (
      busy ||
      (draft &&
        !(await confirmation.confirm({
          title: 'Bỏ thay đổi chưa lưu?',
          body: 'Phân công đã lưu vẫn được giữ nguyên. Các lựa chọn chưa lưu của Mission này sẽ bị bỏ.',
          action: 'Bỏ thay đổi',
        })))
    )
      return
    setActiveId(null)
    setDraft(false)
    if (close || initialMissionId) onClose()
  }
  function next() {
    if (!candidateId || !eligible(candidateId) || busy) return false
    if (draft && activeId !== candidateId) return false
    setActiveId(candidateId)
    if (activeId !== candidateId) setDraft(false)
    return true
  }
  const selection = (
    <WizardRoleSelection
      busy={busy}
      query={query}
      data={data}
      eligible={eligible}
      orderId={orderId}
      candidateId={candidateId}
      setCandidateId={setCandidateId}
    />
  )
  const current = data?.missions.find((m) => m.id === activeId)
  const outerStep: 6 | 7 | 8 | 9 = permitting
    ? 9
    : reviewing && !current
      ? 8
      : current
        ? liveStep
        : 6
  useEffect(() => {
    onStepChange?.(outerStep)
  }, [outerStep, onStepChange])
  if ((reviewing || permitting) && !current && data)
    return (
      <WizardOverviewStep
        confirmation={confirmation}
        data={data}
        query={query}
        setCandidateId={setCandidateId}
        setActiveId={setActiveId}
        setDraft={setDraft}
        setReviewing={setReviewing}
        permitting={permitting}
        setPermitting={setPermitting}
        onClose={onClose}
        embedded={embedded}
      />
    )
  if (current && !query.loading && !eligible(current.id))
    return (
      <section className="odm-or-card odm-or-card-body">
        <p role="alert">
          Nhiệm vụ chưa đủ điều kiện phân công nguồn lực. Chốt kế hoạch Order và
          kiểm tra trạng thái nhiệm vụ trước khi tiếp tục.
        </p>
        <a
          className="odm-btn"
          href={`#portal/manager/orders/${encodeURIComponent(orderId)}`}
        >
          Mở kế hoạch Order
        </a>
        <button className="odm-btn" onClick={query.reload}>
          Tải lại trạng thái
        </button>
        <button className="odm-btn" onClick={onClose}>
          {returnLabel}
        </button>
      </section>
    )
  if (activeId && !current && !query.loading)
    return (
      <section className="odm-or-card odm-or-card-body">
        <p role="alert">
          Không thể tải đúng nhiệm vụ để phân công. Vui lòng tải lại dữ liệu.
        </p>
        <button className="odm-btn" onClick={query.reload}>
          Thử lại
        </button>
        <button className="odm-btn" onClick={onClose}>
          {returnLabel}
        </button>
      </section>
    )
  if (current) {
    const initialStaff: Partial<Record<MissionStaffRole, string[]>> = {}
    for (const role of roles)
      initialStaff[role] = [
        ...new Set(
          current.staffAssignments
            ?.filter(
              (person) =>
                person.assignedRole === role &&
                person.responseStatus !== 'REJECTED',
            )
            .map((person) => person.staffId) ?? [],
        ),
      ]
    const deviceId = current.deviceId || current.droneId
    return (
      <WizardMissionStep
        confirmation={confirmation}
        current={current}
        orderId={orderId}
        embedded={embedded}
        initialMissionId={initialMissionId}
        returnLabel={returnLabel}
        eligible={eligible}
        selection={selection}
        next={next}
        leave={leave}
        setLiveStep={setLiveStep}
        setActiveId={setActiveId}
        setDraft={setDraft}
        setBusy={setBusy}
        query={query}
        setReviewing={setReviewing}
        updateDraft={updateDraft}
        deviceId={deviceId}
        initialStaff={initialStaff}
      />
    )
  }
  return (
    <div className="odm-or">
      {confirmation.dialog}
      <div className="odm-or-pagehead odm-or-pagehead-row">
        <h1 className="odm-or-title">Phân công nguồn lực</h1>
        <button
          className="odm-or-btn-outline"
          disabled={busy}
          onClick={() => leave(true)}
        >
          {returnLabel}
        </button>
      </div>
      <OrderWorkflowStepper currentStep={6} />
      <DispatchWizardTabs
        activeStep="mission"
        selectionOnly
        onStep={() => undefined}
      />
      {selection}
      {allAssigned && (
        <div className="odm-planning-complete" role="status">
          <span>✓ Tất cả Mission đã được phân công đầy đủ.</span>
          <button className="odm-or-btn odm-or-btn-blue" onClick={onClose}>
            Hoàn tất phân công
          </button>
        </div>
      )}
      <div className="odm-or-actionbar">
        <div className="odm-or-actionbar-hint">
          Chọn đúng nhiệm vụ trước khi phân công nhân sự và thiết bị.
        </div>
        <button
          className="odm-or-btn odm-or-btn-blue"
          disabled={!candidateId || !eligible(candidateId)}
          onClick={next}
        >
          Tiếp theo
        </button>
      </div>
    </div>
  )
}
