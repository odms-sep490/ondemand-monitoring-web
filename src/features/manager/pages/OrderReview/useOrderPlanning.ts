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
import { useToast } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { managerFeedbackMessages } from '../../feedback.messages'
import { orderPlanningMessages } from './orderPlanning.messages'

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
  const { t: fb } = useI18n(managerFeedbackMessages)
  const { t: pm } = useI18n(orderPlanningMessages)
  const toast = useToast()
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
              title: pm.finalizeTitle,
              body: pm.finalizeBody,
              action: pm.finalizeAction,
            }
          : {
              title: action === 'amend' ? pm.amendTitle : pm.cancelTitle,
              body: action === 'amend' ? pm.amendBody : pm.cancelBody,
              action: action === 'amend' ? pm.amendAction : pm.cancelAction,
              tone: action === 'cancel' ? 'danger' : 'warning',
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
      setMessage(action === 'finalize' ? pm.finalized : pm.updated)
      toast.success(
        action === 'finalize'
          ? fb.planFinalized
          : action === 'cancel'
            ? fb.missionCancelled
            : fb.planUpdated,
      )
    } catch (error) {
      if (
        action === 'finalize' &&
        error instanceof ApiError &&
        error.code === 'CHECKLIST_COVERAGE_INCOMPLETE'
      ) {
        setCoverageWarning(finalizeError(error))
        toast.error(finalizeError(error))
      } else {
        const failure =
          action === 'finalize' ? finalizeError(error) : planningError(error)
        setMessage(failure)
        toast.error(failure)
      }
    } finally {
      setBusy(false)
      query.reload()
    }
  }

  /** Asks VNPAY about pending deposits (the notification may not reach this server), then reloads the plan. */
  async function checkPayment() {
    setMessage('')
    if (!data?.invoice) {
      setMessage(pm.noInvoice)
      query.reload()
      return
    }
    setCheckingPayment(true)
    try {
      await financeApi.refreshOrderPayments(orderId)
      setMessage(pm.paymentReconciled)
      toast.success(fb.paymentRefreshed)
    } catch (cause) {
      setMessage(planningError(cause))
      toast.error(planningError(cause))
    } finally {
      setCheckingPayment(false)
      query.reload()
    }
  }

  async function continueToResourceAssignment() {
    if (!data || !selected || !onAssignResources || !writable || busy || saving)
      return
    if (dirty) {
      setCoverageWarning(pm.checklistDirty)
      return
    }
    if (!data.plan.coverage.coverageReady || data.plan.blockers.length > 0) {
      setCoverageWarning(pm.coverageIncomplete)
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
      toast.error(finalizeError(error))
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
