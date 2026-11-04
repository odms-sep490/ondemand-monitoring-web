import '@ant-design/v5-patch-for-react-19'
import { ConfigProvider, Layout } from 'antd'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { useI18n, useLanguage } from '../../shared/i18n'
import {
  APP_SIDER_RAIL_WIDTH,
  APP_SIDER_WIDTH,
  buildAppTheme,
} from '../../shared/theme/appTheme'
import { mgrPopupContainer } from '../manager/components/common/mgrPopupContainer'
import { OperatorSidebar, operatorActiveLabel } from './OperatorSidebar'
import { OperatorTopbar } from './OperatorTopbar'
import { operatorTopbarMessages } from './OperatorTopbar.messages'
import type { OperatorRoute } from './routes'
import './opr.css'
import '../../shared/styles/app-shell/layout.scss'

const { Sider } = Layout

export function OperatorLayout({
  route,
  pendingCount,
  notificationCount,
  searchQuery,
  onSearchChange,
  fillContent,
  children,
}: {
  route: OperatorRoute
  pendingCount?: number
  notificationCount?: number
  searchQuery: string
  onSearchChange: (value: string) => void
  fillContent?: boolean
  children: ReactNode
}) {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  const [collapsed, setCollapsed] = useState(false)
  const [broken, setBroken] = useState(false)
  const { lang } = useLanguage()
  const { t: topbarText } = useI18n(operatorTopbarMessages)
  const themeConfig = useMemo(() => buildAppTheme(dark), [dark])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const overlayOpen = broken && !collapsed
  const rail = collapsed && !broken

  return (
    <ConfigProvider theme={themeConfig} getPopupContainer={mgrPopupContainer}>
      <div className="odm odm-opr mgr-layout">
        {route.screen === 'missionDetail' ? (
          <a className="odm-opr-skip-link" href="#mission-detail-main">
            Bỏ qua đến nội dung chính
          </a>
        ) : null}
        <Layout hasSider className="mgr-shell odm-opr-shell">
          <Sider
            id="operator-navigation"
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
            <OperatorSidebar
              route={route}
              pendingCount={pendingCount}
              notificationCount={notificationCount}
              collapsed={rail}
              onNavigate={() => broken && setCollapsed(true)}
            />
          </Sider>

          {overlayOpen ? (
            <button
              type="button"
              className="mgr-scrim"
              aria-label={topbarText.closeMenu}
              onClick={() => setCollapsed(true)}
            />
          ) : null}

          <Layout className="mgr-main odm-opr-main">
            <OperatorTopbar
              breadcrumb={operatorActiveLabel(route.screen, lang)}
              collapsed={collapsed}
              dark={dark}
              notificationCount={notificationCount}
              onToggleNavigation={() => setCollapsed((value) => !value)}
              onToggleDark={() => setDark((value) => !value)}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
            />
            <main
              id={
                route.screen === 'missionDetail'
                  ? 'mission-detail-main'
                  : undefined
              }
              tabIndex={route.screen === 'missionDetail' ? -1 : undefined}
              className={`mgr-content odm-opr-content${fillContent ? ' odm-opr-content--fill' : ''}`}
            >
              {children}
            </main>
          </Layout>
        </Layout>
      </div>
    </ConfigProvider>
  )
}
