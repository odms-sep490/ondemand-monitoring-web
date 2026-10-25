import { useEffect, useState } from 'react'

import { EmptyState } from '../../shared/components/odm/StateView'
import { useI18n } from '../../shared/i18n'
import { customerAppMessages } from './CustomerApp.messages'
import { CustomerLayout } from './CustomerLayout'
import { useNewMediaCount } from './hooks/useNewMediaCount'
import { CreateOrderPage } from './pages/CreateOrder'
import { DashboardPage } from './pages/Dashboard'
import { LivePage } from './pages/Live'
import { LiveHubPage } from './pages/LiveHub'
import { MediaDetailPage } from './pages/MediaDetail'
import { MediaLibraryPage } from './pages/MediaLibrary'
import { MediaPage } from './pages/Media'
import { NotificationsPage } from './pages/Notifications'
import { OrderDetailPage } from './pages/OrderDetail'
import { OrdersPage } from './pages/Orders'
import { MissionHistoryPage } from './pages/MissionHistory'
import { MissionHistoryDetailPage } from './pages/MissionHistoryDetail'
import { CustomerMissionReportPage } from './components/reports/CustomerMissionReportPage'
import { customerHref, parseCustomerRoute, type CustomerRoute } from './routes'

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

  const newMediaCount = useNewMediaCount()

  return (
    <CustomerLayout
      route={route}
      breadcrumb={t.breadcrumb[route.screen]}
      newMediaCount={newMediaCount}
    >
      {renderScreen(route, t)}
    </CustomerLayout>
  )
}

function renderScreen(
  route: CustomerRoute,
  t: (typeof customerAppMessages)['vi'],
) {
  if (route.screen === 'missionHistory') return <MissionHistoryPage />
  if (route.screen === 'missionReport')
    return (
      <CustomerMissionReportPage
        orderId={route.orderId}
        missionId={route.missionId}
      />
    )
  if (route.screen === 'missionHistoryDetail')
    return <MissionHistoryDetailPage missionId={route.missionId} />
  if (route.screen === 'dashboard') return <DashboardPage />
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
  if (route.screen === 'notifications') return <NotificationsPage />

  return (
    <EmptyState
      title={t.notFoundTitle}
      description={t.notFoundDescription}
      action={
        <a
          className="odm-btn odm-btn-p"
          href={customerHref({ screen: 'dashboard' })}
        >
          {t.backToDashboard}
        </a>
      }
    />
  )
}
