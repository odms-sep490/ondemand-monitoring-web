import '@ant-design/v5-patch-for-react-19'
import { App, ConfigProvider, Drawer, Layout } from 'antd'
import enUS from 'antd/locale/en_US'
import viVN from 'antd/locale/vi_VN'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

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
import { AdminBrand } from './components/layout/AdminBrand'
import { AdminHeader } from './components/layout/AdminHeader'
import { AdminSiderMenu } from './components/layout/AdminSiderMenu'
import { AdminSiderUserCard } from './components/layout/AdminSiderUserCard'
import { activeNavKey } from './components/layout/navConfig'
import { useIsMobile } from './lib/useIsMobile'
import type { AdminRoute } from './routes'
import './admin.scss'

const { Sider, Content } = Layout

/**
 * Admin shell, same look as the Manager / Customer shells: antd Layout with a
 * collapsible Sider (icon rail), a Header (breadcrumb, language, theme, user
 * menu) and a scrolling Content. Below 768px the Sider becomes a Drawer.
 */
export function AdminLayout({
  route,
  breadcrumb,
  children,
}: {
  route: AdminRoute
  breadcrumb: string
  children: ReactNode
}) {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const mobile = useIsMobile()
  const { t, lang } = useI18n(adminLayoutMessages)
  const themeConfig = useMemo(() => buildAppTheme(dark), [dark])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const activeKey = activeNavKey[route.screen]

  return (
    <ConfigProvider
      locale={lang === 'en' ? enUS : viVN}
      theme={themeConfig}
      getPopupContainer={mgrPopupContainer}
    >
      <App component={false}>
        <div className="odm odm-adm mgr-layout">
          <Layout hasSider={!mobile} className="mgr-shell">
            {mobile ? (
              <Drawer
                open={drawerOpen}
                placement="left"
                width={APP_SIDER_WIDTH}
                closable={false}
                title={null}
                className="adm-drawer"
                onClose={() => setDrawerOpen(false)}
                styles={{ body: { padding: 0 } }}
                aria-label={t.nav}
              >
                <div className="adm-drawer-body">
                  <AdminBrand onNavigate={() => setDrawerOpen(false)} />
                  <AdminSiderMenu
                    activeKey={activeKey}
                    onNavigate={() => setDrawerOpen(false)}
                  />
                  <AdminSiderUserCard />
                </div>
              </Drawer>
            ) : (
              <Sider
                width={APP_SIDER_WIDTH}
                collapsedWidth={APP_SIDER_RAIL_WIDTH}
                breakpoint="lg"
                trigger={null}
                collapsible
                collapsed={collapsed}
                onBreakpoint={setCollapsed}
                theme={dark ? 'dark' : 'light'}
                className={`mgr-sider ${collapsed ? 'is-rail' : ''}`}
              >
                <AdminBrand />
                <AdminSiderMenu activeKey={activeKey} collapsed={collapsed} />
                <AdminSiderUserCard />
              </Sider>
            )}

            <Layout className="mgr-main">
              <AdminHeader
                breadcrumb={breadcrumb}
                collapsed={collapsed}
                mobile={mobile}
                dark={dark}
                onToggleSider={() =>
                  mobile ? setDrawerOpen(true) : setCollapsed((v) => !v)
                }
                onToggleTheme={() => setDark((v) => !v)}
              />
              <Content className="mgr-content">
                <div className="odm-adm-content-inner">{children}</div>
              </Content>
            </Layout>
          </Layout>
        </div>
      </App>
    </ConfigProvider>
  )
}
