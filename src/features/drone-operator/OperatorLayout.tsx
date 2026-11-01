import { useEffect, useState, type ReactNode } from 'react'

import { useLanguage } from '../../shared/i18n'
import { OperatorSidebar, operatorActiveLabel } from './OperatorSidebar'
import { OperatorTopbar } from './OperatorTopbar'
import type { OperatorRoute } from './routes'
import './opr.css'

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
  const [menuOpen, setMenuOpen] = useState(false)
  const { lang } = useLanguage()

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  return (
    <div className="odm odm-opr">
      <div className="odm-opr-shell">
        {route.screen === 'missionDetail' ? (
          <a className="odm-opr-skip-link" href="#mission-detail-main">
            Bỏ qua đến nội dung chính
          </a>
        ) : null}
        <OperatorSidebar
          route={route}
          pendingCount={pendingCount}
          notificationCount={notificationCount}
          open={menuOpen}
          onNavigate={() => setMenuOpen(false)}
        />
        {menuOpen ? (
          <button
            type="button"
            className="odm-opr-scrim"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}
        <div className="odm-opr-main">
          <OperatorTopbar
            breadcrumb={operatorActiveLabel(route.screen, lang)}
            dark={dark}
            onToggleDark={() => setDark((v) => !v)}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onOpenMenu={() => setMenuOpen(true)}
          />
          <main
            id={
              route.screen === 'missionDetail'
                ? 'mission-detail-main'
                : undefined
            }
            tabIndex={route.screen === 'missionDetail' ? -1 : undefined}
            className={
              fillContent
                ? 'odm-opr-content odm-opr-content--fill'
                : 'odm-opr-content'
            }
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
