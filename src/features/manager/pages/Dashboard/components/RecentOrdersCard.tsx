import { SearchOutlined } from '@ant-design/icons'
import { Avatar, Button, Input, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'

import {
  CardComponent,
  TableComponent,
} from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import type { RecentOrder } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'
import {
  formatDashboardDate,
  orderStatusTone,
  statusLabel,
} from '../dashboardHelpers'
import { TAG_COLOR } from '../dashboardTone'
import { DashboardEmptyState } from './DashboardEmptyState'

const MAX_ROWS = 6

export function RecentOrdersCard({
  orders,
  ordersAvailable,
  className,
}: {
  orders: RecentOrder[]
  ordersAvailable: boolean
  className?: string
}) {
  const { t, locale } = useI18n(dashboardPageMessages)
  const o = t.orders
  const vi = locale.startsWith('vi')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const statuses = Array.from(new Set(orders.map((ord) => ord.status)))
  const needle = query.trim().toLowerCase()
  const filtered = orders.filter((ord) => {
    if (statusFilter !== 'ALL' && ord.status !== statusFilter) return false
    if (!needle) return true
    return (
      ord.orderCode.toLowerCase().includes(needle) ||
      ord.customerName.toLowerCase().includes(needle) ||
      ord.serviceName.toLowerCase().includes(needle)
    )
  })

  const columns: ColumnsType<RecentOrder> = [
    {
      title: o.code,
      dataIndex: 'orderCode',
      render: (code: string, order) => (
        <a
          className="mgr-code"
          href={managerHref({ screen: 'orderReview', orderId: order.orderId })}
        >
          {code}
        </a>
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
        <Tag
          bordered={false}
          className="mgr-status-tag"
          color={TAG_COLOR[orderStatusTone(status)]}
        >
          <span className="mgr-dot" aria-hidden="true" />
          {t.analytics.statusLabels[status] ?? statusLabel(status)}
        </Tag>
      ),
    },
    {
      title: o.created,
      dataIndex: 'createdAt',
      render: (value: string) => (
        <span className="mgr-muted" style={{ whiteSpace: 'nowrap' }}>
          {formatDashboardDate(value)}
        </span>
      ),
    },
  ]

  return (
    <CardComponent
      className={className}
      title={o.title}
      extra={
        <a
          className="mgr-card-link"
          href={managerHref({ screen: 'orderQueue' })}
        >
          {o.viewAll}
        </a>
      }
      styles={{ body: { padding: orders.length > 0 ? 0 : 16 } }}
    >
      {!ordersAvailable ? (
        <div className="mgr-orders-empty-state" role="status">
          <DashboardEmptyState variant="NO_DATA" title={o.unavailable} />
        </div>
      ) : orders.length === 0 ? (
        <div className="mgr-orders-empty-state" role="status">
          <DashboardEmptyState
            variant="NO_DATA"
            title={o.empty}
            description={o.emptyDescription}
          />
        </div>
      ) : (
        <>
          <div className="mgr-orders-toolbar">
            <Input
              size="small"
              allowClear
              prefix={<SearchOutlined aria-hidden="true" />}
              placeholder={
                vi
                  ? 'Tìm mã đơn, khách hàng, dịch vụ…'
                  : 'Search order, customer, service…'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mgr-orders-search"
            />
            {statuses.length > 1 ? (
              <div className="mgr-orders-status-chips" role="group">
                <Button
                  size="small"
                  type={statusFilter === 'ALL' ? 'primary' : 'default'}
                  onClick={() => setStatusFilter('ALL')}
                >
                  {vi ? 'Tất cả' : 'All'} ({orders.length})
                </Button>
                {statuses.map((st) => (
                  <Button
                    key={st}
                    size="small"
                    type={statusFilter === st ? 'primary' : 'default'}
                    onClick={() => setStatusFilter(st)}
                  >
                    {t.analytics.statusLabels[st] ?? statusLabel(st)}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: 16 }}>
              <DashboardEmptyState
                variant="NO_DATA_FOR_FILTER"
                title={
                  vi
                    ? 'Không tìm thấy đơn hàng khớp bộ lọc.'
                    : 'No orders match the current filter.'
                }
                actionLabel={vi ? 'Xóa bộ lọc' : 'Clear filters'}
                onAction={() => {
                  setQuery('')
                  setStatusFilter('ALL')
                }}
              />
            </div>
          ) : (
            <TableComponent<RecentOrder>
              rowKey="orderId"
              columns={columns}
              dataSource={filtered.slice(0, MAX_ROWS)}
              pagination={false}
              scroll={{ x: 640 }}
            />
          )}
        </>
      )}
    </CardComponent>
  )
}
