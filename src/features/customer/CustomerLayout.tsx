import '@ant-design/v5-patch-for-react-19'
import { ConfigProvider, Layout } from 'antd'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { mgrPopupContainer } from '../../shared/components/antd'
import { RoleSidebar } from '../../shared/components/RoleSidebar'
import { useI18n } from '../../shared/i18n'
import { authSession } from '../auth/api/authApi'
import {
  APP_SIDER_RAIL_WIDTH,
  APP_SIDER_WIDTH,
  buildAppTheme,
} from '../../shared/theme/appTheme'
import '../../shared/styles/app-shell/layout.scss'
import '../../shared/styles/app-shell/popups.scss'
import { CustomerHeader } from './components/layout/CustomerHeader'
import {
  activeNavKey,
  NAV_GROUPS,
  type CustomerNavItemKey,
} from './components/layout/navConfig'
import { customerLayoutMessages } from './CustomerLayout.messages'
import { customerHref, type CustomerRoute } from './routes'
import './customer.css'
import '../../shared/styles/app-shell/topbar-shell.css'
import '../../shared/styles/app-shell/legacy-kit.scss'
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
  children,
}: {
  route: CustomerRoute
  breadcrumb: string
  activeNavItem?: CustomerNavItemKey
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
      <div className="odm odm-cus mgr-layout">
        <Layout className="mgr-shell cus-shell">
          <CustomerHeader
            breadcrumb={breadcrumb}
            collapsed={collapsed}
            dark={dark}
            onToggleSider={() => setCollapsed((v) => !v)}
            onToggleTheme={() => setDark((v) => !v)}
          />
          <Layout hasSider className="cus-shell-body">
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
                brandHref={customerHref({ screen: 'orders' })}
                ariaLabel={t.nav}
                groups={NAV_GROUPS.map((group) => ({
                  key: group.key,
                  label: t.groups[group.key],
                  items: group.items.map((item) => ({
                    key: item.key,
                    label: t.navItems[item.key],
                    icon: item.icon,
                    href:
                      item.href ||
                      (item.route ? customerHref(item.route) : '#'),
                    active: item.key === activeKey,
                    onClick: () => broken && setCollapsed(true),
                  })),
                }))}
                profile={{
                  name: authSession.getUser()?.fullName ?? t.customer,
                  description: t.customer,
                  href: '#profile',
                }}
                collapsed={rail}
              />
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
              <Content className="mgr-content">
                <div className="odm-cus-content-inner">{children}</div>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </div>
    </ConfigProvider>
  )
}
