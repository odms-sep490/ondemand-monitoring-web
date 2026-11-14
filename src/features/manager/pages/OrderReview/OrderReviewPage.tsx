import { CancelledOrderContractPanel } from '../../../contract/CancelledOrderContractPanel'
import { useEffect, useRef, useState } from 'react'

import { ApiError } from '../../../../shared/api/httpClient'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { ordersApi } from '../../api/ordersApi'
import { readinessApi } from '../../api/readinessApi'
import { managerHref } from '../../routes'
import {
  OrderMissionPlanningSection,
  type PlanningWorkflowInfo,
} from './components/OrderMissionPlanningSection'
import {
  orderProgress,
  orderStageToReviewStep,
  type OrderStage,
} from '../../components/common/workflowModel'
import { orderReviewPageMessages } from './OrderReviewPage.messages'
import { orderPlanningMessages } from './orderPlanning.messages'
import '../../manager.css'
import './orderReview.scss'
import type { LegalReviewStatus } from '../../types/orders'
import { type ReviewStep } from './reviewTypes'
import { ReviewSkeleton } from './components/ReviewSkeleton'
import { AssignmentWizardView } from './components/AssignmentWizardView'
import { ReviewLoadError } from './components/ReviewLoadError'
import { ReviewTop } from './components/ReviewTop'
import { ReadonlyBanner } from './components/ReadonlyBanner'
import { ReviewStageRequest } from './components/ReviewStageRequest'
import { ReviewStageArea } from './components/ReviewStageArea'
import { ReviewStageReadiness } from './components/ReviewStageReadiness'
import { ReviewStagePricing } from './components/ReviewStagePricing'
import { ReviewLayout } from './components/ReviewLayout'
import { OrderIcon } from '../../components/common/OrderIcon'
import '../../components/layout/mgrLayout.css'

export function OrderReviewPage({ orderId }: { orderId: string }) {
  const { t } = useI18n(orderReviewPageMessages)
  const { t: pm } = useI18n(orderPlanningMessages)
  const orderQuery = useApiQuery(
    (signal) => ordersApi.getOrder(orderId, signal),
    [orderId],
  )
  const readinessQuery = useApiQuery(
    (signal) => readinessApi.get(orderId, signal),
    [orderId],
  )

  const [navigateHome, setNavigateHome] = useState(false)
  const [assignStep, setAssignStep] = useState<6 | 7 | 8 | 9>(6)
  const [reviewStep, setReviewStep] = useState<ReviewStep>(1)
  const [startingReview, setStartingReview] = useState(false)
  const [startReviewError, setStartReviewError] = useState<string | null>(null)
  const [reviewStartedLocally, setReviewStartedLocally] = useState(false)
  const [areaReviewStatus, setAreaReviewStatus] =
    useState<LegalReviewStatus | null>(null)
  // A completed Order stage reopened read-only; null = the live (current) screen.
  const [viewStage, setViewStage] = useState<OrderStage | null>(null)
  const [planning, setPlanning] = useState<PlanningWorkflowInfo | null>(null)
  // Track the active planning, permit, or execution stage.
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<
    'planning' | 'permit' | 'execution'
  >('planning')
  const pageRef = useRef<HTMLDivElement>(null)
  const [assigningMissionId, setAssigningMissionId] = useState<string | null>(
    null,
  )
  useEffect(() => {
    setAreaReviewStatus(orderQuery.data?.legalReviewStatus ?? null)
  }, [orderQuery.data])
  useEffect(() => {
    setReviewStartedLocally(false)
  }, [orderId])
  useEffect(() => {
    if (orderQuery.data?.status === 'UNDER_REVIEW') {
      setReviewStartedLocally(false)
    }
  }, [orderQuery.data?.status])

  const hasApprovedPermit = Boolean(
    planning?.missions.some(
      (mission) => mission.flightPermitStatus === 'APPROVED',
    ),
  )

  // Once any mission's permit is approved, open the execution flow.
  useEffect(() => {
    if (planning?.isFinalized) {
      setActiveWorkflowTab(hasApprovedPermit ? 'execution' : 'permit')
    }
  }, [planning?.isFinalized, hasApprovedPermit])
  if (navigateHome) {
    window.location.hash = managerHref({ screen: 'orderQueue' })
    return null
  }

  if (assigningMissionId && orderQuery.data)
    return (
      <AssignmentWizardView
        planning={planning}
        assigningMissionId={assigningMissionId}
        assignStep={assignStep}
        orderQuery={orderQuery}
        orderData={orderQuery.data}
        orderId={orderId}
        setAssignStep={setAssignStep}
        setAssigningMissionId={setAssigningMissionId}
      />
    )
  if (orderQuery.loading) return <ReviewSkeleton orderId={orderId} t={t} />

  if (orderQuery.error) {
    const is409 =
      orderQuery.error instanceof ApiError && orderQuery.error.status === 409
    return <ReviewLoadError orderId={orderId} is409={is409} />
  }

  const orderData = orderQuery.data
  if (!orderData) return null
  const order =
    reviewStartedLocally && orderData.status === 'PENDING'
      ? { ...orderData, status: 'UNDER_REVIEW' as const }
      : orderData
  const showExecutionPlan = ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(
    order.status,
  )

  // Until the planning data arrives assume the deposit is paid, so the header
  // never flashes "waiting for deposit" for an order that is already funded.
  const stepperProgress = orderProgress({
    status: order.status,
    depositPaid: planning ? planning.depositPaid : true,
    reviewStep,
    planFinalized: planning?.isFinalized,
  })
  const reviewable = ['PENDING', 'UNDER_REVIEW'].includes(order.status)
  const readOnly = showExecutionPlan || !reviewable
  const waitingForCustomerInfo = order.status === 'NEEDS_INFO'
  const reviewing = !showExecutionPlan || viewStage !== null
  const openStage = (stage: OrderStage) => {
    if (stage !== 'planning' && planning?.depositPaid) return
    if (stage === 'planning') {
      setViewStage(null)
      setActiveWorkflowTab('planning')
      pageRef.current?.scrollIntoView?.({ block: 'start' })
      return
    }
    const step = orderStageToReviewStep(stage)
    if (!step) return
    setReviewStep(step)
    setViewStage(stage)
    pageRef.current?.scrollIntoView?.({ block: 'start' })
  }

  const goToStep = async (step: ReviewStep) => {
    if (reviewStep === 1 && step === 2 && order.status === 'PENDING') {
      setStartingReview(true)
      setStartReviewError(null)
      try {
        await ordersApi.startReview(order.id)
        setReviewStartedLocally(true)
        orderQuery.reload()
      } catch (error) {
        setStartReviewError(
          error instanceof Error
            ? error.message
            : 'Không thể bắt đầu duyệt đơn.',
        )
        return
      } finally {
        setStartingReview(false)
      }
    }
    setReviewStep(step)
    // Each step is a long page; start the next one from the top.
    pageRef.current?.scrollIntoView?.({ block: 'start' })
  }

  const handleApproved = () => {
    // Approval enters Order planning. A legacy missionId must not skip checklist/finalization.
    orderQuery.reload()
    readinessQuery.reload()
  }

  // The backend enforces the same criteria; this only keeps the button honest.
  const readiness = readinessQuery.data
  const approveBlockedReason =
    order.status === 'UNDER_REVIEW' && readiness && !readiness.canApprove
      ? pm.approveBlocked(readiness.blockingReasons.join('; '))
      : null
  const pendingRequired =
    readiness?.criteria.filter(
      (c) =>
        c.code !== 'CAPABILITY' &&
        c.type === 'MANUAL' &&
        c.required &&
        c.result === 'PENDING',
    ).length ?? 0

  return (
    <div className="odm-or odm-or-review-page mgr-view mgr-or" ref={pageRef}>
      <ReviewTop
        showExecutionPlan={showExecutionPlan}
        stepperProgress={stepperProgress}
        order={order}
        viewStage={
          viewStage ??
          (planning?.isFinalized && activeWorkflowTab === 'planning'
            ? 'planning'
            : null)
        }
        openStage={openStage}
        goToStep={goToStep}
        planning={planning}
        viewMissionStage={activeWorkflowTab === 'permit' ? 'permit' : null}
        onSelectMissionStage={(stage) => {
          if (stage === 'permit' || stage === 'execute') {
            setViewStage(null)
            setActiveWorkflowTab(stage === 'permit' ? 'permit' : 'execution')
            pageRef.current?.scrollIntoView?.({ block: 'start' })
          }
        }}
      />
      {order.status === 'CANCELLED' && (
        <CancelledOrderContractPanel
          orderId={order.id}
          onUpdated={orderQuery.reload}
        />
      )}
      {waitingForCustomerInfo ? (
        <div
          className="odm-or-customer-info-lock"
          role="status"
          aria-live="polite"
        >
          <span className="odm-or-customer-info-lock-icon" aria-hidden="true">
            <OrderIcon name="lock" size={18} />
          </span>
          <div>
            <strong>{t.customerInfoPendingTitle}</strong>
            <span>{t.customerInfoPendingBody}</span>
          </div>
        </div>
      ) : null}
      {showExecutionPlan && (
        // Stays mounted while history is open so unsaved planning drafts survive.
        <div hidden={viewStage !== null}>
          <OrderMissionPlanningSection
            orderId={order.id}
            initialOrder={order}
            onAssignResources={setAssigningMissionId}
            onWorkflowInfo={setPlanning}
            onOrderUpdated={orderQuery.reload}
            activeTab={activeWorkflowTab}
            onBackToPlanning={() => setActiveWorkflowTab('planning')}
          />
        </div>
      )}
      {readOnly && viewStage !== null && (
        <ReadonlyBanner setViewStage={setViewStage} />
      )}
      {reviewing ? (
        <ReviewLayout
          order={order}
          wide={reviewStep !== 1}
          reviewStep={reviewStep}
        >
          {reviewing && reviewStep === 1 ? (
            <ReviewStageRequest
              readOnly={readOnly}
              order={order}
              goToStep={goToStep}
              startingReview={startingReview}
              startReviewError={startReviewError}
            />
          ) : null}

          {reviewing && reviewStep === 2 ? (
            <ReviewStageArea
              readOnly={readOnly}
              order={order}
              setAreaReviewStatus={setAreaReviewStatus}
              goToStep={goToStep}
              areaReviewStatus={areaReviewStatus}
            />
          ) : null}

          {reviewing && reviewStep === 3 ? (
            <ReviewStageReadiness
              readOnly={readOnly}
              order={order}
              readinessQuery={readinessQuery}
              setNavigateHome={setNavigateHome}
              goToStep={goToStep}
              pendingRequired={pendingRequired}
            />
          ) : null}

          {reviewing && reviewStep === 4 ? (
            <ReviewStagePricing
              readOnly={readOnly}
              order={order}
              handleApproved={handleApproved}
              readinessQuery={readinessQuery}
              approveBlockedReason={approveBlockedReason}
              goToStep={goToStep}
            />
          ) : null}
        </ReviewLayout>
      ) : null}
    </div>
  )
}
