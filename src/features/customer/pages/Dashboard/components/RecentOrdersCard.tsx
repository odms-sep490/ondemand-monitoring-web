import { ArrowRightOutlined, PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import {
  CardComponent,
  EmptyState,
  TableComponent,
} from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { useTimeslotLabel } from '../../../hooks/usePreferredTimes'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { formatDateRange } from '../../../lib/orders/format'
import type { OrderRow } from '../../../lib/orders/types'
import { customerHref } from '../../../routes'
import { OrderStatusTag } from './OrderStatusTag'
import { recentOrdersMessages } from './RecentOrdersCard.messages'

export function RecentOrdersCard({ orders }: { orders: OrderRow[] }) {
  const { t, locale, lang } = useI18n(recentOrdersMessages)
  const timeLabel = useTimeslotLabel()

  const scheduleFor = (order: OrderRow) => {
    const frequency =
      order.recurrenceType === 'WEEKLY'
        ? t.recurrence.weekly
        : order.recurrenceType === 'MONTHLY'
          ? t.recurrence.monthly
          : null

    return {
      date: formatDateRange(order.dateFrom, order.dateTo, locale) ?? '—',
      time:
        order.timeName || order.timeId
          ? timeLabel({ id: order.timeId, name: order.timeName })
          : null,
      recurrence:
        frequency && order.recurrenceOccurrences
          ? t.recurrence.summary(frequency, order.recurrenceOccurrences)
          : null,
    }
  }

  const nextStepFor = (order: OrderRow) => {
    if (order.missionPaymentState === 'ACTION_REQUIRED') return t.missionPaymentRequired
    if (order.depositState === 'ACTION_REQUIRED') return t.depositRequired

    switch (order.status) {
      case 'DRAFT':
        return t.nextStep.draft
      case 'SUBMITTED':
      case 'PENDING':
        return t.nextStep.waitingReview
      case 'UNDER_REVIEW':
        return t.nextStep.underReview
      case 'NEEDS_INFO':
        return t.nextStep.needsInfo
      case 'APPROVED':
        return t.nextStep.approved
      case 'SCHEDULED':
        return t.nextStep.scheduled
      case 'IN_PROGRESS':
        return t.nextStep.inProgress
      case 'COMPLETED':
        return t.nextStep.completed
      case 'REJECTED':
        return t.nextStep.rejected
      case 'CANCELLED':
        return t.nextStep.cancelled
    }
  }

  const actionFor = (order: OrderRow) => {
    if (order.missionPaymentState === 'ACTION_REQUIRED') return t.actions.payMission
    if (order.depositState === 'ACTION_REQUIRED') return t.actions.payDeposit
    if (order.status === 'NEEDS_INFO') return t.actions.addInformation
    if (order.status === 'DRAFT') return t.actions.continue
    return t.actions.view
  }

  const columns: ColumnsType<OrderRow> = [
    {
      title: t.columns.order,
      dataIndex: 'title',
      render: (title: string, order) => {
        const schedule = scheduleFor(order)
        const service = order.serviceName
          ? localizeServiceName(
              order.serviceId ?? order.serviceName,
              lang,
              order.serviceName,
            )
          : null

        return (
          <span className="mgr-cell-stack">
            <a
              className="cus-order-title"
              href={customerHref({ screen: 'orderDetail', orderId: order.id })}
            >
              {title}
            </a>
            <span className="mgr-cell-sub mgr-code">
              {order.code}{service ? ` · ${service}` : ''}
            </span>
            {order.address ? <span className="mgr-cell-sub">{order.address}</span> : null}
            <span className="cus-order-date">
              {t.columns.date}: {schedule.date}
              {schedule.time ? ` · ${schedule.time}` : ''}
              {schedule.recurrence ? ` · ${schedule.recurrence}` : ''}
            </span>
          </span>
        )
      },
    },
    {
      title: t.columns.date,
      key: 'date',
      responsive: ['md'],
      render: (_, order) => {
        const schedule = scheduleFor(order)
        return (
          <span className="mgr-cell-stack">
            <span className="mgr-muted mgr-nowrap">{schedule.date}</span>
            {schedule.time ? <span className="mgr-cell-sub">{schedule.time}</span> : null}
            {schedule.recurrence ? (
              <span className="mgr-cell-sub">{schedule.recurrence}</span>
            ) : null}
          </span>
        )
      },
    },
    {
      title: t.columns.status,
      dataIndex: 'status',
      render: (_, order) => {
        const requiresAction =
          order.status === 'NEEDS_INFO' ||
          order.depositState === 'ACTION_REQUIRED' ||
          order.missionPaymentState === 'ACTION_REQUIRED'
        const actionLabel = actionFor(order)

        return (
          <span className="mgr-cell-stack cus-order-status">
            <OrderStatusTag status={order.status} />
            <span className={`cus-order-next-step${requiresAction ? ' is-action' : ''}`}>
              {nextStepFor(order)}
            </span>
            <Button
              className="cus-order-action"
              type="link"
              size="small"
              href={customerHref({ screen: 'orderDetail', orderId: order.id })}
              icon={<ArrowRightOutlined aria-hidden="true" />}
              iconPosition="end"
              aria-label={`${actionLabel}: ${order.code}`}
            >
              {actionLabel}
            </Button>
          </span>
        )
      },
    },
  ]

  return (
    <CardComponent
      title={t.title}
      className="cus-orders-card"
      extra={
        <a className="mgr-card-link" href={customerHref({ screen: 'orders' })}>
          {t.viewAll}
        </a>
      }
      styles={{ body: { padding: 0 } }}
    >
      {orders.length === 0 ? (
        <EmptyState
          title={t.emptyTitle}
          description={t.emptyDescription}
          action={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              href={customerHref({ screen: 'createOrder' })}
            >
              {t.emptyAction}
            </Button>
          }
        />
      ) : (
        <TableComponent<OrderRow>
          rowKey="id"
          columns={columns}
          dataSource={orders}
        />
      )}
    </CardComponent>
  )
}
