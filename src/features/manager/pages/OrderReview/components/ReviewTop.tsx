import { ArrowLeftOutlined } from '@ant-design/icons'

import { WorkflowStepper } from '../../../components/common/WorkflowStepper'
import { getOrderStatusLabel } from '../../../../../shared/lib/statusTone'
import { orderStageToReviewStep } from '../../../components/common/workflowModel'
import { missionLayer } from '../reviewHelpers'
import { PageHeader } from '../../../components/common/PageHeader'
import { StatusTag } from '../../../components/common/StatusTag'
import { orderStatusTone } from '../../../../../shared/lib/statusTone'
import { formatOrderCode } from '../../../components/common/format'
import { managerHref } from '../../../routes'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import { OrderDetailsDrawer } from '../../../components/common/OrderDetailsDrawer'
import type { OrderProgress } from '../../../components/common/workflowModel'
import type { OrderDetail } from '../../../types/orders'
import type { ReviewStep } from '../reviewTypes'
import type { PlanningWorkflowInfo } from './OrderMissionPlanningSection'

function OrderStatusBadge({ order, lang }: { order: OrderDetail; lang: 'vi' | 'en' }) {
  return (
    <StatusTag tone={order.status === 'PENDING' ? 'yellow' : orderStatusTone[order.status]}>
      {getOrderStatusLabel(order.status, lang)}
    </StatusTag>
  )
}

export function ReviewTop({
  showExecutionPlan,
  stepperProgress,
  order,
  viewStage,
  openStage,
  goToStep,
  planning,
  onSelectMissionStage,
  viewMissionStage,
}: {
  showExecutionPlan: boolean
  stepperProgress: OrderProgress
  order: OrderDetail
  viewStage: 'intake' | 'criteria' | 'decision' | 'deposit' | 'planning' | null
  openStage: (
    stage: 'intake' | 'criteria' | 'decision' | 'deposit' | 'planning',
  ) => void
  goToStep: (step: ReviewStep) => void
  planning: PlanningWorkflowInfo | null
  onSelectMissionStage?: (stage: import('../../../components/common/workflowModel').MissionStage) => void
  viewMissionStage?: import('../../../components/common/workflowModel').MissionStage | null
}) {
  const { t, lang } = useI18n(orderReviewPageMessages)
  return (
    <div className="odm-or-review-top">
      <PageHeader
        as={showExecutionPlan ? 'h2' : 'h1'}
        crumb={
          <a href={managerHref({ screen: 'orderQueue' })}>
            <ArrowLeftOutlined aria-hidden="true" /> {t.backToOrders}
          </a>
        }
        title={
          showExecutionPlan ? (
            <span className="mgr-title-row">
              <span className="odm-mono">{formatOrderCode(order.code)}</span>
              <OrderStatusBadge order={order} lang={lang} />
            </span>
          ) : (
            t.pageTitle
          )
        }
        description={
          showExecutionPlan ? (
            `${t.pageTitle} · ${order.serviceName}`
          ) : (
            <>
              <span className="mgr-code">{formatOrderCode(order.code)}</span> · {order.serviceName}
            </>
          )
        }
        actions={
          <div className="odm-or-order-page-actions">
            {!showExecutionPlan ? <OrderStatusBadge order={order} lang={lang} /> : null}
            <OrderDetailsDrawer order={order} />
          </div>
        }
      />
      <WorkflowStepper
        order={{
          progress: stepperProgress,
          statusLabel: getOrderStatusLabel(order.status, lang),
          viewing: viewStage,
          onSelect: (stage) =>
            showExecutionPlan
              ? openStage(stage)
              : goToStep(orderStageToReviewStep(stage) ?? 1),
          // Before approval the three review stages stay freely navigable;
          // afterwards only completed stages reopen (read-only).
          selectable: (stage, state) =>
            stage === 'planning'
              ? Boolean(planning?.isFinalized)
              : orderStageToReviewStep(stage) !== null &&
                (showExecutionPlan ? state === 'done' : true),
        }}
        mission={
          showExecutionPlan && planning?.depositPaid && planning.missions.length
            ? missionLayer(planning, planning.selectedMissionId, lang, undefined, {
                onSelect: onSelectMissionStage,
                viewing: viewMissionStage,
                selectable: (stage, state) =>
                  stage === 'permit' ? Boolean(onSelectMissionStage) : state === 'done',
              })
            : undefined
        }
      />
    </div>
  )
}
