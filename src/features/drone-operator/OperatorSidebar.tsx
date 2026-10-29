import { operatorHref, type OperatorRoute } from './routes'
import { useI18n } from '../../shared/i18n'
import type { Language } from '../../shared/i18n/languageStore'
import { operatorSidebarMessages } from './OperatorSidebar.messages'
import { activeNavKey } from './components/layout/navConfig'
import { OperatorSiderMenu } from './components/layout/OperatorSiderMenu'
import { OperatorSiderUserCard } from './components/layout/OperatorSiderUserCard'

/** Bilingual label for the current screen (used as breadcrumb / page title). */
export function operatorActiveLabel(
  screen: OperatorRoute['screen'],
  lang: Language,
): string {
  return operatorSidebarMessages[lang].activeScreen[screen]
}

/**
 * Sider body: brand, grouped nav menu and the profile card. The owning
 * layout wraps this in an antd Sider.
 */
export function OperatorSidebar({
  route,
  pendingCount = 0,
  notificationCount = 0,
  collapsed = false,
  onNavigate,
}: {
  route: OperatorRoute
  pendingCount?: number
  notificationCount?: number
  /** Icon-rail mode. */
  collapsed?: boolean
  onNavigate?: () => void
}) {
  useI18n(operatorSidebarMessages)
  return (
    <>
      <a
        className="mgr-brand"
        href={operatorHref({ screen: 'missions' })}
        onClick={onNavigate}
      >
        <span className="mgr-brand-tile">
          <img
            src="/images/logo-new.png"
            alt="OnDemand Monitor"
            className="mgr-brand-mark"
          />
        </span>
        <span className="mgr-brand-name">
          <span className="mgr-brand-primary">OnDemand</span>
          <span className="mgr-brand-accent">Monitor</span>
        </span>
      </a>
      <OperatorSiderMenu
        activeKey={activeNavKey[route.screen]}
        pendingCount={pendingCount}
        notificationCount={notificationCount}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
      <OperatorSiderUserCard />
    </>
  )
}
