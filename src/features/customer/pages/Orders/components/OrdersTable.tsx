import { ArrowRightOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { TableComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { useTimeslotLabel } from '../../../hooks/usePreferredTimes'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { formatDateRange } from '../../../lib/orders/format'
import type { OrderRow } from '../../../lib/orders/types'
import { OrderStatusBadge } from '../../../components/common/OrderStatusBadge'
import { customerHref } from '../../../routes'
import { ordersTableMessages } from './OrdersTable.messages'

const DASH = '—'

export function OrdersTable({ rows }: { rows: OrderRow[] }) {
  const { t, locale, lang } = useI18n(ordersTableMessages)
  const timeLabel = useTimeslotLabel()
  const c = t.columns

  const columns: ColumnsType<OrderRow> = [
    {
      title: c.order,
      key: 'order',
      render: (_, row) => (
        <span className="mgr-cell-stack">
          <a
            className="cus-order-title"
            href={customerHref({ screen: 'orderDetail', orderId: row.id })}
          >
            {row.title}
          </a>
          <span className="mgr-cell-sub mgr-code">{row.code}</span>
        </span>
      ),
    },
    {
      title: c.location,
      key: 'location',
      className: 'cus-hide-lg',
      render: (_, row) => <span className="mgr-muted">{row.address ?? DASH}</span>,
    },
    {
      title: c.schedule,
      key: 'schedule',
      className: 'cus-hide-md',
      render: (_, row) => (
        <span className="mgr-cell-stack">
          <span className="mgr-nowrap">
            {formatDateRange(row.dateFrom, row.dateTo, locale) ?? DASH}
          </span>
          {row.timeName || row.timeId ? (
            <span className="mgr-cell-sub">
              {timeLabel({ id: row.timeId, name: row.timeName })}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      title: c.service,
      key: 'service',
      className: 'cus-hide-xl',
      render: (_, row) =>
        row.serviceName
          ? localizeServiceName(row.serviceId ?? row.serviceName, lang, row.serviceName)
          : DASH,
    },
    {
      title: c.status,
      key: 'status',
      render: (_, row) => (
        <span className="mgr-cell-stack">
          <OrderStatusBadge status={row.status} />
          {row.depositState === 'ACTION_REQUIRED' ? (
            <span className="cus-deposit">{t.paymentRequired}</span>
          ) : row.depositState === 'PAID' ? (
            <span className="cus-deposit-paid">{t.depositPaid}</span>
          ) : null}
        </span>
      ),
    },
    {
      title: c.actions,
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Button
          size="small"
          href={customerHref({ screen: 'orderDetail', orderId: row.id })}
          icon={<ArrowRightOutlined aria-hidden="true" />}
          iconPosition="end"
          title={row.status === 'NEEDS_INFO' ? t.addInformation : t.view}
        >
          <span className="cus-act-label">
            {row.status === 'NEEDS_INFO' ? t.addInformation : t.view}
          </span>
        </Button>
      ),
    },
  ]

  return <TableComponent<OrderRow> rowKey="id" columns={columns} dataSource={rows} />
}
