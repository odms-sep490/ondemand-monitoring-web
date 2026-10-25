import type { usePlanningConfirmation } from '../../components/common/usePlanningConfirmation'
import { useEffect } from 'react'
import { assignmentReadiness } from '../../lib/assignmentReadiness'
import { planningApi } from '../../api/planningApi'
import { ApiError } from '../../../../shared/api/httpClient'
import { finalizeError, planningError } from '../../lib/planningErrors'
import { financeApi } from '../../../finance/api'
import type { ExecutionPlan } from '../../types/planning'
import type { MissionResponse } from '../../types/missions'
import type { OrderDetail } from '../../types/orders'
import type { Invoice } from '../../../finance/types'
import type { PlanningWorkflowInfo } from './components/OrderMissionPlanningSection'
import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import type { Dispatch, SetStateAction } from 'react'

export function useOrderPlanning({
  selectedId,
  data,
  onWorkflowInfo,
  query,
  busy,
  saving,
  dirty,
  cancelCapabilities,
  confirmation,
  setBusy,
  setMessage,
  setCoverageWarning,
  orderId,
  reason,
  setAmending,
  setCancelling,
  setReason,
  setCheckingPayment,
  onAssignResources,
}: {
  selectedId: string | null
  data:
    | {
        plan: ExecutionPlan
        missions: MissionResponse[]
        order: OrderDetail
        invoice: Invoice | null
      }
    | undefined
  onWorkflowInfo: ((info: PlanningWorkflowInfo) => void) | undefined
  query: UseApiQueryState<{
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    invoice: Invoice | null
  }>
  busy: boolean
  saving: boolean
  dirty: boolean
  cancelCapabilities: Record<string, boolean>
  confirmation: ReturnType<typeof usePlanningConfirmation>
  setBusy: Dispatch<SetStateAction<boolean>>
  setMessage: Dispatch<SetStateAction<string>>
  setCoverageWarning: Dispatch<SetStateAction<string>>
  orderId: string
  reason: string
  setAmending: Dispatch<SetStateAction<boolean>>
  setCancelling: Dispatch<SetStateAction<string | null>>
  setReason: Dispatch<SetStateAction<string>>
  setCheckingPayment: Dispatch<SetStateAction<boolean>>
  onAssignResources: ((missionId: string) => void) | undefined
}) {
  const selected = selectedId ?? undefined
  const effective =
    data?.missions.filter((mission) => mission.status !== 'CANCELLED') ?? []
  const depositPaid = Boolean(
    data?.invoice && data.invoice.paidAmount >= data.invoice.depositAmount,
  )
  useEffect(() => {
    if (!data || !onWorkflowInfo) return
    onWorkflowInfo({
      depositPaid,
      selectedMissionId: selectedId,
      missions: effective.map((mission) => ({
        id: mission.id,
        code: mission.missionCode || 'Mission',
        status: mission.status,
      })),
    })
  }, [data, depositPaid, selectedId])
  const allAssigned = writablePlanComplete()
  function writablePlanComplete() {
    return Boolean(
      data &&
      depositPaid &&
      data.plan.planStatus === 'FINALIZED' &&
      effective.length &&
      effective.every(
        (mission) =>
          mission.status !== 'FAILED' && assignmentReadiness(mission).complete,
      ),
    )
  }
  const writable =
    !query.loading &&
    !query.error &&
    Boolean(
      data &&
      depositPaid &&
      ['APPROVED', 'IN_PROGRESS'].includes(data.order.status),
    )
  async function mutate(
    action: 'finalize' | 'amend' | 'cancel',
    missionId?: string,
  ) {
    if (!data || !writable || busy || saving || dirty) return
    if (
      action === 'cancel' &&
      (!missionId || cancelCapabilities[missionId] !== true)
    )
      return
    if (
      !(await confirmation.confirm(
        action === 'finalize'
          ? {
              title: 'Chốt kế hoạch?',
              body: 'Sau khi chốt, cấu trúc Mission và phân công checklist của phiên bản hiện tại sẽ được cố định.',
              action: 'Chốt kế hoạch',
            }
          : {
              title:
                action === 'amend' ? 'Điều chỉnh kế hoạch?' : 'Hủy Mission?',
              body:
                action === 'amend'
                  ? 'Mở phiên bản kế hoạch mới để thay đổi cấu trúc Mission. Lịch sử vẫn được giữ nguyên.'
                  : 'Mission sẽ được hủy và giữ lại trong lịch sử.',
              action:
                action === 'amend' ? 'Điều chỉnh kế hoạch' : 'Hủy Mission',
            },
      ))
    )
      return
    setBusy(true)
    setMessage('')
    setCoverageWarning('')
    try {
      if (action === 'finalize')
        await planningApi.finalizeExecutionPlan(orderId, data.plan.revision)
      else if (action === 'amend')
        await planningApi.amendExecutionPlan(orderId, {
          expectedPlanRevision: data.plan.revision,
          reason: reason.trim(),
        })
      else if (missionId)
        await planningApi.cancelMission(missionId, {
          expectedPlanRevision: data.plan.revision,
          reason: reason.trim(),
        })
      setAmending(false)
      setCancelling(null)
      setReason('')
      setMessage(
        action === 'finalize'
          ? 'Kế hoạch đã được chốt thành công.'
          : 'Đã cập nhật kế hoạch.',
      )
    } catch (error) {
      if (
        action === 'finalize' &&
        error instanceof ApiError &&
        error.code === 'CHECKLIST_COVERAGE_INCOMPLETE'
      )
        setCoverageWarning(finalizeError(error))
      else
        setMessage(
          action === 'finalize' ? finalizeError(error) : planningError(error),
        )
    } finally {
      setBusy(false)
      query.reload()
    }
  }

  /** Asks VNPAY about pending deposits (the notification may not reach this server), then reloads the plan. */
  async function checkPayment() {
    setMessage('')
    if (!data?.invoice) {
      setMessage(
        'Khách hàng chưa chấp nhận báo giá nên chưa có khoản đặt cọc để kiểm tra.',
      )
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

  async function continueToResourceAssignment() {
    if (!data || !selected || !onAssignResources || !writable || busy || saving)
      return
    if (dirty) {
      setCoverageWarning(
        'Bạn vừa thay đổi checklist. Hãy bấm “Lưu phân công” trước khi tiếp tục.',
      )
      return
    }
    if (!data.plan.coverage.coverageReady || data.plan.blockers.length > 0) {
      setCoverageWarning(
        'Còn checklist chưa được gán cho Mission. Hãy chọn các mục còn thiếu và bấm “Lưu phân công”, sau đó tiếp tục gán nguồn lực.',
      )
      return
    }
    setBusy(true)
    setMessage('')
    setCoverageWarning('')
    try {
      // The backend locks the Mission/checklist structure before resources can
      // be reserved. Keep that technical transition inside the Next action so
      // the manager-facing flow remains: schedule -> resources -> confirmation.
      await planningApi.finalizeExecutionPlan(orderId, data.plan.revision)
      onAssignResources(selected)
    } catch (error) {
      setCoverageWarning(finalizeError(error))
      setBusy(false)
      query.reload()
    }
  }
  return {
    selected,
    depositPaid,
    allAssigned,
    writable,
    mutate,
    checkPayment,
    continueToResourceAssignment,
  }
}
