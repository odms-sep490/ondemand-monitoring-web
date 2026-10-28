import { CheckCircleOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { orderResourceAssignmentWizardMessages } from './OrderResourceAssignmentWizard.messages'
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
import { Button, PageHeader } from '../../../../shared/components/ui'
import '../layout/mgrLayout.css'
import '../../pages/MissionDispatch/missionDispatch.scss'

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
  returnLabel: returnLabelProp,
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
  const { t } = useI18n(orderResourceAssignmentWizardMessages)
  const returnLabel = returnLabelProp ?? t.returnToPlan
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
          title: t.discardTitle,
          body: t.discardBody,
          action: t.discardAction,
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
      <div className="odm-or mgr-view mgr-mdp">
      <section className="odm-or-card odm-or-card-body">
        <p role="alert">{t.notEligible}</p>
        <Button href={`#portal/manager/orders/${encodeURIComponent(orderId)}`}>
          {t.openPlan}
        </Button>
        <Button onClick={query.reload}>{t.reloadStatus}</Button>
        <Button onClick={onClose}>{returnLabel}</Button>
      </section>
      </div>
    )
  if (activeId && !current && !query.loading)
    return (
      <div className="odm-or mgr-view mgr-mdp">
      <section className="odm-or-card odm-or-card-body">
        <p role="alert">{t.loadFailed}</p>
        <Button onClick={query.reload}>{t.retry}</Button>
        <Button onClick={onClose}>{returnLabel}</Button>
      </section>
      </div>
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
    <div className="odm-or mgr-view mgr-mdp">
      {confirmation.dialog}
      <PageHeader
        title={t.title}
        actions={
          <Button disabled={busy} onClick={() => leave(true)}>
            {returnLabel}
          </Button>
        }
      />
      <OrderWorkflowStepper currentStep={6} />
      <DispatchWizardTabs
        activeStep="mission"
        selectionOnly
        onStep={() => undefined}
      />
      {selection}
      {allAssigned && (
        <div className="odm-planning-complete" role="status">
          <span>
            <CheckCircleOutlined aria-hidden="true" /> {t.allAssigned}
          </span>
          <Button variant="primary" onClick={onClose}>
            {t.finishAssigning}
          </Button>
        </div>
      )}
      <div className="odm-or-actionbar">
        <div className="odm-or-actionbar-hint">{t.hint}</div>
        <Button
          variant="primary"
          disabled={!candidateId || !eligible(candidateId)}
          onClick={next}
        >
          {t.next}
        </Button>
      </div>
    </div>
  )
}
