import { ArrowLeftOutlined } from '@ant-design/icons'

import { WorkflowStepper } from '../../../components/common/WorkflowStepper'
import { getOrderStatusLabel } from '../../../../../shared/lib/statusTone'
import { orderStageToReviewStep } from '../../../components/common/workflowModel'
import { PageHeader } from '../../../components/common/PageHeader'
import { StatusTag } from '../../../components/common/StatusTag'
import { orderStatusTone } from '../../../../../shared/lib/statusTone'
import { formatOrderCode } from '../../../components/common/format'
import { managerHref } from '../../../routes'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import { OrderDetailsDrawer } from '../../../components/common/OrderDetailsDrawer'
import { OrderIcon } from '../../../components/common/OrderIcon'
import type { OrderProgress } from '../../../components/common/workflowModel'
import type { OrderDetail } from '../../../types/orders'
import type { ReviewStep } from '../reviewTypes'

function OrderStatusBadge({
  order,
  lang,
}: {
  order: OrderDetail
  lang: 'vi' | 'en'
}) {
  return (
    <StatusTag
      tone={
        order.status === 'PENDING' ? 'yellow' : orderStatusTone[order.status]
      }
    >
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
}: {
  showExecutionPlan: boolean
  stepperProgress: OrderProgress
  order: OrderDetail
  viewStage: 'intake' | 'criteria' | 'decision' | 'deposit' | 'planning' | null
  openStage: (
    stage: 'intake' | 'criteria' | 'decision' | 'deposit' | 'planning',
  ) => void
  goToStep: (step: ReviewStep) => void
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
            <span className="odm-or-hero-title">
              <span className="odm-or-hero-icon">
                <OrderIcon name="doc" size={26} />
              </span>
              <span>{t.orderManagementTitle}</span>
            </span>
          )
        }
        description={
          showExecutionPlan ? (
            `${t.pageTitle} · ${order.serviceName}`
          ) : (
            t.orderManagementSubtitle
          )
        }
        actions={
          <div className="odm-or-order-page-actions">
            <OrderDetailsDrawer order={order} />
          </div>
        }
      >
        {!showExecutionPlan ? (
          <div className="odm-or-hero-meta">
            <OrderStatusBadge order={order} lang={lang} />
            <span className="odm-mono">{formatOrderCode(order.code)}</span>
          </div>
        ) : null}
      </PageHeader>
      <WorkflowStepper
        order={{
          progress: stepperProgress,
          viewing: viewStage,
          onSelect: (stage) =>
            showExecutionPlan
              ? openStage(stage)
              : goToStep(orderStageToReviewStep(stage) ?? 1),
          // Navigate with the actions below.
          selectable: () => false,
        }}
      />
    </div>
  )
}
