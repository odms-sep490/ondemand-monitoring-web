import { missionPlanningReturnHref } from '../../../lib/missionPlanningReturn'
import { managerHref } from '../../../routes'
import {
  inspectionCorrectionApi,
  type InternalCorrectionPlanningContext,
} from '../../../../mission/inspection/inspectionCorrectionApi'
import { scopedMissionPlanningWorkspace } from '../../../lib/scopedMissionPlanningWorkspace'
import { CancelledOrderContractPanel } from '../../../../contract/CancelledOrderContractPanel'
import { useEffect, useRef, useState } from 'react'
import { ShowMoreList } from '../../../../../shared/components/antd'
import type { OrderDetail } from '../../../types/orders'
import type { MissionResponse } from '../../../types/missions'
import type { MissionStatus } from '../../../../../shared/types/domain'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { ordersApi, toOrderMissionBrief } from '../../../api/ordersApi'
import { planningApi } from '../../../api/planningApi'
import { planningError, finalizeError } from '../../../lib/planningErrors'
import { MasterChecklistSidebar } from '../../../components/common/MasterChecklistSidebar'
import { MissionGridCard } from '../../../components/common/MissionGridCard'
import { MissionUpdatePanel } from '../../../components/common/MissionUpdatePanel'
import { ReasonModal } from '../../../components/common/ReasonModal'
import { FlightPermitCard } from '../../../components/common/FlightPermitCard'
import { MissionCreatePage } from '../../MissionCreate/MissionCreatePage'
import '../../../components/common/planning.css'
import { usePlanningConfirmation } from '../../../components/common/usePlanningConfirmation'
import { financeApi } from '../../../../finance/api'
import { PlanningPaymentGate } from './PlanningPaymentGate'
import { PlanningFormModal } from './PlanningFormModal'
import { PlanningWorkspaceBar } from './PlanningWorkspaceBar'
import '../planningLayout.css'
import { orderMissionPlanningSectionMessages } from './OrderMissionPlanningSection.messages'
import { useI18n } from '../../../../../shared/i18n'
import { Alert, Collapse, Tag } from 'antd'
import { deliveryApi } from '../../../../delivery/api'
import { reworkPlanningWorkspace } from '../../../lib/reworkPlanningWorkspace'
import { TicketResultReviewCard } from '../../../../support/components/TicketResultReviewCard'
import { missionCreatePageMessages } from '../../MissionCreate/MissionCreatePage.messages'
import { MissionPaymentAllocationPanel } from './MissionPaymentAllocationPanel'

export type PlanningWorkflowInfo = {
  depositPaid: boolean
  isFinalized?: boolean
  selectedMissionId: string | null
  missions: Array<{
    id: string
    code: string
    status: MissionStatus
    flightPermitStatus?:
    'NOT_REQUESTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | null
  }>
}

export function OrderMissionPlanningSection({
  reworkCaseId,
  inspectionContext,
  orderId,
  initialOrder,
  onWorkflowInfo,
  onOrderUpdated,
  activeTab = 'planning',
  onBackToPlanning,
}: {
  reworkCaseId?: string
  inspectionContext?: InternalCorrectionPlanningContext
  orderId: string
  initialOrder?: OrderDetail
  onAssignResources?: (missionId: string) => void
  onWorkflowInfo?: (info: PlanningWorkflowInfo) => void
  onOrderUpdated?: () => void
  activeTab?: 'planning' | 'permit'
  onBackToPlanning?: () => void
}) {
  return (
    <OrderPlanningWorkspace
      key={`${orderId}:${reworkCaseId ?? inspectionContext?.correctionId ?? 'original'}`}
      reworkCaseId={reworkCaseId}
      inspectionContext={inspectionContext}
      orderId={orderId}
      initialOrder={initialOrder}
      onWorkflowInfo={onWorkflowInfo}
      onOrderUpdated={onOrderUpdated}
      activeTab={activeTab}
      onBackToPlanning={onBackToPlanning}
    />
  )
}

function OrderPlanningWorkspace({
  reworkCaseId,
  inspectionContext,
  orderId,
  initialOrder,
  onWorkflowInfo,
  onOrderUpdated,
  activeTab = 'planning',
  onBackToPlanning,
}: {
  reworkCaseId?: string
  inspectionContext?: InternalCorrectionPlanningContext
  orderId: string
  initialOrder?: OrderDetail
  onWorkflowInfo?: (info: PlanningWorkflowInfo) => void
  onOrderUpdated?: () => void
  activeTab?: 'planning' | 'permit'
  onBackToPlanning?: () => void
}) {
  const { t: ts } = useI18n(orderMissionPlanningSectionMessages)
  const { t: reworkT } = useI18n(missionCreatePageMessages)
  const confirmation = usePlanningConfirmation()
  const initialOrderRef = useRef(
    initialOrder?.id === orderId ? initialOrder : undefined,
  )

  const query = useApiQuery(
    async (signal) => {
      const [
        initialPlan,
        initialMissions,
        order,
        invoice,
        initialRevisionCase,
        paymentAllocation,
      ] = await Promise.all([
        planningApi.getExecutionPlan(orderId, signal),
        planningApi.getOrderMissions(orderId, signal),
        initialOrderRef.current ?? ordersApi.getOrder(orderId, signal),
        financeApi.getManagerInvoice(orderId, signal).catch(() => null),
        reworkCaseId
          ? deliveryApi.managerGetRevisionCase(orderId, signal)
          : Promise.resolve(null),
        reworkCaseId || inspectionContext
          ? Promise.resolve(null)
          : financeApi
            .getManagerMissionPaymentAllocations(orderId, signal)
            .catch(() => null),
      ])
      let plan = initialPlan
      let missions = initialMissions
      let revisionCase = initialRevisionCase
      if (!signal.aborted) initialOrderRef.current = undefined
      if (inspectionContext) {
        let correction = (
          await inspectionCorrectionApi.list(
            inspectionContext.sourceMissionId,
            signal,
          )
        ).find((row) => row.id === inspectionContext.correctionId)
        if (
          !correction ||
          correction.missionId !== inspectionContext.sourceMissionId ||
          !missions.some(
            (m) =>
              m.id === inspectionContext.sourceMissionId &&
              m.orderId === orderId,
          ) ||
          !correction.items.length ||
          correction.items.some((item) => !item.orderChecklistItemId)
        )
          throw new Error(reworkT.internalUnavailable)
        await inspectionCorrectionApi.ensureDraft(
          inspectionContext.sourceMissionId,
          inspectionContext.correctionId,
          signal,
        )
          ;[plan, missions] = await Promise.all([
            planningApi.getExecutionPlan(orderId, signal),
            planningApi.getOrderMissions(orderId, signal),
          ])
        correction = (
          await inspectionCorrectionApi.list(
            inspectionContext.sourceMissionId,
            signal,
          )
        ).find((row) => row.id === inspectionContext.correctionId)!
        const sourceMission =
          missions.find(
            (m) => m.id === inspectionContext.sourceMissionId,
          ) ?? null
        const related = missions.filter(
          (m) =>
            m.orderId === orderId &&
            m.inspectionCorrectionId === correction.id &&
            m.inspectionSourceMissionId === inspectionContext.sourceMissionId,
        )
        const selections = await Promise.all(
          related.map((m) => planningApi.getAssignments(m.id, signal)),
        )
        const currentSelection = selections.find(
          (selection) =>
            selection.missionId === correction.supplementalMissionId,
        )
        const currentIds = currentSelection?.assignments
          .filter((item) => item.active)
          .map((item) => item.orderChecklistItemId)
        const ids = new Set(
          currentIds?.length
            ? currentIds
            : correction.items.map((item) => item.orderChecklistItemId!),
        )
        const workspace = scopedMissionPlanningWorkspace(
          order,
          plan,
          related,
          ids,
          selections,
        )
        if (workspace.order.checklistItems.length !== ids.size)
          throw new Error(reworkT.internalUnavailable)
        return {
          ...workspace,
          invoice,
          revisionCase: null,
          paymentAllocation: null,
          inspectionCorrection: correction,
          inspectionSourceMission: sourceMission,
        }
      }
      if (reworkCaseId) {
        if (
          !revisionCase ||
          revisionCase.caseId !== reworkCaseId ||
          revisionCase.orderId !== orderId
        )
          throw new Error(reworkT.reworkUnavailable)
        await deliveryApi.managerEnsureReworkDrafts(reworkCaseId, signal)
          ;[plan, missions, revisionCase] = await Promise.all([
            planningApi.getExecutionPlan(orderId, signal),
            planningApi.getOrderMissions(orderId, signal),
            deliveryApi.managerGetRevisionCase(orderId, signal),
          ])
        if (
          !revisionCase ||
          revisionCase.caseId !== reworkCaseId ||
          revisionCase.orderId !== orderId
        )
          throw new Error(reworkT.reworkUnavailable)
        const related = missions.filter(
          (mission) =>
            mission.purpose === 'REWORK' &&
            mission.resultRevisionCaseId === reworkCaseId,
        )
        const selections = await Promise.all(
          related.map((mission) =>
            planningApi.getAssignments(mission.id, signal),
          ),
        )
        return {
          ...reworkPlanningWorkspace(
            order,
            plan,
            missions,
            revisionCase,
            selections,
          ),
          invoice,
          revisionCase,
          inspectionCorrection: null,
          inspectionSourceMission: null,
          paymentAllocation,
        }
      }
      // Derived Missions keep their own scopes. Never merge these assignments
      // into the original plan's coverage or payment allocation.
      const derivedAssignments = await Promise.all(
        missions
          .filter((m) => m.purpose === 'REWORK')
          .map((m) => planningApi.getAssignments(m.id, signal)),
      )
      const overviewPlan = {
        ...plan,
        missions: [
          ...plan.missions.filter(
            (scope) =>
              !missions.some(
                (m) => m.id === scope.missionId && m.purpose === 'REWORK',
              ),
          ),
          ...derivedAssignments.map((selection) => ({
            missionId: selection.missionId,
            scopeLabel:
              missions.find((m) => m.id === selection.missionId)?.scopeLabel ??
              '',
            assignmentCount: selection.assignments.filter((a) => a.active)
              .length,
            checklistItemIds: selection.assignments
              .filter((a) => a.active)
              .map((a) => a.orderChecklistItemId),
          })),
        ],
      }
      return {
        plan: overviewPlan,
        missions,
        order,
        invoice,
        revisionCase: null,
        inspectionCorrection: null,
        inspectionSourceMission: null,
        paymentAllocation,
      }
    },
    [
      orderId,
      reworkCaseId,
      inspectionContext?.sourceMissionId,
      inspectionContext?.correctionId,
    ],
  )

  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingMission, setEditingMission] = useState<MissionResponse | null>(
    null,
  )

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!creating && !editingMission) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [creating, editingMission])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [message, setMessage] = useState('')
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [coverageWarning, setCoverageWarning] = useState('')

  // Reason modal state
  const [reasonModalState, setReasonModalState] = useState<{
    isOpen: boolean
    title: string
    hint: string
    onConfirm: (reason: string) => Promise<void>
  }>({
    isOpen: false,
    title: '',
    hint: '',
    onConfirm: async () => { },
  })

  const data = query.data
  const originalWorkspace = !reworkCaseId && !inspectionContext
  const workspaceMissions =
    data?.missions.filter(
      (m) => !originalWorkspace || m.purpose !== 'REWORK',
    ) ?? []
  const derivedMissions = originalWorkspace
    ? (data?.missions.filter((m) => m.purpose === 'REWORK') ?? [])
    : []
  const workspacePlan = data && {
    ...data.plan,
    missions: data.plan.missions.filter((scope) =>
      workspaceMissions.some((m) => m.id === scope.missionId),
    ),
  }
  const isFinalized = data?.plan.planStatus === 'FINALIZED'
  const effective = workspaceMissions.filter(
    (mission) => !['CANCELLED', 'FAILED'].includes(mission.status),
  )
  const depositPaid = Boolean(
    data?.invoice &&
    !['CANCELLED', 'REFUNDED', 'OVERDUE'].includes(data.invoice.status) &&
    (!data.invoice.contractRequired ||
      Boolean(data.invoice.contractConfirmedAt)) &&
    (data.invoice.depositStatus === 'DEPOSIT_PAID' ||
      data.invoice.paidAmount >= data.invoice.depositAmount),
  )

  useEffect(() => {
    if (!data || !onWorkflowInfo) return
    onWorkflowInfo({
      depositPaid,
      isFinalized,
      selectedMissionId: null,
      missions: effective.map((mission) => ({
        id: mission.id,
        code: mission.missionCode || ts.missionFallback,
        status: mission.status,
        flightPermitStatus: mission.flightPermitStatus,
      })),
    })
  }, [data, depositPaid, isFinalized])

  // Keep the separate contract/deposit stage in sync with customer payments.
  useEffect(() => {
    if (reworkCaseId || inspectionContext || depositPaid || !data?.invoice)
      return
    const refresh = () => {
      if (document.visibilityState === 'visible') query.reload()
    }
    const interval = window.setInterval(refresh, 15_000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
    }
  }, [
    reworkCaseId,
    inspectionContext,
    depositPaid,
    data?.invoice?.id,
    query.reload,
  ])

  // Automatically collapse sidebar when plan is finalized/ready
  useEffect(() => {
    if (isFinalized) {
      setSidebarCollapsed(true)
    }
  }, [isFinalized, reworkCaseId])

  const internalOrderAllowsPlanning = Boolean(
    data &&
    (['APPROVED', 'IN_PROGRESS'].includes(data.order.status) ||
      (data.order.status === 'COMPLETED' &&
        data.inspectionSourceMission?.purpose === 'REWORK' &&
        Boolean(data.inspectionSourceMission.resultRevisionCaseId))),
  )

  const writable =
    (!query.loading || Boolean(data)) &&
    !query.error &&
    Boolean(
      data &&
      (inspectionContext
        ? internalOrderAllowsPlanning &&
        data.inspectionCorrection?.status === 'OPEN' &&
        data.inspectionCorrection.mode !== 'DOSSIER_ADJUSTMENT' &&
        depositPaid
        : reworkCaseId
          ? ['IN_PROGRESS', 'COMPLETED'].includes(data.order.status) &&
          data.revisionCase?.active &&
          data.revisionCase.status === 'OPEN' &&
          depositPaid
          : depositPaid &&
          ['APPROVED', 'IN_PROGRESS'].includes(data.order.status)),
    )

  const canConfirmPlan = Boolean(
    data &&
    writable &&
    !busy &&
    data.plan.planStatus === 'DRAFT' &&
    workspaceMissions.length > 0 &&
    data.plan.coverage.uncovered === 0,
  )
  const canAddMission = Boolean(
    writable && data && ['DRAFT', 'FINALIZED'].includes(data.plan.planStatus),
  )
  const canCreateMission =
    canAddMission &&
    ((!inspectionContext && !reworkCaseId) ||
      Boolean(data?.plan.coverage.uncovered))

  async function restoreDrafts() {
    if (busy) return
    setBusy(true)
    try {
      if (inspectionContext)
        await inspectionCorrectionApi.ensureDraft(
          inspectionContext.sourceMissionId,
          inspectionContext.correctionId,
          undefined,
          true,
        )
      else if (reworkCaseId)
        await deliveryApi.managerEnsureReworkDrafts(
          reworkCaseId,
          undefined,
          true,
        )
      query.reload()
    } catch (cause) {
      setMessage(planningError(cause))
    } finally {
      setBusy(false)
    }
  }

  async function confirmClose(title: string, close: () => void) {
    if (
      await confirmation.confirm({
        title,
        body: ts.closeFormBody,
        action: ts.closeFormAction,
      })
    )
      close()
  }

  async function handleFinalizePlan() {
    if (!data || !writable || busy) return
    if (
      !(await confirmation.confirm({
        title: ts.finalizeTitle,
        body: ts.finalizeBody,
        action: ts.finalizeAction,
      }))
    )
      return

    setBusy(true)
    setMessage('')
    setCoverageWarning('')
    try {
      if (inspectionContext && data.inspectionCorrection) {
        await inspectionCorrectionApi.finalize(
          inspectionContext.sourceMissionId,
          data.inspectionCorrection,
          data.plan.revision,
        )
      } else {
        await planningApi.finalizeExecutionPlan(
          orderId,
          data.plan.revision,
          reworkCaseId,
        )
      }
      setSidebarCollapsed(true)
    } catch (error) {
      setCoverageWarning(finalizeError(error))
    } finally {
      setBusy(false)
      query.reload()
    }
  }

  async function checkPayment() {
    setMessage('')
    if (!data?.invoice) {
      setMessage(ts.noDeposit)
      query.reload()
      return
    }
    setCheckingPayment(true)
    try {
      await financeApi.refreshOrderPayments(orderId)
      setMessage(ts.paymentChecked)
    } catch (cause) {
      setMessage(planningError(cause))
    } finally {
      setCheckingPayment(false)
      query.reload()
    }
  }

  function handleOpenReasonModal(
    title: string,
    hint: string,
    onConfirm: (reason: string) => Promise<void>,
  ) {
    setReasonModalState({
      isOpen: true,
      title,
      hint,
      onConfirm,
    })
  }

  return (
    <section className="odm-planning mgr-plan" aria-label={ts.sectionAria}>
      {confirmation.dialog}
      {inspectionContext && (
        <Alert
          type="info"
          showIcon
          message={reworkT.internalScope}
          description={
            <ul>
              {data?.inspectionCorrection?.items.map((item) => (
                <li key={item.executionId}>
                  <strong>{item.content}</strong> — {item.reason}
                </li>
              ))}
            </ul>
          }
        />
      )}
      {inspectionContext && !query.loading && data && !writable && (
        <Alert type="warning" showIcon message={reworkT.internalReadOnly} />
      )}
      {data?.revisionCase && (
        <>
          <Alert
            type="info"
            showIcon
            message={
              <>
                <Tag color="orange">{reworkT.reworkBadge}</Tag>
                {reworkT.reworkScopeLabel(data.revisionCase.ticketCode)}
              </>
            }
            description={reworkT.reworkDescription}
          />
          {!query.loading && !writable && (
            <Alert
              type="warning"
              showIcon
              message={
                data.revisionCase.active
                  ? reworkT.reworkPaymentRequired
                  : reworkT.reworkReadOnly
              }
            />
          )}
          <Collapse
            items={[
              {
                key: 'feedback',
                label: reworkT.reworkFeedback,
                children: (
                  <TicketResultReviewCard
                    ticketId={data.revisionCase.ticketId}
                  />
                ),
              },
            ]}
          />
        </>
      )}

      <ReasonModal
        isOpen={reasonModalState.isOpen}
        title={reasonModalState.title}
        hint={reasonModalState.hint}
        onClose={() =>
          setReasonModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={reasonModalState.onConfirm}
      />

      {data && !query.error && (inspectionContext || reworkCaseId) && (
        <p role="status" className="odm-planning-notice">
          {ts.automaticDraftHint}
        </p>
      )}
      {query.loading && <p role="status">{ts.loadingPlan}</p>}
      {query.error ? <p role="alert">{planningError(query.error)}</p> : null}
      {message && (
        <p role="status" className="odm-planning-notice">
          {message}
        </p>
      )}
      {coverageWarning && (
        <p role="alert" className="odm-planning-notice">
          {coverageWarning}
        </p>
      )}

      {data && !query.error && (
        <>
          {data.order.status === 'CANCELLED' && (
            <CancelledOrderContractPanel
              orderId={orderId}
              onUpdated={query.reload}
            />
          )}
          {!reworkCaseId && !inspectionContext && !depositPaid ? (
            <PlanningPaymentGate
              onContractUpdated={() => {
                query.reload()
                onOrderUpdated?.()
              }}
              checkingPayment={checkingPayment}
              checkPayment={checkPayment}
              data={data}
            />
          ) : (
            <>
              {/* Create Mission Modal Popup */}
              {creating && (
                <PlanningFormModal
                  kind="create"
                  ariaLabel={
                    inspectionContext
                      ? reworkT.internalCreate
                      : reworkCaseId
                        ? reworkT.reworkTitle
                        : ts.createDialogAria
                  }
                  heading={
                    inspectionContext
                      ? reworkT.internalCreate
                      : reworkCaseId
                        ? reworkT.reworkTitle
                        : ts.createHeading
                  }
                  subtitle={ts.createSubtitle}
                  closeAria={ts.closeCreateAria}
                  closeTitle={ts.closeFormLabel}
                  onRequestClose={() =>
                    void confirmClose(ts.closeFormTitle, () =>
                      setCreating(false),
                    )
                  }
                >
                  <MissionCreatePage
                    orderId={orderId}
                    reworkCaseId={reworkCaseId}
                    initialBrief={
                      inspectionContext
                        ? toOrderMissionBrief(data.order)
                        : undefined
                    }
                    internalCorrection={
                      inspectionContext && data.inspectionCorrection
                        ? {
                          sourceMissionId: inspectionContext.sourceMissionId,
                          correction: data.inspectionCorrection,
                        }
                        : undefined
                    }
                    onCreated={() => {
                      setCreating(false)
                      onBackToPlanning?.()
                      query.reload()
                    }}
                  />
                </PlanningFormModal>
              )}

              {/* Update Mission Modal Popup */}
              {editingMission && (
                <MissionUpdatePanel
                  mission={editingMission}
                  order={data.order}
                  plan={workspacePlan ?? data.plan}
                  orderChecklistItems={data.order.checklistItems ?? []}
                  reworkCase={data.revisionCase ?? undefined}
                  disabled={busy}
                  isOpen={true}
                  onClose={() => setEditingMission(null)}
                  onUpdated={() => {
                    setEditingMission(null)
                    query.reload()
                  }}
                />
              )}
              {activeTab === 'permit' ? (
                <div className="odm-flight-permits-container">
                  {effective.length === 0 ? (
                    <div className="odm-plan-empty">
                      <h3>{ts.noMissions}</h3>
                      <p>{ts.permitEmptyHint}</p>
                    </div>
                  ) : (
                    <ShowMoreList>
                      {effective.map((mission) => (
                        <FlightPermitCard
                          key={mission.id}
                          mission={mission}
                          readOnly={Boolean(
                            (reworkCaseId || inspectionContext) &&
                            (!writable ||
                              ['COMPLETED', 'FAILED', 'CANCELLED'].includes(
                                mission.status,
                              )),
                          )}
                          onChanged={query.reload}
                          depositPaid={depositPaid}
                          orderPermitRejected={
                            data.order.legalReviewStatus === 'REJECTED'
                          }
                          refundEligible={Boolean(
                            data.order.status === 'APPROVED' &&
                            data.order.legalReviewStatus === 'REJECTED' &&
                            mission.flightPermitStatus === 'REJECTED' &&
                            depositPaid,
                          )}
                        />
                      ))}
                    </ShowMoreList>
                  )}
                </div>
              ) : (
                /* Planning stage: master checklist beside the missions workspace */
                <div
                  className={`odm-planning-split-layout ${sidebarCollapsed ? 'is-collapsed' : ''}`}
                >
                  {/* Left 30%: Master Checklist */}
                  <MasterChecklistSidebar
                    items={data.order.checklistItems ?? []}
                    plan={workspacePlan ?? data.plan}
                    missions={workspaceMissions}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() =>
                      setSidebarCollapsed(!sidebarCollapsed)
                    }
                  />

                  {/* Right 70%: Missions Workspace */}
                  <div className="odm-missions-workspace-panel">
                    {!reworkCaseId &&
                      !inspectionContext &&
                      isFinalized &&
                      effective.length > 0 && (
                        <div className="odm-or-order-page-actions">
                          {effective.map((mission) => (
                            <a
                              key={mission.id}
                              className="odm-btn odm-btn-p"
                              href={
                                managerHref({
                                  screen: 'missionDetail',
                                  missionId: mission.id,
                                }) + '?tab=plan'
                              }
                            >
                              {ts.openMissionPermit} · {mission.missionCode}
                            </a>
                          ))}
                        </div>
                      )}
                  <PlanningWorkspaceBar
                    sidebarCollapsed={sidebarCollapsed}
                    onOpenSidebar={() => setSidebarCollapsed(false)}
                    uncovered={data.plan.coverage.uncovered}
                    canEdit={writable && data.plan.planStatus === 'DRAFT'}
                    canAddMission={canCreateMission}
                    addMissionLabel={
                      inspectionContext || reworkCaseId
                        ? ts.restoreDraft
                        : undefined
                    }
                    creating={creating}
                    busy={busy}
                    canConfirmPlan={canConfirmPlan}
                    reloading={query.loading}
                    onAddMission={() =>
                      inspectionContext || reworkCaseId
                        ? void restoreDrafts()
                        : setCreating(true)
                    }
                    onReload={query.reload}
                    onFinalize={() => void handleFinalizePlan()}
                  />

                  {originalWorkspace && workspaceMissions.length > 0 && (
                    <h3>{ts.originalMissions}</h3>
                  )}
                  {workspaceMissions.length === 0 ? (
                    <div className="odm-plan-empty">
                      <h3>{ts.noMissions}</h3>
                      <p>{ts.planEmptyHint}</p>
                    </div>
                  ) : (
                    <div className="odm-workspace-grid odm-unified-mission-list">
                      <ShowMoreList>
                        {workspaceMissions.map((mission) => (
                          <MissionGridCard
                            key={mission.id}
                            mission={mission}
                            order={data.order}
                            plan={workspacePlan ?? data.plan}
                            orderChecklistItems={
                              data.order.checklistItems ?? []
                            }
                            disabled={
                              busy ||
                              !writable ||
                              Boolean(
                                (reworkCaseId || inspectionContext) &&
                                mission.status !== 'PLANNING',
                              )
                            }
                            onPlanChanged={query.reload}
                            onRequestReason={handleOpenReasonModal}
                            onEditMission={setEditingMission}
                            sourceMission={
                              mission.inspectionSourceMissionId
                                ? {
                                  id: mission.inspectionSourceMissionId,
                                  code: data.missions.find(
                                    (m) =>
                                      m.id ===
                                      mission.inspectionSourceMissionId,
                                  )?.missionCode,
                                }
                                : undefined
                            }
                          />
                        ))}
                      </ShowMoreList>
                    </div>
                  )}
                </div>
                </div>
              )}
          {derivedMissions.length > 0 && (
            <section className="odm-or-card">
              <header className="odm-or-card-head">
                <h3 className="odm-or-card-title">{ts.derivedMissions}</h3>
              </header>
              <div className="odm-or-card-body">
                <p className="odm-or-muted">{ts.derivedHint}</p>
                <div className="odm-workspace-grid odm-unified-mission-list">
                  <ShowMoreList>
                    {derivedMissions.map((mission) =>
                      activeTab === 'permit' ? (
                        <FlightPermitCard
                          key={mission.id}
                          mission={mission}
                          readOnly
                          depositPaid={depositPaid}
                          onChanged={query.reload}
                        />
                      ) : (
                        <MissionGridCard
                          key={mission.id}
                          mission={mission}
                          order={data.order}
                          plan={data.plan}
                          orderChecklistItems={
                            data.order.checklistItems ?? []
                          }
                          disabled
                          onPlanChanged={query.reload}
                          onRequestReason={handleOpenReasonModal}
                          planningHref={missionPlanningReturnHref(
                            mission,
                            mission.id,
                            orderId,
                          )}
                          sourceMission={
                            mission.inspectionSourceMissionId
                              ? {
                                id: mission.inspectionSourceMissionId,
                                code: data.missions.find(
                                  (m) =>
                                    m.id ===
                                    mission.inspectionSourceMissionId,
                                )?.missionCode,
                              }
                              : undefined
                          }
                        />
                      ),
                    )}
                  </ShowMoreList>
                </div>
              </div>
            </section>
          )}
          {!reworkCaseId &&
            !inspectionContext &&
            activeTab === 'planning' &&
            data.invoice &&
            data.plan.planStatus === 'FINALIZED' ? (
            <MissionPaymentAllocationPanel
              orderId={orderId}
              invoice={data.invoice}
              allocation={data.paymentAllocation}
            />
          ) : null}
        </>
      )}
    </>
  )
}
    </section >
  )
}
