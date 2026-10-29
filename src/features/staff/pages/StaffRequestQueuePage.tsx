import { useEffect, useState } from 'react'
import { Button, message } from 'antd'
import {
  CardComponent,
  EmptyState,
  PageHeader,
  TableComponent,
} from '../../../shared/components/antd'
import { PageFrame } from '../../../shared/components/antd/PageFrame'
import { useI18n } from '../../../shared/i18n'
import { orderApi, type OrderCreateResponse } from '../../customer/api/orderApi'
import { localizeTimeslot } from '../../manager/lib/viLabels'
import { staffRequestQueuePageMessages } from './StaffRequestQueuePage.messages'

export function StaffRequestQueuePage() {
  const { t } = useI18n(staffRequestQueuePageMessages)
  const [orders, setOrders] = useState<OrderCreateResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await orderApi.getPendingOrders()
      setOrders(data || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleApprove = async (orderId: string) => {
    try {
      await orderApi.approveOrder(orderId)
      fetchOrders()
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : t.approveFailed)
    }
  }

  return (
    <PageFrame maxWidth={1280}>
      <PageHeader title={t.title} description={t.subtitle} />
      <CardComponent
        title={t.pendingOrders}
        extra={<Button onClick={fetchOrders}>{t.refresh}</Button>}
      >
        {loading ? (
          <p>{t.loading}</p>
        ) : error ? (
          <p role="alert" style={{ color: 'var(--ui-danger-text)' }}>
            {error}
          </p>
        ) : orders.length === 0 ? (
          <EmptyState title={t.noOrders} />
        ) : (
          <TableComponent<OrderCreateResponse>
            rowKey="id"
            dataSource={orders}
            pagination={false}
            scroll={{ x: 900 }}
            columns={[
              {
                title: t.orderId,
                dataIndex: 'id',
                render: (id: string) => <span className="mgr-code">{id}</span>,
              },
              {
                title: t.orderTitle,
                render: (_: unknown, order) => (
                  <div className="mgr-cell-stack">
                    <strong>{order.title}</strong>
                    <span className="mgr-cell-sub">{order.serviceName}</span>
                  </div>
                ),
              },
              {
                title: t.customer,
                render: (_: unknown, order) =>
                  order.customerName || order.customerId,
              },
              {
                title: t.preferredDate,
                render: (_: unknown, order) => (
                  <div className="mgr-cell-stack">
                    <span>
                      {[order.preferredDateFrom, order.preferredDateTo]
                        .filter(Boolean)
                        .join(' → ')}
                    </span>
                    <span className="mgr-cell-sub">
                      {localizeTimeslot(order.preferredTimeName)}
                    </span>
                  </div>
                ),
              },
              { title: t.location, dataIndex: 'address' },
              {
                title: t.actions,
                width: 120,
                render: (_: unknown, order) => (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleApprove(order.id)}
                  >
                    {t.approve}
                  </Button>
                ),
              },
            ]}
          />
        )}
      </CardComponent>
    </PageFrame>
  )
}
