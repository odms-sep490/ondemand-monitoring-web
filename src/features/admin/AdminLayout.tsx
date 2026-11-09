import { useEffect, useState, type ReactNode } from 'react'

import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import { Icon, type IconName } from '../../shared/components/Icon'
import { LanguageToggle } from '../../shared/components/LanguageToggle'
import { RoleSidebar } from '../../shared/components/RoleSidebar'
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
        <aside className={`odm-adm-side ${menuOpen ? 'is-open' : ''}`}>
          <RoleSidebar
            brandHref={adminHref({ screen: 'accounts' })}
            ariaLabel={t.nav}
            groups={[
              {
                key: 'admin-menu',
                label: t.menu,
                items: NAV_ITEMS.map((item) => ({
                  key: item.key,
                  label: t.navItems[item.key],
                  icon: (
                    <Icon
                      name={item.icon}
                      width={18}
                      height={18}
                      aria-hidden="true"
                    />
                  ),
                  href: adminHref(item.route),
                  active: item.key === activeKey,
                  badge:
                    item.key === 'accounts' && (pendingCount ?? 0) > 0
                      ? pendingCount
                      : undefined,
                  onClick: () => setMenuOpen(false),
                })),
              },
            ]}
            profile={{
              name: user?.fullName ?? t.admin,
              description: user?.email,
            }}
            footer={<LogoutButton className="odm-adm-logout" />}
          />
        </aside>

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
