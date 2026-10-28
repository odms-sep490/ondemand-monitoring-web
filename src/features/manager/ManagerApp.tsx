import { useEffect, useState } from 'react'

import { FileSearchOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { CardComponent } from '../../shared/components/antd'
import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { managerApi } from './api/dashboardApi'
import { ManagerLayout } from './ManagerLayout'
import { MissionCreatePage } from './pages/MissionCreate'
import { DashboardPage } from './pages/Dashboard'
import { MissionDispatchPage } from './pages/MissionDispatch'
import { DronesPage } from './pages/Drones'
import { MaintenancePage } from './pages/Maintenance'
import { MissionDetailPage } from './pages/MissionDetail'
import { MissionsPage } from './pages/Missions'
import { OrderReviewPage } from './pages/OrderReview'
import { OrderQueuePage } from './pages/OrderQueue'
import { OrderResultsPage } from './pages/OrderResults'
import { SchedulePage } from './pages/Schedule'
import { StaffSupportDashboardPage } from '../support/pages/StaffSupportDashboardPage'
import { managerHref, parseManagerRoute, type ManagerRoute } from './routes'
import { useI18n } from '../../shared/i18n'
import { managerLayoutMessages } from './ManagerLayout.messages'
import { EmptyState } from './components/common/EmptyState'
import { ManagerErrorBoundary } from './components/common/ManagerErrorBoundary'

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return hash
}

const breadcrumbKey: Record<
  ManagerRoute['screen'],
  keyof (typeof managerLayoutMessages)['vi']['breadcrumbs']
> = {
  dashboard: 'dashboard',
  orderQueue: 'orders',
  orderReview: 'orders',
  orderResults: 'orders',
  missionCreate: 'orders',
  missionDispatch: 'missions',
  missionSetup: 'missionSetup',
  missionDetail: 'missionDetail',
  schedule: 'schedule',
  missions: 'missions',
  drones: 'drones',
  maintenance: 'maintenance',
  support: 'support',
  notFound: 'notFound',
}

/**
 * Root of the Manager (role MANAGER) area. Parses `#portal/manager...` hashes
 * into a `ManagerRoute` and renders the matching screen inside
 * `ManagerLayout`. Only MNG-01 (Dashboard) is implemented in this phase;
 * every other screen renders a temporary "đang được xây dựng" placeholder
 * that later phases (P4-P8) will replace.
 *
 * Fetches the dashboard once here (rather than inside `DashboardPage`) so
 * the sidebar pending-orders badge stays populated from real API data on
 * every screen, not just the dashboard itself.
 */
export function ManagerApp() {
  const hash = useHash()
  const { t } = useI18n(managerLayoutMessages)
  const route = parseManagerRoute(hash)
  const navCounts = useApiQuery((signal) => managerApi.getDashboard('30D', signal), [])

  const counts = navCounts.data?.summary
    ? { pendingOrders: navCounts.data.summary.pendingOrderCount }
    : undefined

  return (
    <ManagerLayout
      route={route}
      breadcrumb={t.breadcrumbs[breadcrumbKey[route.screen]]}
      counts={counts}
    >
      <ManagerErrorBoundary resetKey={hash}>
        {renderScreen(route, t.notFound)}
      </ManagerErrorBoundary>
    </ManagerLayout>
  )
}

function renderScreen(
  route: ManagerRoute,
  notFound: (typeof managerLayoutMessages)['vi']['notFound'],
) {
  if (route.screen === 'dashboard') return <DashboardPage />
  if (route.screen === 'orderQueue') return <OrderQueuePage />
  if (route.screen === 'orderReview')
    return <OrderReviewPage key={route.orderId} orderId={route.orderId} />
  if (route.screen === 'orderResults')
    return <OrderResultsPage key={route.orderId} orderId={route.orderId} />
  if (route.screen === 'missionCreate')
    return (
      <MissionCreatePage
        orderId={route.orderId}
      />
    )
  if (route.screen === 'missionDispatch')
    return (
      <MissionDispatchPage key={route.missionId} missionId={route.missionId} />
    )
  if (route.screen === 'missionSetup')
    return (
      <MissionDispatchPage
        key={route.missionId}
        missionId={route.missionId}
        setupMode
      />
    )
  if (route.screen === 'missionDetail')
    return <MissionDetailPage missionId={route.missionId} />
  if (route.screen === 'schedule') return <SchedulePage />
  if (route.screen === 'missions')
    return <MissionsPage missionId={route.missionId} />
  if (route.screen === 'drones') return <DronesPage droneId={route.droneId} />
  if (route.screen === 'maintenance') return <MaintenancePage />
  if (route.screen === 'support') return <StaffSupportDashboardPage />

  // route.screen === 'notFound'
  return (
    <div className="mgr-view">
      <CardComponent>
        <EmptyState
          icon={<FileSearchOutlined />}
          title={notFound.title}
          description={notFound.description}
          action={
            <Button type="primary" href={managerHref({ screen: 'dashboard' })}>
              {notFound.back}
            </Button>
          }
        />
      </CardComponent>
    </div>
  )
}
