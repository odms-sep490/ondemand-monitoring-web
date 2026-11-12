import { lazy, Suspense, useEffect, useState } from 'react'

import { FileSearchOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { CardComponent } from '../../shared/components/antd'
import { ManagerLayout } from './ManagerLayout'
import { managerHref, parseManagerRoute, type ManagerRoute } from './routes'
import { useI18n } from '../../shared/i18n'
import { managerLayoutMessages } from './ManagerLayout.messages'
import { EmptyState } from './components/common/EmptyState'
import { ManagerErrorBoundary } from './components/common/ManagerErrorBoundary'
import { useManagerNavigationNotifications } from './hooks/useManagerNavigationNotifications'

const MissionCreatePage = lazy(() =>
  import('./pages/MissionCreate').then((m) => ({
    default: m.MissionCreatePage,
  })),
)
const ReworkPlanningPage = lazy(() =>
  import('./pages/MissionCreate/ReworkPlanningPage').then((m) => ({
    default: m.ReworkPlanningPage,
  })),
)
const DashboardPage = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.DashboardPage })),
)
const MissionDispatchPage = lazy(() =>
  import('./pages/MissionDispatch').then((m) => ({
    default: m.MissionDispatchPage,
  })),
)
const DronesPage = lazy(() =>
  import('./pages/Drones').then((m) => ({ default: m.DronesPage })),
)
const MaintenancePage = lazy(() =>
  import('./pages/Maintenance').then((m) => ({ default: m.MaintenancePage })),
)
const MissionDetailPage = lazy(() =>
  import('./pages/MissionDetail').then((m) => ({
    default: m.MissionDetailPage,
  })),
)
const MissionsPage = lazy(() =>
  import('./pages/Missions').then((m) => ({ default: m.MissionsPage })),
)
const OrderReviewPage = lazy(() =>
  import('./pages/OrderReview').then((m) => ({ default: m.OrderReviewPage })),
)
const OrderQueuePage = lazy(() =>
  import('./pages/OrderQueue').then((m) => ({ default: m.OrderQueuePage })),
)
const OrderResultsPage = lazy(() =>
  import('./pages/OrderResults').then((m) => ({ default: m.OrderResultsPage })),
)
const SchedulePage = lazy(() =>
  import('./pages/Schedule').then((m) => ({ default: m.SchedulePage })),
)
const StaffSupportDashboardPage = lazy(() =>
  import('../support/pages/StaffSupportDashboardPage').then((m) => ({
    default: m.StaffSupportDashboardPage,
  })),
)
const NotificationsPage = lazy(() =>
  import('../notifications/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
)

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
  notifications: 'notifications',
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
 * Watches pending orders and rejected crew assignments at the app shell so
 * unread badges stay current on every manager screen.
 */
export function ManagerApp() {
  const hash = useHash()
  const { t } = useI18n(managerLayoutMessages)
  const route = parseManagerRoute(hash)
  const notifications = useManagerNavigationNotifications(route)
  const counts = {
    pendingOrders: notifications.pendingOrders,
    pendingMissions: notifications.pendingMissions,
  }

  return (
    <ManagerLayout
      route={route}
      breadcrumb={t.breadcrumbs[breadcrumbKey[route.screen]]}
      counts={counts}
    >
      <ManagerErrorBoundary resetKey={hash}>
        <Suspense fallback={null}>
          {renderScreen(
            route,
            t.notFound,
            notifications.resourceAlertKeysByMission,
            notifications.missionsLoaded,
          )}
        </Suspense>
      </ManagerErrorBoundary>
    </ManagerLayout>
  )
}

function renderScreen(
  route: ManagerRoute,
  notFound: (typeof managerLayoutMessages)['vi']['notFound'],
  resourceAlertKeysByMission: Record<string, string[]>,
  resourceAlertsLoaded: boolean,
) {
  if (route.screen === 'dashboard') return <DashboardPage />
  if (route.screen === 'orderQueue') return <OrderQueuePage />
  if (route.screen === 'orderReview')
    return <OrderReviewPage key={route.orderId} orderId={route.orderId} />
  if (route.screen === 'orderResults')
    return <OrderResultsPage key={route.orderId} orderId={route.orderId} />
  if (route.screen === 'missionCreate')
    return route.reworkCaseId ? (
      <ReworkPlanningPage
        key={`${route.orderId}:${route.reworkCaseId}`}
        orderId={route.orderId}
        caseId={route.reworkCaseId}
      />
    ) : (
      <MissionCreatePage
        key={`${route.orderId}:${route.reworkCaseId ?? 'original'}`}
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
    return (
      <MissionDetailPage
        missionId={route.missionId}
        resourceAlertKeys={
          resourceAlertsLoaded
            ? (resourceAlertKeysByMission[route.missionId] ?? [])
            : undefined
        }
      />
    )
  if (route.screen === 'schedule')
    return (
      <SchedulePage
        key={`${route.assignmentMissionId ?? 'office'}:${route.assignmentReplaceStaffId ?? ''}`}
        assignmentMissionId={route.assignmentMissionId}
        assignmentCanEdit={route.assignmentCanEdit}
        assignmentReplaceStaffId={route.assignmentReplaceStaffId}
        assignmentReturnOrderId={route.assignmentReturnOrderId}
      />
    )
  if (route.screen === 'missions')
    return <MissionsPage missionId={route.missionId} />
  if (route.screen === 'drones')
    return (
      <DronesPage
        key={`${route.droneId ?? ''}:${route.assignmentMissionId ?? ''}`}
        droneId={route.droneId}
        assignmentMissionId={route.assignmentMissionId}
      />
    )
  if (route.screen === 'maintenance') return <MaintenancePage />
  if (route.screen === 'notifications')
    return <NotificationsPage role="MANAGER" />
  if (route.screen === 'support')
    return <StaffSupportDashboardPage initialTicketId={route.ticketId} />

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
