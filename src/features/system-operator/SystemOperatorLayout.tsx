import '@ant-design/v5-patch-for-react-19'
import { ConfigProvider, Layout } from 'antd'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { mgrPopupContainer } from '../../shared/components/antd'
import { Icon, type IconName } from '../../shared/components/Icon'
import { RoleSidebar } from '../../shared/components/RoleSidebar'
import { useI18n } from '../../shared/i18n'
import {
  APP_SIDER_RAIL_WIDTH,
  APP_SIDER_WIDTH,
  buildAppTheme,
} from '../../shared/theme/appTheme'
import '../../shared/styles/app-shell/layout.scss'
import '../../shared/styles/app-shell/popups.scss'
import { authSession } from '../auth/api/authApi'
import { SystemOperatorHeader } from './components/layout/SystemOperatorHeader'
import './sysop.css'
import { systemOperatorLayoutMessages } from './SystemOperatorLayout.messages'

const { Sider, Content } = Layout

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

/** Shell for the System Operator portal — same look as the customer portal. */
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
  const [collapsed, setCollapsed] = useState(false)
  const [broken, setBroken] = useState(false)
  const user = authSession.getUser()
  const active = activeKey(hash)
  const themeConfig = useMemo(() => buildAppTheme(dark), [dark])

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const overlayOpen = broken && !collapsed
  // Desktop collapse keeps an icon rail; below the breakpoint the sider hides entirely.
  const rail = collapsed && !broken

  return (
    <ConfigProvider theme={themeConfig} getPopupContainer={mgrPopupContainer}>
      <div className="odm odm-sysop mgr-layout">
        <Layout hasSider className="mgr-shell">
          <Sider
            width={APP_SIDER_WIDTH}
            collapsedWidth={broken ? 0 : APP_SIDER_RAIL_WIDTH}
            breakpoint="lg"
            trigger={null}
            collapsible
            collapsed={collapsed}
            style={broken && collapsed ? { transition: 'none' } : undefined}
            onBreakpoint={(isBroken) => {
              setBroken(isBroken)
              setCollapsed(isBroken)
            }}
            theme={dark ? 'dark' : 'light'}
            className={`mgr-sider ${overlayOpen ? 'is-overlay' : ''} ${rail ? 'is-rail' : ''}`}
          >
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
                    icon: (
                      <Icon
                        name={item.icon}
                        width={18}
                        height={18}
                        aria-hidden="true"
                      />
                    ),
                    href: item.href,
                    active: item.key === active,
                    onClick: () => broken && setCollapsed(true),
                  })),
                },
              ]}
              profile={{
                name: user?.fullName ?? t.userFallback,
                description: user?.email,
              }}
              collapsed={rail}
            />
          </Sider>

          {overlayOpen ? (
            <button
              type="button"
              className="mgr-scrim"
              aria-label={t.closeMenu}
              onClick={() => setCollapsed(true)}
            />
          ) : null}

          <Layout className="mgr-main">
            <SystemOperatorHeader
              breadcrumb={t.nav[active]}
              collapsed={collapsed}
              dark={dark}
              onToggleSider={() => setCollapsed((v) => !v)}
              onToggleTheme={() => setDark((v) => !v)}
            />
            <Content className="mgr-content">
              <div className="odm-sysop-content-inner">
                {title ? (
                  <div className="odm-sysop-pagehead">
                    <h1>{title}</h1>
                    {subtitle ? <p>{subtitle}</p> : null}
                  </div>
                ) : null}
                {children}
              </div>
            </Content>
          </Layout>
        </Layout>
      </div>
    </ConfigProvider>
  )
}
