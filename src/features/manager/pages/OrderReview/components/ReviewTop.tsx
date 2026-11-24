import { ArrowLeftOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Button, Form, Input, Modal, message } from 'antd'
import { useState } from 'react'

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
  onCancelOrder,
}: {
  showExecutionPlan: boolean
  stepperProgress: OrderProgress
  order: OrderDetail
  viewStage: 'intake' | 'criteria' | 'decision' | 'deposit' | 'planning' | null
  openStage: (
    stage: 'intake' | 'criteria' | 'decision' | 'deposit' | 'planning',
  ) => void
  goToStep: (step: ReviewStep) => void
  onCancelOrder?: (reason: string) => Promise<void>
}) {
  const { t, lang } = useI18n(orderReviewPageMessages)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const isTerminalStatus =
    order.status === 'CANCELLED' ||
    order.status === 'COMPLETED' ||
    order.status === 'REJECTED'
  const showCancelButton = Boolean(onCancelOrder)
  const canCancel = showCancelButton && !isTerminalStatus

  const submitCancellation = async () => {
    const reason = cancelReason.trim()
    if (!reason || !onCancelOrder) {
      setCancelError(t.cancelOrderReasonRequired)
      return
    }
    setCancelling(true)
    setCancelError(null)
    try {
      await onCancelOrder(reason)
      setCancelModalOpen(false)
      setCancelReason('')
      message.success(t.cancelOrderSuccess)
    } catch (error) {
      setCancelError(
        error instanceof Error ? error.message : t.cancelOrderFailed,
      )
    } finally {
      setCancelling(false)
    }
  }

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
            {showCancelButton ? (
              <Button
                danger
                disabled={!canCancel}
                icon={<CloseCircleOutlined aria-hidden="true" />}
                onClick={() => {
                  setCancelError(null)
                  setCancelReason('')
                  setCancelModalOpen(true)
                }}
              >
                {t.cancelOrder}
              </Button>
            ) : null}
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
      <Modal
        open={cancelModalOpen}
        title={t.cancelOrderTitle}
        okText={t.confirmCancelOrder}
        cancelText={t.keepOrder}
        okButtonProps={{ danger: true, disabled: !cancelReason.trim() }}
        confirmLoading={cancelling}
        onCancel={() => {
          if (!cancelling) {
            setCancelModalOpen(false)
            setCancelReason('')
            setCancelError(null)
          }
        }}
        onOk={() => void submitCancellation()}
        destroyOnHidden
      >
        <p>{t.cancelOrderHint}</p>
        <Form.Item
          label={t.cancelOrderReasonLabel}
          required
          validateStatus={cancelError ? 'error' : undefined}
          help={cancelError}
        >
          <Input.TextArea
            id="order-cancel-reason"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value.slice(0, 1000))}
            placeholder={t.cancelOrderReasonPlaceholder}
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={1000}
            showCount
            aria-required="true"
          />
        </Form.Item>
      </Modal>
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
