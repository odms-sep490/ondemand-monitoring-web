import '@ant-design/v5-patch-for-react-19'
import { ConfigProvider, Layout } from 'antd'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { ShellContext } from '../../shared/components/antd/shellContext'
import { mgrPopupContainer } from '../../shared/components/antd'
import { useI18n } from '../../shared/i18n'
import {
  APP_SIDER_RAIL_WIDTH,
  APP_SIDER_WIDTH,
  buildAppTheme,
} from '../../shared/theme/appTheme'
import '../../shared/styles/app-shell/layout.scss'
import '../../shared/styles/app-shell/popups.scss'
import { adminLayoutMessages } from './AdminLayout.messages'
import { AdminHeader } from './components/layout/AdminHeader'
import { AdminSiderMenu } from './components/layout/AdminSiderMenu'
import { AdminSiderUserCard } from './components/layout/AdminSiderUserCard'
import { activeNavKey } from './components/layout/navConfig'
import { adminHref, type AdminRoute } from './routes'
import './admin.scss'

const { Sider, Content } = Layout

/**
 * Admin shell, identical in look to the Customer / Manager / Staff shells:
 * antd Layout with a Sider (collapsible icon rail, overlay below the `lg`
 * breakpoint), a Header and a scrolling Content.
 */
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
  const [collapsed, setCollapsed] = useState(false)
  const [broken, setBroken] = useState(false)
  const { t } = useI18n(adminLayoutMessages)
  const themeConfig = useMemo(() => buildAppTheme(dark), [dark])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const overlayOpen = broken && !collapsed
  // Desktop collapse keeps an icon rail; below the breakpoint the sider hides entirely.
  const rail = collapsed && !broken

  return (
    <ConfigProvider theme={themeConfig} getPopupContainer={mgrPopupContainer}>
      <ShellContext.Provider value>
        <div className="odm odm-adm mgr-layout">
          <Layout hasSider className="mgr-shell">
            <Sider
              width={APP_SIDER_WIDTH}
              collapsedWidth={broken ? 0 : APP_SIDER_RAIL_WIDTH}
              breakpoint="lg"
              trigger={null}
              collapsible
              collapsed={collapsed}
              onBreakpoint={(isBroken) => {
                setBroken(isBroken)
                setCollapsed(isBroken)
              }}
              theme={dark ? 'dark' : 'light'}
              className={`mgr-sider ${overlayOpen ? 'is-overlay' : ''} ${rail ? 'is-rail' : ''}`}
            >
              <a
                className="mgr-brand"
                href={adminHref({ screen: 'accounts' })}
                onClick={() => broken && setCollapsed(true)}
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
              <AdminSiderMenu
                activeKey={activeNavKey[route.screen]}
                pendingCount={pendingCount}
                collapsed={rail}
                onNavigate={() => broken && setCollapsed(true)}
              />
              <AdminSiderUserCard />
            </Sider>

            {overlayOpen ? (
              <button
                type="button"
                className="mgr-scrim"
                aria-label={t.closeNav}
                onClick={() => setCollapsed(true)}
              />
            ) : null}

            <Layout className="mgr-main">
              <AdminHeader
                breadcrumb={breadcrumb}
                collapsed={collapsed}
                dark={dark}
                onToggleSider={() => setCollapsed((v) => !v)}
                onToggleTheme={() => setDark((v) => !v)}
              />
              <Content className="mgr-content">
                <div className="odm-adm-content-inner">{children}</div>
              </Content>
            </Layout>
          </Layout>
        </div>
      </ShellContext.Provider>
    </ConfigProvider>
  )
}
