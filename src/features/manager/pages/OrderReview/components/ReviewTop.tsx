import { WorkflowStepper } from '../../../components/common/WorkflowStepper'
import { getOrderStatusLabel } from '../../../../../shared/lib/statusTone'
import { orderStageToReviewStep } from '../../../components/common/workflowModel'
import { missionLayer } from '../reviewHelpers'
import {
  OrderServiceBanner,
  orderDeliverableLabels,
} from './OrderServiceBanner'
import { OrderBannerMeta } from './OrderBannerMeta'
import { PageHeader, StatusBadge, toUiTone } from '../../../../../shared/components/ui'
import { orderStatusTone } from '../../../../../shared/lib/statusTone'
import { formatOrderCode } from '../../../components/common/format'
import { managerHref } from '../../../routes'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { OrderProgress } from '../../../components/common/workflowModel'
import type { OrderDetail } from '../../../types/orders'
import type { ReviewStep } from '../reviewTypes'
import type { PlanningWorkflowInfo } from './OrderMissionPlanningSection'

function OrderStatusBadge({ order, lang }: { order: OrderDetail; lang: 'vi' | 'en' }) {
  return (
    <StatusBadge
      tone={toUiTone(order.status === 'PENDING' ? 'yellow' : orderStatusTone[order.status])}
    >
      {getOrderStatusLabel(order.status, lang)}
    </StatusBadge>
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
  const { t, locale, lang } = useI18n(orderReviewPageMessages)
  return (
    <div className="odm-or-review-top">
      {!showExecutionPlan && (
        <PageHeader
          back={<a href={managerHref({ screen: 'orderQueue' })}>{t.breadcrumb}</a>}
          title={t.pageTitle}
          subtitle={
            <>
              <span>{formatOrderCode(order.code)}</span> · {order.serviceName}
            </>
          }
          actions={<OrderStatusBadge order={order} lang={lang} />}
        />
      )}
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
      {showExecutionPlan && (
        <OrderServiceBanner
          serviceName={order.serviceName}
          serviceDescription={order.serviceDescription}
          deliverables={orderDeliverableLabels(order, locale)}
          deliverablesLabel={t.deliverableFormat}
          eyebrow={t.serviceEyebrow}
          meta={<OrderBannerMeta order={order} locale={locale} />}
        />
      )}
    </div>
  )
}
