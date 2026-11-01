import { useEffect, useState } from 'react'

import { useI18n } from '../../shared/i18n'
import { adminAppMessages } from './AdminApp.messages'

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return hash
}
import { EmptyState } from '../../shared/components/antd'
import { AdminLayout } from './AdminLayout'
import { parseAdminRoute } from './routes'
import { AdminDashboardPage } from './pages/Dashboard'
import { AccountsPage } from './pages/Accounts'
import { AccountDetailPage } from './pages/AccountDetail'
import { CatalogPage } from './pages/Catalog'
import { ChecklistCatalogPage } from './pages/Checklists/ChecklistCatalogPage'
import { ServiceChecklistPage } from './pages/Checklists/ServiceChecklistPage'
import { DevicesPage } from './pages/Devices'
import { OperatingConfigPage } from './pages/OperatingConfig'
import type { AdminRoute } from './routes'

function renderScreen(route: AdminRoute, notFoundText: string) {
  switch (route.screen) {
    case 'dashboard':
      return <AdminDashboardPage />
    case 'accounts':
      return <AccountsPage />
    case 'createAccount':
      return <AccountsPage openCreate />
    case 'accountDetail':
      return <AccountDetailPage accountId={route.accountId} />
    case 'catalog':
      return <CatalogPage />
    case 'checklists':
      return <ChecklistCatalogPage />
    case 'serviceChecklists':
      return <ServiceChecklistPage serviceId={route.serviceId} />
    case 'devices':
      return <DevicesPage />
    case 'operatingConfig':
      return <OperatingConfigPage />
    default:
      return <EmptyState title={notFoundText} />
  }
}

export function AdminApp() {
  const hash = useHash()
  const route = parseAdminRoute(hash)
  const { t } = useI18n(adminAppMessages)

  return (
    <AdminLayout route={route} breadcrumb={t.breadcrumb[route.screen]}>
      {renderScreen(route, t.notFoundPage)}
    </AdminLayout>
  )
}
