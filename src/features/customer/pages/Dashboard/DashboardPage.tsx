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

      {orders.data && (
        <>
          <DashboardStats stats={stats} />
          <div className="cus-content-grid">
            <div className="cus-main-column">
              <RecentOrdersCard orders={recent} />
              <RecentMissionsCard
                missions={missions.data}
                loading={missions.loading}
                error={missions.error}
                onRetry={missions.reload}
              />
            </div>
            <StatusBreakdown stats={stats} />
          </div>
        </>
      )}
      {!orders.data && (
        <div className="cus-content-fallback">
          {orders.loading ? (
            <CardComponent className="cus-orders-loading">
              <Skeleton active paragraph={{ rows: 4 }} />
            </CardComponent>
          ) : (
            <ErrorState title={t.ordersErrorTitle} error={orders.error} onRetry={orders.reload} />
          )}
          <RecentMissionsCard
            missions={missions.data}
            loading={missions.loading}
            error={missions.error}
            onRetry={missions.reload}
          />
        </div>
      )}
    </div>
  )
}
