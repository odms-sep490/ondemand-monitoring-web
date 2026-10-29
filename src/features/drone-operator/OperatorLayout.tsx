import '@ant-design/v5-patch-for-react-19'
import { ConfigProvider, Layout } from 'antd'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { ShellContext } from '../../shared/components/antd/shellContext'
import { mgrPopupContainer } from '../../shared/components/antd'
import { useI18n, useLanguage } from '../../shared/i18n'
import {
  APP_SIDER_RAIL_WIDTH,
  APP_SIDER_WIDTH,
  buildAppTheme,
} from '../../shared/theme/appTheme'
import '../../shared/styles/app-shell/layout.scss'
import '../../shared/styles/app-shell/popups.scss'
import { OperatorHeader } from './components/layout/OperatorHeader'
import { OperatorSidebar, operatorActiveLabel } from './OperatorSidebar'
import { operatorTopbarMessages } from './OperatorTopbar.messages'
import type { OperatorRoute } from './routes'
import './opr.css'

const { Sider, Content } = Layout

/**
 * Staff shell, identical in look to the Customer / Manager shells: antd Layout
 * with a white Sider (collapsible icon rail, overlay below the `lg`
 * breakpoint), a Header and a scrolling Content. `fillContent` removes the
 * Content padding for the full-bleed flight / zone map screens.
 */
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
  const { t } = useI18n(operatorTopbarMessages)
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
        <div className="odm odm-opr mgr-layout">
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
                aria-label={t.closeMenu}
                onClick={() => setCollapsed(true)}
              />
            ) : null}

            <Layout className="mgr-main">
              <OperatorHeader
                breadcrumb={operatorActiveLabel(route.screen, lang)}
                collapsed={collapsed}
                dark={dark}
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                onToggleSider={() => setCollapsed((v) => !v)}
                onToggleTheme={() => setDark((v) => !v)}
              />
              <Content
                className={
                  fillContent
                    ? 'mgr-content odm-opr-content--fill'
                    : 'mgr-content'
                }
              >
                {fillContent ? (
                  children
                ) : (
                  <div className="odm-opr-content-inner">{children}</div>
                )}
              </Content>
            </Layout>
          </Layout>
        </div>
      </ShellContext.Provider>
    </ConfigProvider>
  )
}
