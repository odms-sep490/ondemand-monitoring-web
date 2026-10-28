import { PlusOutlined, ShoppingOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import {
  CardComponent,
  EmptyState,
  TableComponent,
} from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { formatDateRange } from '../../../lib/orders/format'
import type { OrderRow } from '../../../lib/orders/types'
import { customerHref } from '../../../routes'
import { OrderStatusTag } from './OrderStatusTag'
import { recentOrdersMessages } from './RecentOrdersCard.messages'

export function RecentOrdersCard({ orders }: { orders: OrderRow[] }) {
  const { t, locale } = useI18n(recentOrdersMessages)

  const columns: ColumnsType<OrderRow> = [
    {
      title: t.columns.order,
      dataIndex: 'title',
      render: (title: string, order) => (
        <span className="mgr-cell-stack">
          <a
            className="cus-order-title"
            href={customerHref({ screen: 'orderDetail', orderId: order.id })}
          >
            {title}
          </a>
          {order.address ? <span className="mgr-cell-sub">{order.address}</span> : null}
        </span>
      ),
    },
    {
      title: t.columns.date,
      key: 'date',
      render: (_, order) => (
        <span className="mgr-muted mgr-nowrap">
          {formatDateRange(order.dateFrom, order.dateTo, locale) ?? '—'}
        </span>
      ),
    },
    {
      title: t.columns.status,
      dataIndex: 'status',
      render: (_, order) => (
        <span className="mgr-cell-stack">
          <OrderStatusTag status={order.status} />
          {order.depositState === 'ACTION_REQUIRED' ? (
            <span className="cus-deposit">{t.depositRequired}</span>
          ) : null}
        </span>
      ),
    },
  ]

  return (
    <CardComponent
      title={t.title}
      icon={<ShoppingOutlined />}
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
          scroll={{ x: 520 }}
        />
      )}
    </CardComponent>
  )
}
