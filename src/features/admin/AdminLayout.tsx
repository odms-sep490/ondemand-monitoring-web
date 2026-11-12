import '@ant-design/v5-patch-for-react-19'
import { ConfigProvider, Layout } from 'antd'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { authSession } from '../auth/api/authApi'
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
import { AdminHeader } from './components/layout/AdminHeader'
import { adminHref, type AdminRoute, type AdminScreen } from './routes'
import { adminLayoutMessages } from './AdminLayout.messages'
import './admin.css'

const { Sider, Content } = Layout

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
  const [collapsed, setCollapsed] = useState(false)
  const [broken, setBroken] = useState(false)
  const user = authSession.getUser()
  const { t } = useI18n(adminLayoutMessages)
  const themeConfig = useMemo(() => buildAppTheme(dark), [dark])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const activeKey = activeNavKey[route.screen]
  const overlayOpen = broken && !collapsed
  // Desktop collapse keeps an icon rail; below the breakpoint the sider hides entirely.
  const rail = collapsed && !broken

  return (
    <ConfigProvider theme={themeConfig} getPopupContainer={mgrPopupContainer}>
      <div className="odm odm-adm mgr-layout">
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
                    onClick: () => broken && setCollapsed(true),
                  })),
                },
              ]}
              profile={{
                name: user?.fullName ?? t.admin,
                description: user?.email,
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
    </ConfigProvider>
  )
}
