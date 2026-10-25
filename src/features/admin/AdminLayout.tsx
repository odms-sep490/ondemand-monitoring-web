import { useEffect, useState, type ReactNode } from 'react'

import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import { Icon, type IconName } from '../../shared/components/Icon'
import { LanguageToggle } from '../../shared/components/LanguageToggle'
import { useI18n } from '../../shared/i18n'
import { adminHref, type AdminRoute, type AdminScreen } from './routes'
import { adminLayoutMessages } from './AdminLayout.messages'
import './admin.css'

type NavItemKey = keyof typeof adminLayoutMessages.vi.navItems

type NavItem = { key: NavItemKey; icon: IconName; route: AdminRoute }

const NAV_ITEMS: NavItem[] = [
  { key: 'accounts', icon: 'users', route: { screen: 'accounts' } },
  { key: 'roles', icon: 'shield', route: { screen: 'roles' } },
  { key: 'catalog', icon: 'clipboard', route: { screen: 'catalog' } },
  { key: 'checklists', icon: 'clipboard', route: { screen: 'checklists' } },
  { key: 'operatingConfig', icon: 'cpu', route: { screen: 'operatingConfig' } },
  { key: 'auditLog', icon: 'file-text', route: { screen: 'auditLog' } },
]

// Which nav item highlights as active for each parsed screen.
const activeNavKey: Record<AdminScreen, NavItemKey | null> = {
  dashboard: null,
  accounts: 'accounts',
  createAccount: 'accounts',
  accountDetail: 'accounts',
  roles: 'roles',
  catalog: 'catalog',
  checklists: 'checklists',
  serviceChecklists: 'catalog',
  operatingConfig: 'operatingConfig',
  auditLog: 'auditLog',
  notFound: null,
}

function initialsOf(name: string | undefined): string {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export function AdminLayout({
  route,
  breadcrumb,
  pendingCount,
  children,
}: {
  route: AdminRoute
  breadcrumb: string
  pendingCount?: number
  children: ReactNode
}) {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const user = authSession.getUser()
  const { t } = useI18n(adminLayoutMessages)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const activeKey = activeNavKey[route.screen]

  return (
    <div className="odm odm-adm">
      <div className="odm-adm-shell">
        <nav
          aria-label={t.nav}
          className={`odm-adm-side ${menuOpen ? 'is-open' : ''}`}
        >
          <a className="odm-adm-brand" href={adminHref({ screen: 'accounts' })}>
            <img
              src="/images/logo-new.png"
              alt="OnDemand Monitor"
              className="odm-adm-brand-mark"
            />
            <span className="odm-adm-brand-name">
              <span className="odm-adm-brand-primary">OnDemand</span>
              <span className="odm-adm-brand-accent">Monitor</span>
            </span>
          </a>

          <div className="odm-adm-nav-scroll">
            <div className="odm-adm-navg">{t.menu}</div>
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === activeKey
              const badge =
                item.key === 'accounts' && (pendingCount ?? 0) > 0
                  ? pendingCount
                  : undefined
              return (
                <a
                  key={item.key}
                  href={adminHref(item.route)}
                  className={`odm-adm-navi ${isActive ? 'is-active' : ''}`}
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
                  {badge ? <span className="odm-adm-navc">{badge}</span> : null}
                </a>
              )
            })}
          </div>

          <div className="odm-adm-user">
            <span className="odm-adm-avatar" aria-hidden="true">
              {initialsOf(user?.fullName)}
            </span>
            <span className="odm-adm-user-text">
              <span className="odm-adm-user-name">
                {user?.fullName ?? t.admin}
              </span>
              <span className="odm-adm-user-email">{user?.email ?? ''}</span>
            </span>
          </div>
          <LogoutButton className="odm-adm-logout" />
        </nav>

        {menuOpen ? (
          <button
            type="button"
            className="odm-adm-scrim"
            aria-label={t.closeNav}
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <div className="odm-adm-main">
          <header className="odm-adm-topbar">
            <button
              type="button"
              className="odm-adm-menu-toggle"
              aria-label={t.openNav}
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>
            <div className="odm-adm-breadcrumb">{breadcrumb}</div>
            <div className="odm-adm-topbar-spacer" />
            <div className="odm-adm-search">
              <Icon
                name="search"
                width={15}
                height={15}
                className="odm-adm-search-icon"
              />
              <input
                className="odm-inp odm-adm-search-input"
                type="search"
                aria-label={t.search}
                placeholder={t.searchPlaceholder}
              />
            </div>
            <LanguageToggle />
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-ic1"
              aria-label={t.toggleTheme}
              onClick={() => setDark((v) => !v)}
            >
              {dark ? '☀' : '☾'}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-ic1 odm-adm-bell"
              aria-label={t.notifications}
            >
              <Icon name="bell" width={17} height={17} />
              <span className="odm-adm-bell-dot" aria-hidden="true" />
            </button>
          </header>
          <main className="odm-adm-content">
            <div className="odm-adm-content-inner">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
