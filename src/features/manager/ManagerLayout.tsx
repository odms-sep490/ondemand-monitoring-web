import '@ant-design/v5-patch-for-react-19'
import { ConfigProvider, Layout } from 'antd'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { useI18n } from '../../shared/i18n'
import { managerHref, type ManagerRoute } from './routes'
import { ManagerHeader } from './components/layout/ManagerHeader'
import { SiderMenu } from './components/layout/SiderMenu'
import { SiderUserCard } from './components/layout/SiderUserCard'
import {
  activeNavLabel,
  type ManagerNavCounts,
} from './components/layout/navConfig'
import { mgrPopupContainer } from './components/common/mgrPopupContainer'
import {
  buildManagerTheme,
  MANAGER_SIDER_RAIL_WIDTH,
  MANAGER_SIDER_WIDTH,
} from './theme/managerTheme'
import './manager.css'
import './components/layout/layout.scss'
import './components/layout/popups.scss'
import { managerLayoutMessages } from './ManagerLayout.messages'

export type { ManagerNavCounts }

const { Sider, Content } = Layout

/**
 * Manager shell, modelled on the reference project's `AppDashboard`:
 * antd Layout with a left Sider (brand + Menu), a Header (breadcrumb, support,
 * theme toggle, avatar dropdown) and a scrolling Content area. The
 * `.odm` wrapper stays so the legacy token-based page CSS keeps resolving.
 */
export function ManagerLayout({
  route,
  breadcrumb,
  counts,
  children,
}: {
  route: ManagerRoute
  breadcrumb: string
  counts?: ManagerNavCounts
  children: ReactNode
}) {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  const [collapsed, setCollapsed] = useState(false)
  const [broken, setBroken] = useState(false)
  const { t } = useI18n(managerLayoutMessages)
  const themeConfig = useMemo(() => buildManagerTheme(dark), [dark])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const overlayOpen = broken && !collapsed
  // Desktop collapse keeps an icon rail; below the breakpoint the sider hides entirely.
  const rail = collapsed && !broken

  return (
    <ConfigProvider theme={themeConfig} getPopupContainer={mgrPopupContainer}>
      <div className="odm odm-mgr mgr-layout">
        <Layout hasSider className="mgr-shell">
          <Sider
            width={MANAGER_SIDER_WIDTH}
            collapsedWidth={broken ? 0 : MANAGER_SIDER_RAIL_WIDTH}
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
              href={managerHref({ screen: 'dashboard' })}
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
            <SiderMenu
              activeLabel={activeNavLabel[route.screen]}
              counts={counts}
              collapsed={rail}
              onNavigate={() => broken && setCollapsed(true)}
            />
            <SiderUserCard />
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
            <ManagerHeader
              breadcrumb={breadcrumb}
              collapsed={collapsed}
              dark={dark}
              pendingOrders={counts?.pendingOrders}
              onToggleSider={() => setCollapsed((v) => !v)}
              onToggleTheme={() => setDark((v) => !v)}
            />
            <Content className="mgr-content odm-mgr-content">{children}</Content>
          </Layout>
        </Layout>
      </div>
    </ConfigProvider>
  )
}
