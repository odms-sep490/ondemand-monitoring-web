import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { CardComponent, PageHeader } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import { ErrorState, LoadingState } from '../../components/common/StateView'
import { customerHref } from '../../routes'
import { OrdersEmpty } from './components/OrdersEmpty'
import { OrdersStats } from './components/OrdersStats'
import { OrdersTable } from './components/OrdersTable'
import { OrdersToolbar } from './components/OrdersToolbar'
import { useOrdersList } from './hooks/useOrdersList'
import { ordersPageMessages } from './OrdersPage.messages'

/** Customer order list backed by `GET /api/orders/mine`. */
export function OrdersPage() {
  const { t } = useI18n(ordersPageMessages)
  const list = useOrdersList()
  const showLoading = list.loading && !list.error

  return (
    <div className="cus-page ord-page">
      <PageHeader
        title={t.title}
        description={t.subtitle}
        actions={
          <Button type="primary" icon={<PlusOutlined aria-hidden="true" />} href={customerHref({ screen: 'createOrder' })}>
            {t.createOrder}
          </Button>
        }
      />
      {list.stats && <OrdersStats stats={list.stats} />}
      <OrdersToolbar
        status={list.status}
        query={list.query}
        stats={list.stats}
        onStatus={list.setStatus}
        onQuery={list.setQuery}
      />

      {showLoading && <LoadingState />}
      {!list.loading && list.error !== undefined && (
        <ErrorState title={t.errorTitle} error={list.error} onRetry={list.reload} />
      )}
      {!list.loading && list.error === undefined && list.rows.length === 0 && (
        <OrdersEmpty filtered={list.filtered} onClear={list.clear} />
      )}
      {!list.loading && list.error === undefined && list.rows.length > 0 && (
        <CardComponent styles={{ body: { padding: 0 } }}>
          <OrdersTable rows={list.rows} />
        </CardComponent>
      )}
    </div>
  )
}
