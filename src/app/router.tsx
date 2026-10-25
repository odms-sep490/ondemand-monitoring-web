import '../styles/global.css'
import '../styles/odm.css'

import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'

import { LandingPage } from '../features/landing/pages/LandingPage'
import { authSession } from '../features/auth/api/authApi'
import { getRoleHomePath } from '../features/auth/routing'
import type { UserRole } from '../features/auth/types'
import { useI18n } from '../shared/i18n'
import { defineMessages } from '../shared/i18n'

const AuthPage = lazy(() =>
  import('../features/auth/pages/AuthPage').then((m) => ({
    default: m.AuthPage,
  })),
)
const UserProfilePage = lazy(() =>
  import('../features/user/pages/UserProfilePage').then((m) => ({
    default: m.UserProfilePage,
  })),
)
const SocialCallbackPage = lazy(() =>
  import('../features/auth/pages/SocialCallbackPage').then((m) => ({
    default: m.SocialCallbackPage,
  })),
)
const CustomerApp = lazy(() =>
  import('../features/customer/CustomerApp').then((m) => ({
    default: m.CustomerApp,
  })),
)
const CustomerCreateRequestPage = lazy(() =>
  import('../features/customer/pages/CustomerCreateRequest').then((m) => ({
    default: m.CustomerCreateRequestPage,
  })),
)
const ManagerApp = lazy(() =>
  import('../features/manager/ManagerApp').then((m) => ({
    default: m.ManagerApp,
  })),
)
const DroneOperatorHomePage = lazy(() =>
  import('../features/drone-operator/pages/DroneOperatorHomePage').then(
    (m) => ({ default: m.DroneOperatorHomePage }),
  ),
)
const AdminApp = lazy(() =>
  import('../features/admin/AdminApp').then((m) => ({ default: m.AdminApp })),
)
const OperatorDashboardPage = lazy(() =>
  import('../features/mission/pages/OperatorDashboardPage').then((m) => ({
    default: m.OperatorDashboardPage,
  })),
)
const PaymentResultPage = lazy(() =>
  import('../features/finance/PaymentResult').then((m) => ({
    default: m.PaymentResultPage,
  })),
)
const SupportRoutes = lazy(() =>
  import('./SupportRoutes').then((m) => ({ default: m.SupportRoutes })),
)

const routeMessages = defineMessages({
  vi: { loading: 'Đang tải trang…' },
  en: { loading: 'Loading page…' },
})

function redirectHash(to: string) {
  if (window.location.hash !== to) {
    window.location.hash = to
  }
  window.setTimeout(() => {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }, 0)
}

function RoleRoute({
  role,
  children,
}: {
  role: UserRole | readonly UserRole[]
  children: ReactNode
}) {
  const user = authSession.getUser()
  const redirectTo =
    !authSession.getAccessToken() || !user
      ? '#auth/login'
      : !(Array.isArray(role) ? role.includes(user.role) : user.role === role)
        ? getRoleHomePath(user.role)
        : null
  useEffect(() => {
    if (redirectTo) redirectHash(redirectTo)
  }, [redirectTo])
  return redirectTo ? null : children
}

function RouteContent({ children }: { children: ReactNode }) {
  const { t } = useI18n(routeMessages)
  return (
    <Suspense
      fallback={
        <div className="route-loading" role="status">
          {t.loading}
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

function AuthRoute({ children }: { children: ReactNode }) {
  const authenticated = Boolean(
    authSession.getAccessToken() && authSession.getUser(),
  )
  useEffect(() => {
    if (!authenticated) redirectHash('#auth/login')
  }, [authenticated])
  return authenticated ? children : null
}

export function Router() {
  const [hash, setHash] = useState(() => window.location.hash)
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    const handleNavigation = () => setPathname(window.location.pathname)
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handleNavigation)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handleNavigation)
    }
  }, [])

  if (hash.startsWith('#help/tickets/')) {
    const ticketId = hash.replace('#help/tickets/', '')
    return (
      <AuthRoute>
        <RouteContent>
          <SupportRoutes screen="ticketDetail" ticketId={ticketId} />
        </RouteContent>
      </AuthRoute>
    )
  }
  if (hash.startsWith('#payment/result'))
    return (
      <RoleRoute role="CUSTOMER">
        <RouteContent>
          <PaymentResultPage />
        </RouteContent>
      </RoleRoute>
    )
  if (hash.startsWith('#payment/cancel'))
    return (
      <RoleRoute role="CUSTOMER">
        <RouteContent>
          <PaymentResultPage cancelled />
        </RouteContent>
      </RoleRoute>
    )
  if (hash === '#help/tickets')
    return (
      <AuthRoute>
        <RouteContent>
          <SupportRoutes screen="tickets" />
        </RouteContent>
      </AuthRoute>
    )
  if (hash === '#help' || hash.startsWith('#help/'))
    return (
      <AuthRoute>
        <RouteContent>
          <SupportRoutes screen="help" />
        </RouteContent>
      </AuthRoute>
    )

  if (pathname === '/social/callback')
    return (
      <RouteContent>
        <SocialCallbackPage />
      </RouteContent>
    )
  if (hash === '#profile')
    return (
      <AuthRoute>
        <RouteContent>
          <UserProfilePage />
        </RouteContent>
      </AuthRoute>
    )
  if (hash === '#auth/register')
    return (
      <RouteContent>
        <AuthPage key="register" initialMode="register" />
      </RouteContent>
    )
  if (hash === '#auth/login')
    return (
      <RouteContent>
        <AuthPage key="login" initialMode="login" />
      </RouteContent>
    )
  if (hash === '#portal/customer/request')
    return (
      <RoleRoute role="CUSTOMER">
        <RouteContent>
          <CustomerCreateRequestPage />
        </RouteContent>
      </RoleRoute>
    )
  if (hash === '#portal/customer' || hash.startsWith('#portal/customer/'))
    return (
      <RoleRoute role="CUSTOMER">
        <RouteContent>
          <CustomerApp />
        </RouteContent>
      </RoleRoute>
    )
  if (hash === '#portal/manager' || hash.startsWith('#portal/manager/'))
    return (
      <RoleRoute role={['MANAGER', 'ADMIN']}>
        <RouteContent>
          <ManagerApp />
        </RouteContent>
      </RoleRoute>
    )
  if (hash === '#portal/staff' || hash.startsWith('#portal/staff/'))
    return (
      <RoleRoute role="STAFF">
        <RouteContent>
          <DroneOperatorHomePage />
        </RouteContent>
      </RoleRoute>
    )
  if (hash === '#portal/admin' || hash.startsWith('#portal/admin/'))
    return (
      <RoleRoute role="ADMIN">
        <RouteContent>
          <AdminApp />
        </RouteContent>
      </RoleRoute>
    )
  if (hash === '#operator')
    return (
      <RoleRoute role="STAFF">
        <RouteContent>
          <OperatorDashboardPage />
        </RouteContent>
      </RoleRoute>
    )

  return <LandingPage />
}
