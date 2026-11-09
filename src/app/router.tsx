import '../styles/global.css'
import '../styles/odm.css'
import '../styles/route-loading.css'

import {
  Fragment,
  lazy,
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import { LandingPage } from '../features/landing/pages/LandingPage'
import {
  restoreAuthSession,
  startAuthSession,
} from '../features/auth/api/authApi'
import { useAuthSession } from '../features/auth/hooks/useAuthSession'
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
  vi: {
    loading: 'Đang tải trang…',
    waiting: 'Vui lòng chờ trong giây lát.',
    restoring: 'Đang khôi phục phiên đăng nhập…',
    unavailable:
      'Chưa thể kiểm tra phiên đăng nhập. Vui lòng kiểm tra kết nối và thử lại.',
    retry: 'Thử lại',
  },
  en: {
    loading: 'Loading page…',
    waiting: 'Please wait a moment.',
    restoring: 'Restoring your session…',
    unavailable:
      'Unable to verify your session. Check your connection and try again.',
    retry: 'Try again',
  },
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
  const { status, user } = useAuthSession()
  const pending = status === 'loading' || status === 'unavailable'
  const redirectTo = pending
    ? null
    : !user || status !== 'authenticated'
      ? '#auth/login'
      : !(Array.isArray(role) ? role.includes(user.role) : user.role === role)
        ? getRoleHomePath(user.role)
        : null
  useEffect(() => {
    if (redirectTo) redirectHash(redirectTo)
  }, [redirectTo])
  return pending ? <SessionFeedback /> : redirectTo ? null : children
}

function SessionFeedback() {
  const { t } = useI18n(routeMessages)
  const { status } = useAuthSession()
  const unavailable = status === 'unavailable'

  return (
    <RouteLoading
      message={unavailable ? t.unavailable : t.restoring}
      hint={unavailable ? undefined : t.waiting}
      busy={!unavailable}
    >
      {unavailable && (
        <button
          type="button"
          className="button"
          onClick={() => void restoreAuthSession()}
        >
          {t.retry}
        </button>
      )}
    </RouteLoading>
  )
}

function RouteLoading({
  message,
  hint,
  busy = true,
  children,
}: {
  message: string
  hint?: string
  busy?: boolean
  children?: ReactNode
}) {
  return (
    <main className="route-loading">
      <div className="route-loading__brand">
        <span className="route-loading__brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" focusable="false">
            <path d="M9 9l6 5m8-5l-6 5M9 23l6-5m8 5l-6-5" />
            <circle cx="7" cy="7" r="2.5" />
            <circle cx="25" cy="7" r="2.5" />
            <circle cx="7" cy="25" r="2.5" />
            <circle cx="25" cy="25" r="2.5" />
            <rect x="13" y="12" width="6" height="8" rx="2" />
          </svg>
        </span>
        <span>OnDemand <strong>Monitor</strong></span>
      </div>

      <div className="route-loading__center">
        <div className="route-loading__visual" aria-hidden="true">
          <span className="route-loading__orbit route-loading__orbit--outer" />
          <span className="route-loading__orbit route-loading__orbit--inner" />
          <svg
            className="route-loading__drone"
            viewBox="0 0 120 90"
            focusable="false"
          >
            <g className="route-loading__drone-arms">
              <path d="M29 25l22 15M91 25L69 40M29 65l22-15m40 15L69 50" />
              <path d="M24 25h10M86 25h10M24 65h10M86 65h10" />
              <circle cx="24" cy="25" r="8" />
              <circle cx="96" cy="25" r="8" />
              <circle cx="24" cy="65" r="8" />
              <circle cx="96" cy="65" r="8" />
            </g>
            <path className="route-loading__drone-body" d="M51 37h18a5 5 0 015 5v6a5 5 0 01-5 5H51a5 5 0 01-5-5v-6a5 5 0 015-5z" />
            <path d="M53 54v7l-5 4m19-11v7l5 4" />
            <circle className="route-loading__camera" cx="60" cy="63" r="4" />
            <circle className="route-loading__camera-core" cx="60" cy="63" r="1.4" />
          </svg>
        </div>

        <div
          className="route-loading__copy"
          role="status"
          aria-live="polite"
          aria-busy={busy}
        >
          <p className="route-loading__message">{message}</p>
          {hint && <p className="route-loading__hint">{hint}</p>}
        </div>

        {busy && (
          <div className="route-loading__progress" aria-hidden="true">
            <span />
          </div>
        )}
        {children && <div className="route-loading__actions">{children}</div>}
      </div>
    </main>
  )
}

function RouteContent({ children }: { children: ReactNode }) {
  const { t } = useI18n(routeMessages)
  return (
    <Suspense
      fallback={<RouteLoading message={t.loading} hint={t.waiting} />}
    >
      {children}
    </Suspense>
  )
}

function AuthRoute({ children }: { children: ReactNode }) {
  const { status, user } = useAuthSession()
  const pending = status === 'loading' || status === 'unavailable'
  const authenticated = status === 'authenticated' && Boolean(user)
  useEffect(() => {
    if (!pending && !authenticated) redirectHash('#auth/login')
  }, [authenticated, pending])
  return pending ? <SessionFeedback /> : authenticated ? children : null
}

export function Router() {
  const { sessionKey } = useAuthSession()
  useEffect(startAuthSession, [])
  // An account switch discards data, dialogs and pending UI from the previous account.
  return (
    <Fragment key={sessionKey}>
      <Routes />
    </Fragment>
  )
}

function Routes() {
  const { status, user } = useAuthSession()
  const currentRole = user?.role
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

  useEffect(() => {
    if (hash === '#auth/login' && status === 'authenticated' && currentRole) {
      redirectHash(getRoleHomePath(currentRole))
    }
  }, [hash, status, currentRole])

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
  if (hash === '#auth/login') {
    if (status === 'loading' || status === 'unavailable')
      return <SessionFeedback />
    return (
      <RouteContent>
        <AuthPage key="login" initialMode="login" />
      </RouteContent>
    )
  }
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
