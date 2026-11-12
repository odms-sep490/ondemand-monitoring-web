import { Avatar, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { CardComponent, TableComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { displayOrderCode } from '../../../../../shared/lib/orderCode'
import {
  orderStatusLabel,
  orderStatusLabelEn,
  orderStatusTone,
} from '../../../../../shared/lib/statusTone'
import { StatusTag } from '../../../components/common/StatusTag'
import { formatOrderAge } from '../../../lib/actionItemAge'
import { localizeTimeslot } from '../../../lib/viLabels'
import { managerHref } from '../../../routes'
import type { DepositStatus } from '../../../../finance/types'
import type { OrderCreateResponse } from '../../../types/orders'
import { orderQueuePageMessages } from '../OrderQueuePage.messages'

export type QueueTableMode = 'pending' | 'ready' | 'all'

type Props = {
  rows: OrderCreateResponse[]
  total: number
  mode: QueueTableMode
  depositStatusByOrder?: Record<string, DepositStatus>
  missionPaymentDueByOrder?: Record<string, boolean>
  /** True when an APPROVED order already has a live mission. */
  isInProgress?: (order: OrderCreateResponse) => boolean
}

export function QueueTable({
  rows,
  total,
  mode,
  isInProgress,
  depositStatusByOrder = {},
  missionPaymentDueByOrder = {},
}: Props) {
  const { t, locale, lang } = useI18n(orderQueuePageMessages)
  const now = new Date()
  const labels = lang === 'en' ? orderStatusLabelEn : orderStatusLabel
  const actionLabel = mode === 'pending' ? t.review : mode === 'ready' ? t.plan : t.view

  const columns: ColumnsType<OrderCreateResponse> = [
    {
      title: t.columns.order,
      key: 'order',
      render: (_, row) => {
        const depositStatus = depositStatusByOrder[row.id]
        return (
          <span className="mgr-cust">
            <Avatar size={34} className="mgr-cust-avatar" aria-hidden="true">
              {row.customerName.trim().charAt(0).toUpperCase()}
            </Avatar>
            <span className="mgr-cell-stack">
              <span className="mgr-code" title={displayOrderCode(row.orderCode, row.id)}>
                {displayOrderCode(row.orderCode, row.id)}
              </span>
              <span className="mgr-cell-sub">{row.customerName}</span>
              {depositStatus ? (
                <span>
                  <StatusTag tone={depositStatus === 'DEPOSIT_PAID' ? 'success' : 'warning'}>
                    {depositStatus === 'DEPOSIT_PAID' ? t.depositPaid : t.depositWaiting}
                  </StatusTag>
                </span>
              ) : null}
            </span>
          </span>
        )
      },
    },
    { title: t.columns.service, dataIndex: 'serviceName', key: 'service', responsive: ['md'] },
    {
      title: t.columns.preferred,
      key: 'preferred',
      responsive: ['md'],
      render: (_, row) => (
        <span className="mgr-cell-stack mgr-nowrap">
          <span>{new Date(row.preferredDateFrom).toLocaleDateString(locale)}</span>
          <span className="mgr-cell-sub">{localizeTimeslot(row.preferredTimeName)}</span>
        </span>
      ),
    },
    {
      title: t.columns.waiting,
      key: 'waiting',
      responsive: ['md'],
      render: (_, row) => (
        <span className="mgr-cell-sub mgr-nowrap">{formatOrderAge(now, row.createdAt, 24, lang)}</span>
      ),
    },
    {
      title: t.columns.status,
      key: 'status',
      render: (_, row) => {
        const running = row.orderStatus === 'APPROVED' && isInProgress?.(row)
        const missionPaymentDue = missionPaymentDueByOrder[row.id]
        return (
          <StatusTag
            tone={missionPaymentDue ? 'warning' : orderStatusTone[row.orderStatus] ?? 'gray'}
          >
            {missionPaymentDue
              ? t.missionPaymentDue
              : running
                ? t.filters.IN_PROGRESS
                : (labels[row.orderStatus] ?? row.orderStatus)}
          </StatusTag>
        )
      },
    },
    {
      title: t.columns.action,
      key: 'action',
      align: 'right',
      render: (_, row) => (
        <Button
          size="small"
          type={mode === 'all' ? 'default' : 'primary'}
          style={mode === 'all' ? undefined : { color: '#fff' }}
          href={managerHref({
            screen: row.orderStatus === 'COMPLETED' ? 'orderResults' : 'orderReview',
            orderId: row.id,
          })}
        >
          {actionLabel}
        </Button>
      ),
    },
  ]

  return (
    <CardComponent styles={{ body: { padding: 0 } }}>
      <TableComponent<OrderCreateResponse>
        rowKey="id"
        columns={columns}
        dataSource={rows}
      />
      <div className="mgr-table-foot">{t.resultCount(rows.length, total)}</div>
    </CardComponent>
  )
}
