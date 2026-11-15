import { Button } from 'antd'
import { lazy, Suspense, useEffect, useState } from 'react'

import { EmptyState, LoadingState } from './components/common/StateView'
import { useI18n } from '../../shared/i18n'
import { customerAppMessages } from './CustomerApp.messages'
import { CustomerLayout } from './CustomerLayout'
import { customerHref, parseCustomerRoute, type CustomerRoute } from './routes'

const CreateOrderPage = lazy(() =>
  import('./pages/CreateOrder').then((m) => ({ default: m.CreateOrderPage })),
)
const LivePage = lazy(() =>
  import('./pages/Live').then((m) => ({ default: m.LivePage })),
)
const LiveHubPage = lazy(() =>
  import('./pages/LiveHub').then((m) => ({ default: m.LiveHubPage })),
)
const MediaDetailPage = lazy(() =>
  import('./pages/MediaDetail').then((m) => ({ default: m.MediaDetailPage })),
)
const MediaLibraryPage = lazy(() =>
  import('./pages/MediaLibrary').then((m) => ({ default: m.MediaLibraryPage })),
)
const MediaPage = lazy(() =>
  import('./pages/Media').then((m) => ({ default: m.MediaPage })),
)
const OrderDetailPage = lazy(() =>
  import('./pages/OrderDetail').then((m) => ({ default: m.OrderDetailPage })),
)
const OrdersPage = lazy(() =>
  import('./pages/Orders').then((m) => ({ default: m.OrdersPage })),
)
const CustomerMissionReportPage = lazy(() =>
  import('./components/reports/CustomerMissionReportPage').then((m) => ({ default: m.CustomerMissionReportPage })),
)
const NotificationsPage = lazy(() =>
  import('../notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
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

export function CustomerApp() {
  const hash = useHash()
  const route = parseCustomerRoute(hash)
  const { t } = useI18n(customerAppMessages)

  return (
    <CustomerLayout route={route} breadcrumb={t.breadcrumb[route.screen]}>
      <Suspense fallback={<LoadingState />}>{renderScreen(route, t)}</Suspense>
    </CustomerLayout>
  )
}

function renderScreen(
  route: CustomerRoute,
  t: (typeof customerAppMessages)['vi'],
) {
  if (route.screen === 'missionReport')
    return (
      <CustomerMissionReportPage
        orderId={route.orderId}
        missionId={route.missionId}
      />
    )
  if (route.screen === 'dashboard') return <OrdersPage />
  if (route.screen === 'orders') return <OrdersPage />
  if (route.screen === 'createOrder') return <CreateOrderPage />
  if (route.screen === 'orderDetail')
    return <OrderDetailPage orderId={route.orderId} />
  if (route.screen === 'live') return <LivePage orderId={route.orderId} />
  if (route.screen === 'media') return <MediaPage orderId={route.orderId} />
  if (route.screen === 'liveHub') return <LiveHubPage />
  if (route.screen === 'mediaLibrary') return <MediaLibraryPage />
  if (route.screen === 'mediaDetail')
    return <MediaDetailPage mediaId={route.mediaId} />
  if (route.screen === 'notifications')
    return <NotificationsPage role="CUSTOMER" />

  return (
    <EmptyState
      title={t.notFoundTitle}
      description={t.notFoundDescription}
      action={
        <Button type="primary" href={customerHref({ screen: 'orders' })}>
          {t.backToDashboard}
        </Button>
      }
    />
  )
}
