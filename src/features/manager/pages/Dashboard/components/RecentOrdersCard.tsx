import { ShoppingOutlined } from '@ant-design/icons'
import { Avatar, Empty, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { CardComponent, TableComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import type { RecentOrder } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { TAG_COLOR } from '../dashboardTone'
import { formatDashboardDate, orderStatusTone, statusLabel } from '../dashboardHelpers'

const MAX_ROWS = 6

export function RecentOrdersCard({ orders, className }: { orders: RecentOrder[]; className?: string }) {
  const { t } = useI18n(dashboardPageMessages)
  const o = t.orders

  const columns: ColumnsType<RecentOrder> = [
    {
      title: o.code,
      dataIndex: 'orderCode',
      render: (code: string, order) => (
        <a className="mgr-code" href={managerHref({ screen: 'orderReview', orderId: order.orderId })}>{code}</a>
      ),
    },
    {
      title: o.customer,
      dataIndex: 'customerName',
      render: (name: string) => (
        <span className="mgr-cust">
          <Avatar size={28} className="mgr-cust-avatar" aria-hidden="true">
            {name.trim().charAt(0).toUpperCase()}
          </Avatar>
          <span>{name}</span>
        </span>
      ),
    },
    { title: o.service, dataIndex: 'serviceName' },
    {
      title: o.status,
      dataIndex: 'status',
      render: (status: string) => (
        <Tag bordered={false} className="mgr-status-tag" color={TAG_COLOR[orderStatusTone(status)]}>
          <span className="mgr-dot" aria-hidden="true" />
          {t.analytics.statusLabels[status] ?? statusLabel(status)}
        </Tag>
      ),
    },
    {
      title: o.created,
      dataIndex: 'createdAt',
      render: (value: string) => <span className="mgr-muted" style={{ whiteSpace: 'nowrap' }}>{formatDashboardDate(value)}</span>,
    },
  ]

  return (
    <CardComponent
      className={className}
      title={o.title}
      icon={<ShoppingOutlined />}
      extra={<a className="mgr-card-link" href={managerHref({ screen: 'orderQueue' })}>{o.viewAll}</a>}
      styles={{ body: { padding: 0 } }}
    >
      {orders.length === 0 ? (
        <Empty className="py-4" image={Empty.PRESENTED_IMAGE_SIMPLE} description={o.empty} />
      ) : (
        <TableComponent<RecentOrder>
          rowKey="orderId"
          columns={columns}
          dataSource={orders.slice(0, MAX_ROWS)}
          scroll={{ x: 640 }}
        />
      )}
    </CardComponent>
  )
}
