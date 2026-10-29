import { PlusOutlined } from '@ant-design/icons'
import { Button, Skeleton } from 'antd'

import { CardComponent, ErrorState, PageHeader } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import { customerHref } from '../../routes'
import { DashboardStats } from './components/DashboardStats'
import { RecentMissionsCard } from './components/RecentMissionsCard'
import { RecentOrdersCard } from './components/RecentOrdersCard'
import { StatusBreakdown } from './components/StatusBreakdown'
import './dashboard.scss'
import { dashboardPageMessages } from './DashboardPage.messages'
import { useDashboardData } from './hooks/useDashboardData'

/** Customer overview computed client-side from the orders and mission history. */
export function DashboardPage() {
  const { t } = useI18n(dashboardPageMessages)
  const { orders, missions, stats, recent } = useDashboardData()

  return (
    <div className="cus-dash">
      <PageHeader
        title={t.title}
        description={t.subtitle}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            href={customerHref({ screen: 'createOrder' })}
          >
            {t.createOrder}
          </Button>
        }
      />

      {orders.loading && !orders.data && (
        <CardComponent>
          <Skeleton active paragraph={{ rows: 4 }} />
        </CardComponent>
      )}
      {!orders.data && !orders.loading && (
        <ErrorState title={t.ordersErrorTitle} error={orders.error} onRetry={orders.reload} />
      )}
      {orders.data && (
        <>
          <DashboardStats stats={stats} />
          <div className="cus-columns">
            <RecentOrdersCard orders={recent} />
            <StatusBreakdown stats={stats} />
          </div>
        </>
      )}

      <RecentMissionsCard
        missions={missions.data}
        loading={missions.loading}
        error={missions.error}
        onRetry={missions.reload}
      />
    </div>
  )
}
