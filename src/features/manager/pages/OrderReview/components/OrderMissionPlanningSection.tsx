import { useEffect, useRef, useState } from 'react'
import type { OrderDetail } from '../../../types/orders'
import type { MissionResponse } from '../../../types/missions'
import type { MissionStatus } from '../../../../../shared/types/domain'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { ordersApi } from '../../../api/ordersApi'
import { planningApi } from '../../../api/planningApi'
import { missionsApi } from '../../../api/missionsApi'
import { planningError, finalizeError } from '../../../lib/planningErrors'
import { ExecutionPlanSummary } from './ExecutionPlanSummary'
import { PlanningHeader } from '../../../components/common/PlanningHeader'
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
}: {
  orderId: string
  initialOrder?: OrderDetail
  onAssignResources?: (missionId: string) => void
  onWorkflowInfo?: (info: PlanningWorkflowInfo) => void
  activeTab?: 'planning' | 'permit'
}) {
  return (
    <OrderPlanningWorkspace
      key={orderId}
      orderId={orderId}
      initialOrder={initialOrder}
      onWorkflowInfo={onWorkflowInfo}
      activeTab={activeTab}
    />
  )
}

function OrderPlanningWorkspace({
  orderId,
  initialOrder,
  onWorkflowInfo,
  activeTab = 'planning',
}: {
  orderId: string
  initialOrder?: OrderDetail
  onWorkflowInfo?: (info: PlanningWorkflowInfo) => void
  activeTab?: 'planning' | 'permit'
}) {
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

  // Polling for live updates (Disabled to prevent UI stutter/flickering)
  // useEffect(() => {
  //   const refreshWhenVisible = () => {
  //     if (document.visibilityState === 'visible') query.reload()
  //   }
  //   const interval = window.setInterval(refreshWhenVisible, PLANNING_RUNTIME_POLL_MS)
  //   window.addEventListener('focus', refreshWhenVisible)
  //   return () => {
  //     window.clearInterval(interval)
  //     window.removeEventListener('focus', refreshWhenVisible)
  //   }
  // }, [query.reload])

  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingMission, setEditingMission] = useState<MissionResponse | null>(null)
  const [replacingMission, setReplacingMission] = useState<MissionResponse | null>(null)

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!creating && !editingMission && !replacingMission) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [creating, editingMission, replacingMission])

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
        code: mission.missionCode || 'Nhiệm vụ',
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

  async function handleFinalizePlan() {
    if (!data || !writable || busy) return
    if (
      !(await confirmation.confirm({
        title: 'Chốt kế hoạch ?',
        body: 'Sau khi chốt, các nhiệm vụ sẽ chuyển sang trạng thái sẵn sàng. Mọi thay đổi tài nguyên sau đó sẽ yêu cầu nhập lý do.',
        action: 'Chốt kế hoạch',
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
      if (
        error instanceof ApiError &&
        error.code === 'CHECKLIST_COVERAGE_INCOMPLETE'
      ) {
        setCoverageWarning(finalizeError(error))
      } else {
        setMessage(finalizeError(error))
      }
    } finally {
      setBusy(false)
      query.reload()
    }
  }

  async function checkPayment() {
    setMessage('')
    if (!data?.invoice) {
      setMessage('Khách hàng chưa chấp nhận báo giá nên chưa có khoản đặt cọc để kiểm tra.')
      query.reload()
      return
    }
    setCheckingPayment(true)
    try {
      await financeApi.refreshOrderPayments(orderId)
      setMessage('Đã đối soát với VNPAY. Trạng thái đặt cọc đã được cập nhật.')
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

  function handleReplaceMission(mission: MissionResponse) {
    if (!data || busy) return
    setReplacingMission(mission)
  }

  async function handleFinalizeReplacementMission(mission: MissionResponse) {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      await missionsApi.finalizeReplacementMission(mission.id)
    } catch (err: unknown) {
      setMessage(planningError(err))
    } finally {
      setBusy(false)
      query.reload()
    }
  }

  return (
    <section className="odm-or-card odm-planning" aria-label="Lập kế hoạch nhiệm vụ">
      {confirmation.dialog}

      <ReasonModal
        isOpen={reasonModalState.isOpen}
        title={reasonModalState.title}
        hint={reasonModalState.hint}
        onClose={() => setReasonModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={reasonModalState.onConfirm}
      />



      <PlanningHeader
        primary
        status={data?.plan.planStatus}
        revision={data?.plan.revision ?? 0}
        loading={query.loading}
        action={
          <button
            type="button"
            className="odm-btn"
            disabled={busy || query.loading}
            onClick={query.reload}
          >
            Tải lại kế hoạch
          </button>
        }
      />

      {query.loading && !data && <p role="status">Đang tải kế hoạch…</p>}
      {query.error ? <p role="alert">{planningError(query.error)}</p> : null}
      {message && <p role="status" className="odm-planning-notice">{message}</p>}
      {coverageWarning && <p role="alert" className="odm-planning-notice">{coverageWarning}</p>}

      {data && !query.error && (
        <>
          <ExecutionPlanSummary plan={data.plan} items={data.order.checklistItems ?? []} />

          {!depositPaid && data.order.status === 'APPROVED' ? (
            <div className="odm-planning-payment-gate" role="status">
              <div className="odm-gate-head">
                <strong>Đang chờ khách hàng thanh toán đặt cọc</strong>
                <button
                  type="button"
                  className="odm-btn"
                  disabled={checkingPayment}
                  onClick={() => void checkPayment()}
                >
                  {checkingPayment ? 'Đang kiểm tra…' : 'Kiểm tra thanh toán'}
                </button>
              </div>
              <p>
                Tạo nhiệm vụ và chốt kế hoạch sẽ được mở sau khi hệ thống xác nhận khoản đặt cọc.
              </p>
              {data.invoice ? (
                <div className="odm-gate-deposit">
                  <div
                    className="odm-gate-bar"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={data.invoice.depositAmount}
                    aria-valuenow={data.invoice.paidAmount}
                  >
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          data.invoice.depositAmount > 0
                            ? (data.invoice.paidAmount / data.invoice.depositAmount) * 100
                            : 0,
                        )}%`,
                      }}
                    />
                  </div>
                  <span>
                    Đã thanh toán {data.invoice.paidAmount.toLocaleString('vi-VN')} /{' '}
                    {data.invoice.depositAmount.toLocaleString('vi-VN')} ₫ tiền đặt cọc
                  </span>
                </div>
              ) : (
                <span>Khách hàng chưa chấp nhận báo giá hoặc chưa phát hành hóa đơn.</span>
              )}
            </div>
          ) : null}

          {/* Create Mission Modal Popup */}
          {creating && (
            <div
              className="odm-planning-modal-backdrop"
              onClick={async (e) => {
                if (e.target === e.currentTarget) {
                  if (
                    await confirmation.confirm({
                      title: 'Đóng form tạo nhiệm vụ?',
                      body: 'Dữ liệu chưa gửi sẽ không được lưu.',
                      action: 'Đóng form',
                    })
                  )
                    setCreating(false)
                }
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Tạo nhiệm vụ trong đơn hàng"
            >
              <div
                className="odm-planning-modal-dialog"
                onClick={(e) => e.stopPropagation()}
              >
                <header className="odm-planning-create-head">
                  <span className="odm-planning-create-icon" aria-hidden="true">
                    ＋
                  </span>
                  <div>
                    <h3>Tạo nhiệm vụ mới</h3>
                    <p>
                      Đặt tên dễ nhận biết, sau đó kiểm tra thời tiết và chọn lịch bay.
                    </p>
                  </div>
                  <button
                    className="odm-planning-create-close"
                    type="button"
                    aria-label="Đóng form tạo nhiệm vụ"
                    title="Đóng form"
                    onClick={async () => {
                      if (
                        await confirmation.confirm({
                          title: 'Đóng form tạo nhiệm vụ?',
                          body: 'Dữ liệu chưa gửi sẽ không được lưu.',
                          action: 'Đóng form',
                        })
                      )
                        setCreating(false)
                    }}
                  >
                    ×
                  </button>
                </header>
                <div className="odm-planning-modal-body">
                  <MissionCreatePage
                    orderId={orderId}
                    onCreated={() => {
                      setCreating(false)
                      query.reload()
                    }}
                  />
                </div>
              </div>
            </div>
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

          {/* Replace Mission Modal Popup */}
          {replacingMission && (
            <div
              className="odm-planning-modal-backdrop"
              onClick={async (e) => {
                if (e.target === e.currentTarget) {
                  if (
                    await confirmation.confirm({
                      title: 'Đóng form tạo nhiệm vụ thay thế?',
                      body: 'Dữ liệu chưa gửi sẽ không được lưu.',
                      action: 'Đóng form',
                    })
                  )
                    setReplacingMission(null)
                }
              }}
              role="dialog"
              aria-modal="true"
              aria-label={`Tạo nhiệm vụ thay thế cho ${replacingMission.missionCode ?? ''}`}
            >
              <div
                className="odm-planning-modal-dialog"
                onClick={(e) => e.stopPropagation()}
              >
                <header className="odm-planning-create-head">
                  <span className="odm-planning-create-icon" aria-hidden="true">
                    ⟲
                  </span>
                  <div>
                    <h3>Tạo nhiệm vụ thay thế cho {replacingMission.missionCode}</h3>
                    <p>
                      Thiết lập lại lịch bay, phạm vi và danh sách công việc thay thế cho nhiệm vụ đã hủy.
                    </p>
                  </div>
                  <button
                    className="odm-planning-create-close"
                    type="button"
                    aria-label="Đóng form tạo nhiệm vụ thay thế"
                    title="Đóng form"
                    onClick={async () => {
                      if (
                        await confirmation.confirm({
                          title: 'Đóng form tạo nhiệm vụ thay thế?',
                          body: 'Dữ liệu chưa gửi sẽ không được lưu.',
                          action: 'Đóng form',
                        })
                      )
                        setReplacingMission(null)
                    }}
                  >
                    ×
                  </button>
                </header>
                <div className="odm-planning-modal-body">
                  <MissionCreatePage
                    orderId={orderId}
                    replacesMissionId={replacingMission.id}
                    onCreated={() => {
                      setReplacingMission(null)
                      query.reload()
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permit' ? (
            /* Stage Giấy phép bay: Chỉ hiển thị các thẻ FlightPermitCard, không chứa component lập kế hoạch */
            <div
              className="odm-flight-permits-container"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {effective.length === 0 ? (
                <div className="odm-plan-empty">
                  <h3>Chưa có nhiệm vụ nào</h3>
                  <p>Cần lập kế hoạch và khởi tạo nhiệm trước khi quản lý giấy phép bay.</p>
                </div>
              ) : (
                effective.map((mission) => (
                  <FlightPermitCard
                    key={mission.id}
                    mission={mission}
                    onChanged={query.reload}
                  />
                ))
              )}
            </div>
          ) : (
            /* Stage Lập kế hoạch: Split-View 30% Master Checklist, 70% Missions Workspace */
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
              <div className="odm-workspace-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {sidebarCollapsed && (
                    <button
                      type="button"
                      className="odm-btn odm-btn-sm"
                      onClick={() => setSidebarCollapsed(false)}
                      title="Mở danh sách công việc"
                    >
                      › Mở danh sách công việc ({data.plan.coverage.uncovered} chưa gán)
                    </button>
                  )}
                  {writable && data.plan.planStatus === 'DRAFT' && (
                    <button
                      type="button"
                      className="odm-btn odm-btn-p"
                      disabled={busy || creating}
                      onClick={() => setCreating(true)}
                    >
                      + Thêm mới nhiệm vụ
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {data.plan.coverage.uncovered > 0 && (
                    <span style={{ fontSize: 13, color: '#b45309' }}>
                      Còn <strong>{data.plan.coverage.uncovered}</strong> công việc chưa được phân công
                    </span>
                  )}
                  {writable && data.plan.planStatus === 'DRAFT' && (
                    <button
                      type="button"
                      className="odm-btn odm-btn-p"
                      disabled={!canConfirmPlan}
                      onClick={() => void handleFinalizePlan()}
                      title={
                        data.plan.coverage.uncovered > 0
                          ? 'Cần phân công toàn bộ công việc mới có thể chốt kế hoạch'
                          : ""
                      }
                    >
                      Chốt kế hoạch 
                    </button>
                  )}
                </div>
              </div>

              {data.missions.length === 0 ? (
                <div className="odm-plan-empty">
                  <h3>Chưa có nhiệm vụ nào</h3>
                  <p>Bấm nút “Thêm nhiệm vụ” ở trên để khởi tạo nhiệm vụ đầu tiên cho đơn hàng.</p>
                </div>
              ) : (
                <div className="odm-workspace-grid">
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
                      onReplaceMission={handleReplaceMission}
                      onFinalizeReplacement={handleFinalizeReplacementMission}
                      hasReplacement={data.missions.some(
                        (m) => m.replacesMissionId === mission.id && m.status !== 'CANCELLED',
                      )}
                    />
                  ))}
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
