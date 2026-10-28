import { Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { formatOrderCode } from '../../../components/common/format'
import { MissionStatusTag } from '../../../components/common/MissionStatusTag'
import { StatusTag } from '../../../components/common/StatusTag'
import { assignmentReadiness } from '../../../lib/assignmentReadiness'
import { managerHref } from '../../../routes'
import type { MissionCalendarItem } from '../../../types/missions'
import {
  deliveryLabel,
  deliveryTone,
  formatScheduled,
  formatStaffSummary,
} from '../missionsHelpers'
import type { DeliveryStatus, PageMessages } from '../missionsTypes'

type Options = {
  t: PageMessages
  locale: 'vi-VN' | 'en-US'
  deliveryStatuses: Record<string, DeliveryStatus>
  orderDeliveryStatuses: Record<string, DeliveryStatus>
}

const stop = (event: { stopPropagation: () => void }) => event.stopPropagation()

export function missionsColumns({
  t,
  locale,
  deliveryStatuses,
  orderDeliveryStatuses,
}: Options): ColumnsType<MissionCalendarItem> {
  return [
    {
      title: t.columns.mission,
      key: 'mission',
      render: (_, m) => (
        <span className="mgr-cell-stack">
          <span className="mgr-code" title={m.missionCode}>{m.missionCode}</span>
          <a
            className="mgr-cell-sub mgr-order-link"
            href={managerHref({ screen: 'orderReview', orderId: m.orderId })}
            onClick={stop}
            aria-label={t.openOrderPlanOf(m.missionCode)}
          >
            {m.orderCode ? formatOrderCode(m.orderCode) : t.openOrderPlan}
          </a>
          <span className="mgr-cell-sub mgr-only-narrow">
            {formatScheduled(m.scheduledStartAt, m.scheduledEndAt, locale)}
          </span>
        </span>
      ),
    },
    {
      title: t.columns.schedule,
      key: 'schedule',
      responsive: ['md'],
      render: (_, m) => (
        <span className="mgr-nowrap">
          {formatScheduled(m.scheduledStartAt, m.scheduledEndAt, locale)}
        </span>
      ),
    },
    {
      title: t.columns.drone,
      key: 'drone',
      responsive: ['lg'],
      render: (_, m) =>
        m.droneCode ? `${m.droneCode}${m.droneName ? ` ${m.droneName}` : ''}` : '—',
    },
    {
      title: t.columns.crew,
      key: 'crew',
      responsive: ['lg'],
      render: (_, m) => formatStaffSummary(m.staffAssignments),
    },
    {
      title: t.columns.status,
      key: 'status',
      render: (_, m) => (
        <span className="mgr-cell-stack">
          <MissionStatusTag mission={m} />
          {assignmentReadiness(m).label ? (
            <small className="mgr-cell-sub">{assignmentReadiness(m).label}</small>
          ) : null}
        </span>
      ),
    },
    {
      title: t.columns.delivery,
      key: 'delivery',
      responsive: ['xl'],
      render: (_, m) => {
        const status = deliveryStatuses[m.id] ?? 'NOT_READY'
        if (status === 'NOT_READY' && !orderDeliveryStatuses[m.orderId]) {
          return <span className="mgr-cell-sub">—</span>
        }
        return (
          <span className="mgr-cell-stack">
            <StatusTag tone={deliveryTone(status)}>{deliveryLabel(status, t)}</StatusTag>
            {orderDeliveryStatuses[m.orderId] ? (
              <small className="mgr-cell-sub">
                {deliveryLabel(orderDeliveryStatuses[m.orderId], t)}
              </small>
            ) : null}
          </span>
        )
      },
    },
    {
      title: t.columns.action,
      key: 'action',
      align: 'right',
      render: (_, m) => (
        <span className="mgr-row-actions">
          <Button size="small" href={managerHref({ screen: 'missionDetail', missionId: m.id })} onClick={stop}>
            {t.view}
          </Button>
          {assignmentReadiness(m).needsSetup ? (
            <Button
              size="small"
              type="primary"
              href={managerHref({ screen: 'missionSetup', missionId: m.id })}
              onClick={stop}
            >
              {t.continueSetup}
            </Button>
          ) : null}
        </span>
      ),
    },
  ]
}
