import { useEffect, useState, type ReactNode } from 'react'

import { LanguageToggle } from '../../shared/components/LanguageToggle'
import { Icon, type IconName } from '../../shared/components/Icon'
import { RoleSidebar } from '../../shared/components/RoleSidebar'
import { useI18n } from '../../shared/i18n'
import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import '../drone-operator/opr.css'
import './sysop.css'
import { systemOperatorLayoutMessages } from './SystemOperatorLayout.messages'

type NavKey = keyof (typeof systemOperatorLayoutMessages)['vi']['nav']

const NAV: Array<{ key: NavKey; icon: IconName; href: string }> = [
  { key: 'overview', icon: 'chart', href: '#portal/staff/technical' },
  {
    key: 'maintenance',
    icon: 'shield',
    href: '#portal/staff/technical/maintenance',
  },
  { key: 'devices', icon: 'cpu', href: '#portal/staff/technical/devices' },
  { key: 'telemetry', icon: 'activity', href: '#portal/staff/technical/telemetry' },
  { key: 'alerts', icon: 'bell', href: '#portal/staff/technical/alerts' },
]

function activeKey(hash: string): NavKey {
  const found = NAV.slice(1).find((item) => hash.startsWith(item.href))
  return found ? found.key : 'overview'
}

/** Shell for the System Operator portal — same look as the Operator/Manager portals. */
export function SystemOperatorLayout({
  title,
  subtitle,
  children,
}: {
  title?: string
  subtitle?: string
  children: ReactNode
}) {
  const { t } = useI18n(systemOperatorLayoutMessages)
  const [hash, setHash] = useState(() => window.location.hash)
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const user = authSession.getUser()
  const active = activeKey(hash)

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  return (
    <div className="odm odm-opr">
      <div className="odm-opr-shell">
        <aside className={`odm-opr-side${menuOpen ? ' is-open' : ''}`}>
          <RoleSidebar
            brandHref="#portal/staff/technical"
            ariaLabel={t.ariaNav}
            groups={[
              {
                key: 'system-operator',
                label: t.group,
                items: NAV.map((item) => ({
                  key: item.key,
                  label: t.nav[item.key],
                  icon: <Icon name={item.icon} aria-hidden="true" />,
                  href: item.href,
                  active: item.key === active,
                  onClick: () => setMenuOpen(false),
                })),
              },
            ]}
            profile={{
              name: user?.fullName ?? t.userFallback,
              description: user?.email,
            }}
            footer={<LogoutButton className="odm-opr-logout" />}
          />
        </aside>

        {menuOpen ? (
          <button
            type="button"
            className="odm-opr-scrim"
            aria-label={t.closeMenu}
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <div className="odm-opr-main">
          <header className="odm-opr-topbar">
            <button
              type="button"
              className="odm-opr-menu-toggle"
              aria-label={t.openMenu}
              onClick={() => setMenuOpen(true)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div className="odm-opr-breadcrumb">
              <span>{t.roleLabel}</span>
              <span aria-hidden="true">›</span>
              <strong>{t.nav[active]}</strong>
            </div>
            <div className="odm-opr-topbar-actions">
              <LanguageToggle />
              <button
                type="button"
                className="odm-btn odm-btn-gh odm-btn-ic1"
                aria-label={t.toggleTheme}
                onClick={() => setDark((v) => !v)}
              >
                {dark ? '☀' : '☾'}
              </button>
            </div>
          </header>
          <main className="odm-opr-content">
            {title ? (
              <div className="odm-sysop-pagehead">
                <h1>{title}</h1>
                {subtitle ? <p>{subtitle}</p> : null}
              </div>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
