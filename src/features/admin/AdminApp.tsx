import { lazy, Suspense, useEffect, useState } from 'react'

import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { useI18n } from '../../shared/i18n'
import { adminAppMessages } from './AdminApp.messages'

const AdminDashboardPage = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.AdminDashboardPage })),
)
const AccountsPage = lazy(() =>
  import('./pages/Accounts').then((m) => ({ default: m.AccountsPage })),
)
const AccountDetailPage = lazy(() =>
  import('./pages/AccountDetail').then((m) => ({ default: m.AccountDetailPage })),
)
const RolesPage = lazy(() =>
  import('./pages/Roles').then((m) => ({ default: m.RolesPage })),
)
const CatalogPage = lazy(() =>
  import('./pages/Catalog').then((m) => ({ default: m.CatalogPage })),
)
const ChecklistCatalogPage = lazy(() =>
  import('./pages/Checklists/ChecklistCatalogPage').then((m) => ({ default: m.ChecklistCatalogPage })),
)
const ServiceChecklistPage = lazy(() =>
  import('./pages/Checklists/ServiceChecklistPage').then((m) => ({ default: m.ServiceChecklistPage })),
)
const OperatingConfigPage = lazy(() =>
  import('./pages/OperatingConfig').then((m) => ({ default: m.OperatingConfigPage })),
)
const AuditLogPage = lazy(() =>
  import('./pages/AuditLog').then((m) => ({ default: m.AuditLogPage })),
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
import { adminApi } from './api/adminApi'
import { AdminLayout } from './AdminLayout'
import { parseAdminRoute } from './routes'
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
    case 'roles':
      return <RolesPage />
    case 'catalog':
      return <CatalogPage />
    case 'checklists':
      return <ChecklistCatalogPage />
    case 'serviceChecklists':
      return <ServiceChecklistPage serviceId={route.serviceId} />
    case 'operatingConfig':
      return <OperatingConfigPage />
    case 'auditLog':
      return <AuditLogPage />
    default:
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx3)' }}>
          {notFoundText}
        </div>
      )
  }
}

export function AdminApp() {
  const hash = useHash()
  const route = parseAdminRoute(hash)
  const { t } = useI18n(adminAppMessages)

  const { data } = useApiQuery((signal) => adminApi.getDashboard(signal), [])
  const pendingCount = data?.pendingAccounts

  return (
    <AdminLayout
      route={route}
      breadcrumb={t.breadcrumb[route.screen]}
      pendingCount={pendingCount}
    >
      <Suspense fallback={null}>
        {renderScreen(route, t.notFoundPage)}
      </Suspense>
    </AdminLayout>
  )
}
