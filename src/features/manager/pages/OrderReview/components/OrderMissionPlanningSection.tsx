import { useEffect, useRef, useState } from 'react'
import { ShowMoreList } from '../../../../../shared/components/antd'
import type { OrderDetail } from '../../../types/orders'
import type { MissionResponse } from '../../../types/missions'
import type { MissionStatus } from '../../../../../shared/types/domain'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { ordersApi } from '../../../api/ordersApi'
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
import { ApiError } from '../../../../../shared/api/httpClient'
import { financeApi } from '../../../../finance/api'
import { PlanningPaymentGate } from './PlanningPaymentGate'
import { PlanningFormModal } from './PlanningFormModal'
import { PlanningWorkspaceBar } from './PlanningWorkspaceBar'
import { Button } from '../../../../../shared/components/ui'
import '../planningLayout.css'
import { orderMissionPlanningSectionMessages } from './OrderMissionPlanningSection.messages'
import { useI18n } from '../../../../../shared/i18n'

export type PlanningWorkflowInfo = {
  depositPaid: boolean
  isFinalized?: boolean
  selectedMissionId: string | null
  missions: Array<{
    id: string
    code: string
    status: MissionStatus
    flightPermitStatus?: 'NOT_REQUESTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | null
  }>
}

export function OrderMissionPlanningSection({
  orderId,
  initialOrder,
  onWorkflowInfo,
  activeTab = 'planning',
  onBackToPlanning,
}: {
  orderId: string
  initialOrder?: OrderDetail
  onAssignResources?: (missionId: string) => void
  onWorkflowInfo?: (info: PlanningWorkflowInfo) => void
  activeTab?: 'planning' | 'permit'
  onBackToPlanning?: () => void
}) {
  return (
    <OrderPlanningWorkspace
      key={orderId}
      orderId={orderId}
      initialOrder={initialOrder}
      onWorkflowInfo={onWorkflowInfo}
      activeTab={activeTab}
      onBackToPlanning={onBackToPlanning}
    />
  )
}

function OrderPlanningWorkspace({
  orderId,
  initialOrder,
  onWorkflowInfo,
  activeTab = 'planning',
  onBackToPlanning,
}: {
  orderId: string
  initialOrder?: OrderDetail
  onWorkflowInfo?: (info: PlanningWorkflowInfo) => void
  activeTab?: 'planning' | 'permit'
  onBackToPlanning?: () => void
}) {
  const { t: ts } = useI18n(orderMissionPlanningSectionMessages)
  const confirmation = usePlanningConfirmation()
  const initialOrderRef = useRef(
    initialOrder?.id === orderId ? initialOrder : undefined,
  )

  const query = useApiQuery(
    async (signal) => {
      const [plan, missions, order, invoice] = await Promise.all([
        planningApi.getExecutionPlan(orderId, signal),
        planningApi.getOrderMissions(orderId, signal),
        initialOrderRef.current ?? ordersApi.getOrder(orderId, signal),
        financeApi.getManagerInvoice(orderId, signal).catch((error) => {
          if (error instanceof ApiError && error.status === 404) return null
          throw error
        }),
      ])
      if (!signal.aborted) initialOrderRef.current = undefined
      return { plan, missions, order, invoice }
    },
    [orderId],
  )

  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingMission, setEditingMission] = useState<MissionResponse | null>(null)

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
    onConfirm: async () => {},
  })

  const data = query.data
  const isFinalized = data?.plan.planStatus === 'FINALIZED'
  const effective = data?.missions.filter((mission) => mission.status !== 'CANCELLED') ?? []
  const depositPaid = Boolean(
    data?.invoice && data.invoice.paidAmount >= data.invoice.depositAmount,
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

  // Automatically collapse sidebar when plan is finalized/ready
  useEffect(() => {
    if (isFinalized) {
      setSidebarCollapsed(true)
    }
  }, [isFinalized])


  const writable =
    (!query.loading || Boolean(data)) &&
    !query.error &&
    Boolean(
      data &&
        depositPaid &&
        ['APPROVED', 'IN_PROGRESS'].includes(data.order.status),
    )

  const canConfirmPlan = Boolean(
    data &&
      writable &&
      !busy &&
      data.plan.planStatus === 'DRAFT' &&
      data.missions.length > 0 &&
      data.plan.coverage.uncovered === 0,
  )

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
      await planningApi.finalizeExecutionPlan(orderId, data.plan.revision)
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
    <section
      className="odm-planning mgr-plan"
      aria-label={ts.sectionAria}
    >
      {confirmation.dialog}

      <ReasonModal
        isOpen={reasonModalState.isOpen}
        title={reasonModalState.title}
        hint={reasonModalState.hint}
        onClose={() => setReasonModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={reasonModalState.onConfirm}
      />



      {query.loading && <p role="status">{ts.loadingPlan}</p>}
      {query.error ? <p role="alert">{planningError(query.error)}</p> : null}
      {message && <p role="status" className="odm-planning-notice">{message}</p>}
      {coverageWarning && <p role="alert" className="odm-planning-notice">{coverageWarning}</p>}

      {data && !query.error && (
        <>
          {!depositPaid && data.order.status === 'APPROVED' ? (
            <PlanningPaymentGate
              checkingPayment={checkingPayment}
              checkPayment={checkPayment}
              data={data}
            />
          ) : null}

          {/* Create Mission Modal Popup */}
          {creating && (
            <PlanningFormModal
              kind="create"
              ariaLabel={ts.createDialogAria}
              heading={ts.createHeading}
              subtitle={ts.createSubtitle}
              closeAria={ts.closeCreateAria}
              closeTitle={ts.closeFormLabel}
              onRequestClose={() => void confirmClose(ts.closeFormTitle, () => setCreating(false))}
            >
              <MissionCreatePage
                orderId={orderId}
                onCreated={() => {
                  setCreating(false)
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
              plan={data.plan}
              orderChecklistItems={data.order.checklistItems ?? []}
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
            /* Permit stage keeps the current branch navigation behavior. */
            <div className="odm-flight-permits-container">
              <div>
                <Button
                  type="button"
                  size="sm"
                  onClick={onBackToPlanning}
                >
                  ← Quay lại lập kế hoạch
                </Button>
              </div>
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
                      onChanged={query.reload}
                    />
                  ))}
                </ShowMoreList>
              )}
            </div>
          ) : (
            /* Planning stage: master checklist beside the missions workspace */
            <div className={`odm-planning-split-layout ${sidebarCollapsed ? 'is-collapsed' : ''}`}>
            {/* Left 30%: Master Checklist */}
            <MasterChecklistSidebar
              items={data.order.checklistItems ?? []}
              plan={data.plan}
              missions={data.missions}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Right 70%: Missions Workspace */}
            <div className="odm-missions-workspace-panel">
              <PlanningWorkspaceBar
                sidebarCollapsed={sidebarCollapsed}
                onOpenSidebar={() => setSidebarCollapsed(false)}
                uncovered={data.plan.coverage.uncovered}
                canEdit={writable && data.plan.planStatus === 'DRAFT'}
                creating={creating}
                busy={busy}
                canConfirmPlan={canConfirmPlan}
                reloading={query.loading}
                onAddMission={() => setCreating(true)}
                onReload={query.reload}
                onFinalize={() => void handleFinalizePlan()}
              />

              {data.missions.length === 0 ? (
                <div className="odm-plan-empty">
                  <h3>{ts.noMissions}</h3>
                  <p>{ts.planEmptyHint}</p>
                </div>
              ) : (
                <div className="odm-workspace-grid">
                  <ShowMoreList>
                  {data.missions.map((mission) => (
                    <MissionGridCard
                      key={mission.id}
                      mission={mission}
                      order={data.order}
                      plan={data.plan}
                      orderChecklistItems={data.order.checklistItems ?? []}
                      disabled={busy}
                      onPlanChanged={query.reload}
                      onRequestReason={handleOpenReasonModal}
                      onEditMission={setEditingMission}
                    />
                  ))}
                  </ShowMoreList>
                </div>
              )}
            </div>
          </div>
          )}
        </>
      )}
    </section>
  )
}
