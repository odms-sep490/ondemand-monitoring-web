import { useEffect, useState, type ReactNode } from 'react'

import { authSession } from '../../../features/auth/api/authApi'
import { LogoutButton } from '../../../features/auth/components/LogoutButton'
import { getRoleHomePath } from '../../../features/auth/routing'
import type { UserRole } from '../../../features/auth/types'
import { useI18n } from '../../i18n'
import { Icon, type IconName } from '../Icon'
import { RoleSidebar } from '../RoleSidebar'
import { portalLayoutMessages } from './PortalLayout.messages'

type NavKey = keyof (typeof portalLayoutMessages)['vi']['nav']
type PortalNavItem = { label: NavKey; icon: IconName; href: string }

const navItems: Record<UserRole, PortalNavItem[]> = {
  CUSTOMER: [
    { label: 'customerOverview', icon: 'chart', href: '#portal/customer' },
    {
      label: 'customerRequest',
      icon: 'plus',
      href: '#portal/customer/request',
    },
    {
      label: 'customerRequests',
      icon: 'ticket',
      href: '#portal/customer/requests',
    },
    { label: 'customerHelp', icon: 'shield', href: '#help' },
    {
      label: 'customerReports',
      icon: 'file-text',
      href: '#portal/customer/reports',
    },
  ],
  MANAGER: [
    { label: 'staffOverview', icon: 'chart', href: '#portal/manager' },
    { label: 'staffQueue', icon: 'ticket', href: '#portal/manager/queue' },
    {
      label: 'staffAssignments',
      icon: 'users',
      href: '#portal/manager/assignments',
    },
    { label: 'staffSupport', icon: 'shield', href: '#portal/manager/support' },
    { label: 'staffSchedule', icon: 'clock', href: '#portal/manager/schedule' },
  ],
  STAFF: [
    { label: 'staffSupport', icon: 'shield', href: '#portal/staff/support' },
    { label: 'systemOverview', icon: 'chart', href: '#portal/staff/technical' },
    { label: 'missionConsole', icon: 'route', href: '#portal/staff' },
    {
      label: 'preflightChecks',
      icon: 'shield',
      href: '#portal/staff/preflight',
    },
    { label: 'telemetry', icon: 'activity', href: '#portal/staff' },
  ],
  ADMIN: [
    { label: 'adminOverview', icon: 'chart', href: '#portal/admin' },
    { label: 'users', icon: 'users', href: '#portal/admin/accounts/new' },
    { label: 'missions', icon: 'route', href: '#portal/admin/missions' },
    { label: 'auditLogs', icon: 'clipboard', href: '#portal/admin/audit' },
  ],
}

export function PortalLayout({
  role,
  title,
  subtitle,
  children,
}: {
  role: UserRole
  title: string
  subtitle: string
  children: ReactNode
}) {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const user = authSession.getUser()
  const { t } = useI18n(portalLayoutMessages)
  const currentHash = window.location.hash
  const activeHref = navItems[role]
    .filter(
      (item) =>
        currentHash === item.href ||
        (item.href !== '#help' && currentHash.startsWith(item.href + '/')),
    )
    .sort((left, right) => right.href.length - left.href.length)[0]?.href

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  return (
    <div className="portal-shell">
      <aside
        className={`portal-sidebar ${menuOpen ? 'portal-sidebar--open' : ''}`}
      >
        <RoleSidebar
          brandHref={getRoleHomePath(role)}
          ariaLabel={t.navAria}
          groups={[
            {
              key: role,
              label: t.roleLabels[role],
              items: navItems[role].map((item) => ({
                key: item.href,
                label: t.nav[item.label],
                icon: <Icon name={item.icon} aria-hidden="true" />,
                href: item.href,
                active: item.href === activeHref,
                onClick: () => setMenuOpen(false),
              })),
            },
          ]}
          profile={{
            name: user?.fullName ?? t.defaultUser,
            description: user?.email ?? role,
            href: '#profile',
          }}
          footer={
            <>
              <button
                type="button"
                className="portal-utility-button"
                onClick={() => setDark(!dark)}
              >
                <Icon name={dark ? 'sun' : 'moon'} />
                <span>{dark ? t.lightMode : t.darkMode}</span>
              </button>
              <LogoutButton className="portal-logout-button" />
            </>
          }
        />
      </aside>
      {menuOpen ? (
        <button
          className="portal-scrim"
          aria-label={t.closeNav}
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <main className="portal-main">
        <header className="portal-header">
          <button
            className="portal-menu-toggle"
            type="button"
            aria-label={t.openNav}
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <div>
            <p className="eyebrow">{t.roleLabels[role]}</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="portal-user-chip">
            <span className="portal-avatar">
              {user?.fullName?.slice(0, 1).toUpperCase() ?? 'F'}
            </span>
            <span>
              <strong>{user?.fullName ?? t.defaultUser}</strong>
              <small>{user?.email ?? role}</small>
            </span>
          </div>
        </header>
        <div className="portal-content">{children}</div>
      </main>
    </div>
  )
}
