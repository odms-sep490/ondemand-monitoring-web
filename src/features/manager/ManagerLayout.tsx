import '@ant-design/v5-patch-for-react-19'
import { ConfigProvider, Layout } from 'antd'
import { Lottie } from 'lottie-react'
import { useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { RoleSidebar } from '../../shared/components/RoleSidebar'
import { useI18n } from '../../shared/i18n'
import { authSession } from '../auth/api/authApi'
import { managerHref, type ManagerRoute } from './routes'
import { ManagerHeader } from './components/layout/ManagerHeader'
import { ManagerIcon } from './components/common/ManagerIcon'
import {
  activeNavLabel,
  NAV_GROUPS,
  type ManagerNavCounts,
} from './components/layout/navConfig'
import { mgrPopupContainer } from './components/common/mgrPopupContainer'
import {
  buildManagerTheme,
  MANAGER_SIDER_RAIL_WIDTH,
  MANAGER_SIDER_WIDTH,
} from './theme/managerTheme'
import './manager.css'
import '../../shared/styles/app-shell/layout.scss'
import '../../shared/styles/app-shell/popups.scss'
import { managerLayoutMessages } from './ManagerLayout.messages'
import droneAnimation from '../landing/assets/drone-animation.json'

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
  const reduceMotion = useReducedMotion()
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
        <span className="mgr-flight-decor" aria-hidden="true">
          <span className="mgr-flight-route" />
          <Lottie
            src={droneAnimation}
            autoplay={!reduceMotion}
            loop={!reduceMotion}
            className="mgr-flight-drone"
          />
        </span>
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
            <RoleSidebar
              brandHref={managerHref({ screen: 'dashboard' })}
              ariaLabel={t.nav}
              groups={NAV_GROUPS.map((group) => ({
                key: group.label,
                label: t.sidebar[group.label],
                items: group.items.map((item) => {
                  const count = item.countKey ? counts?.[item.countKey] : undefined
                  return {
                    key: item.label,
                    label: t.sidebar[item.label],
                    icon: <ManagerIcon name={item.icon} />,
                    href: item.href || (item.route ? managerHref(item.route) : '#'),
                    active: item.label === activeNavLabel[route.screen],
                    badge: count && count > 0 ? count : undefined,
                    onClick: () => broken && setCollapsed(true),
                  }
                }),
              }))}
              profile={{
                name: authSession.getUser()?.fullName ?? t.manager,
                description: t.manager,
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
