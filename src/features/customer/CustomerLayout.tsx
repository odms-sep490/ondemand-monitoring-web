import { useEffect, useState, type ReactNode } from 'react'

import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import { Icon, type IconName } from '../../shared/components/Icon'
import { LanguageToggle } from '../../shared/components/LanguageToggle'
import { useI18n } from '../../shared/i18n'
import { customerHref, type CustomerRoute, type CustomerScreen } from './routes'
import { customerLayoutMessages } from './CustomerLayout.messages'
import './customer.css'

export type CustomerNavItemKey = keyof typeof customerLayoutMessages.vi.navItems

type NavItem = {
  key: CustomerNavItemKey
  icon: IconName
  route?: CustomerRoute
  href?: string
  newMediaBadge?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { key: 'missionHistory', icon: 'clock', route: { screen: 'missionHistory' } },
  { key: 'dashboard', icon: 'home', route: { screen: 'dashboard' } },
  { key: 'orders', icon: 'clipboard', route: { screen: 'orders' } },
  { key: 'createOrder', icon: 'plus', route: { screen: 'createOrder' } },
  {
    key: 'mediaLibrary',
    icon: 'camera',
    route: { screen: 'mediaLibrary' },
    newMediaBadge: true,
  },
  { key: 'help', icon: 'file-text', href: '#help' },
  { key: 'support', icon: 'ticket', href: '#help/tickets' },
  { key: 'notifications', icon: 'bell', route: { screen: 'notifications' } },
]

const activeNavKey: Record<CustomerScreen, CustomerNavItemKey | null> = {
  missionHistory: 'missionHistory',
  missionHistoryDetail: 'missionHistory',
  missionReport: 'orders',
  dashboard: 'dashboard',
  orders: 'orders',
  createOrder: 'createOrder',
  orderDetail: 'orders',
  live: null,
  liveHub: null,
  media: 'mediaLibrary',
  mediaLibrary: 'mediaLibrary',
  mediaDetail: 'mediaLibrary',
  notifications: 'notifications',
  notFound: null,
}

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return '?'
  const words = fullName.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export function CustomerLayout({
  route,
  breadcrumb,
  activeNavItem,
  newMediaCount,
  children,
}: {
  route: CustomerRoute
  breadcrumb: string
  activeNavItem?: CustomerNavItemKey
  newMediaCount?: number
  children: ReactNode
}) {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const user = authSession.getUser()
  const { t } = useI18n(customerLayoutMessages)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const activeKey = activeNavItem ?? activeNavKey[route.screen]

  return (
    <div className="odm odm-cus">
      <div className="odm-cus-shell">
        <nav
          aria-label={t.nav}
          className={`odm-cus-side ${menuOpen ? 'is-open' : ''}`}
        >
          <a
            className="odm-cus-brand"
            href={customerHref({ screen: 'dashboard' })}
          >
            <img
              src="/images/logo-new.png"
              alt="OnDemand Monitor"
              className="odm-cus-brand-mark"
            />
            <span className="odm-cus-brand-name">
              <span className="odm-cus-brand-primary">OnDemand</span>
              <span className="odm-cus-brand-accent">Monitor</span>
            </span>
          </a>

          <div className="odm-cus-nav-scroll">
            <div className="odm-cus-navg">{t.menu}</div>
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === activeKey
              const badge =
                item.newMediaBadge && (newMediaCount ?? 0) > 0
                  ? newMediaCount
                  : undefined
              return (
                <a
                  key={item.key}
                  href={
                    item.href || (item.route ? customerHref(item.route) : '#')
                  }
                  className={`odm-cus-navi ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon
                    name={item.icon}
                    width={18}
                    height={18}
                    aria-hidden="true"
                  />
                  <span>{t.navItems[item.key]}</span>
                  {badge ? <span className="odm-cus-navc">{badge}</span> : null}
                </a>
              )
            })}
          </div>

          <a
            href="#profile"
            className="odm-cus-user"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            <span className="odm-cus-avatar" aria-hidden="true">
              {initialsOf(user?.fullName)}
            </span>
            <span className="odm-cus-user-text">
              <span className="odm-cus-user-name">
                {user?.fullName ?? t.customer}
              </span>
              <span className="odm-cus-user-email">{user?.email ?? ''}</span>
            </span>
          </a>
          <LogoutButton className="odm-cus-logout" />
        </nav>

        {menuOpen ? (
          <button
            type="button"
            className="odm-cus-scrim"
            aria-label={t.closeNav}
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <div className="odm-cus-main">
          <header className="odm-cus-topbar">
            <button
              type="button"
              className="odm-cus-menu-toggle"
              aria-label={t.openNav}
              onClick={() => setMenuOpen(true)}
            >
              <Icon name="menu" width={20} height={20} aria-hidden="true" />
            </button>
            <div className="odm-cus-breadcrumb">{breadcrumb}</div>
            <div className="odm-cus-topbar-spacer" />
            <a href="#help" className="odm-btn odm-btn-gh odm-cus-help-link">
              <Icon
                name="file-text"
                width={15}
                height={15}
                aria-hidden="true"
              />
              {t.helpLink}
            </a>
            <LanguageToggle />
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-ic1"
              aria-label={t.toggleTheme}
              onClick={() => setDark((v) => !v)}
            >
              <Icon name={dark ? 'sun' : 'moon'} width={17} height={17} />
            </button>
          </header>
          <main className="odm-cus-content">
            <div className="odm-cus-content-inner">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
