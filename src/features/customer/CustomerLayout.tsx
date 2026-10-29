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
import { CustomerHeader } from './components/layout/CustomerHeader'
import { CustomerSiderMenu } from './components/layout/CustomerSiderMenu'
import { CustomerSiderUserCard } from './components/layout/CustomerSiderUserCard'
import {
  activeNavKey,
  type CustomerNavItemKey,
} from './components/layout/navConfig'
import { customerLayoutMessages } from './CustomerLayout.messages'
import { customerHref, type CustomerRoute } from './routes'
import './customer.css'
import './styles/customer-pages.scss'

export type { CustomerNavItemKey }

const { Sider, Content } = Layout

/**
 * Customer shell, identical in look to the Manager shell: antd Layout with a
 * white Sider (collapsible icon rail, overlay below the `lg` breakpoint), a
 * Header (breadcrumb, search, language, theme, avatar) and a scrolling Content.
 * The `.odm` wrapper stays so the legacy token-based page CSS keeps resolving.
 */
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
  const [collapsed, setCollapsed] = useState(false)
  const [broken, setBroken] = useState(false)
  const { t } = useI18n(customerLayoutMessages)
  const themeConfig = useMemo(() => buildAppTheme(dark), [dark])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const activeKey = activeNavItem ?? activeNavKey[route.screen]
  const overlayOpen = broken && !collapsed
  // Desktop collapse keeps an icon rail; below the breakpoint the sider hides entirely.
  const rail = collapsed && !broken

  return (
    <ConfigProvider theme={themeConfig} getPopupContainer={mgrPopupContainer}>
      <ShellContext.Provider value>
        <div className="odm odm-cus mgr-layout">
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
                href={customerHref({ screen: 'dashboard' })}
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
              <CustomerSiderMenu
                activeKey={activeKey}
                newMediaCount={newMediaCount}
                collapsed={rail}
                onNavigate={() => broken && setCollapsed(true)}
              />
              <CustomerSiderUserCard />
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
              <CustomerHeader
                breadcrumb={breadcrumb}
                collapsed={collapsed}
                dark={dark}
                onToggleSider={() => setCollapsed((v) => !v)}
                onToggleTheme={() => setDark((v) => !v)}
              />
              <Content className="mgr-content">
                <div className="odm-cus-content-inner">{children}</div>
              </Content>
            </Layout>
          </Layout>
        </div>
      </ShellContext.Provider>
    </ConfigProvider>
  )
}
