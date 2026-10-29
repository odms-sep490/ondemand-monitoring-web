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
import type { OrderCreateResponse } from '../../../types/orders'
import { orderQueuePageMessages } from '../OrderQueuePage.messages'

export type QueueTableMode = 'pending' | 'ready' | 'all'

type Props = {
  rows: OrderCreateResponse[]
  total: number
  mode: QueueTableMode
  /** True when an APPROVED order already has a live mission. */
  isInProgress?: (order: OrderCreateResponse) => boolean
}

export function QueueTable({ rows, total, mode, isInProgress }: Props) {
  const { t, locale, lang } = useI18n(orderQueuePageMessages)
  const now = new Date()
  const labels = lang === 'en' ? orderStatusLabelEn : orderStatusLabel
  const actionLabel = mode === 'pending' ? t.review : mode === 'ready' ? t.plan : t.view

  const columns: ColumnsType<OrderCreateResponse> = [
    {
      title: t.columns.order,
      key: 'order',
      render: (_, row) => (
        <span className="mgr-cust">
          <Avatar size={34} className="mgr-cust-avatar" aria-hidden="true">
            {row.customerName.trim().charAt(0).toUpperCase()}
          </Avatar>
          <span className="mgr-cell-stack">
            <span className="mgr-code" title={displayOrderCode(row.orderCode, row.id)}>
              {displayOrderCode(row.orderCode, row.id)}
            </span>
            <span className="mgr-cell-sub">{row.customerName}</span>
          </span>
        </span>
      ),
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
        return mode === 'ready' ? (
          <StatusTag tone="success">{t.depositReceived}</StatusTag>
        ) : (
          <StatusTag tone={orderStatusTone[row.orderStatus] ?? 'gray'}>
            {running ? t.filters.IN_PROGRESS : (labels[row.orderStatus] ?? row.orderStatus)}
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
