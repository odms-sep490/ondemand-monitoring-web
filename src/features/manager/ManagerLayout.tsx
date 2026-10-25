import { useEffect, useState, type ReactNode } from 'react'

import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import { managerHref, type ManagerRoute, type ManagerScreen } from './routes'
import {
  ManagerIcon,
  type ManagerIconName,
} from './components/common/ManagerIcon'
import './manager.css'

type NavItem = {
  label: string
  icon: ManagerIconName
  route?: ManagerRoute
  href?: string
  /** Key into `counts` for the numeric badge, when this item has one. */
  countKey?: 'pendingOrders' | 'openMaintenance' | 'mediaNeedsAction'
}

type NavGroup = { label: string; items: NavItem[] }

// Groups + items copied from the sidebar markup shared by every MNG-*.dc.html
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Điều hành',
    items: [
      { label: 'Dashboard', icon: 'dashboard', route: { screen: 'dashboard' } },
      {
        label: 'Đơn hàng',
        icon: 'order-queue',
        route: { screen: 'orderQueue' },
        countKey: 'pendingOrders',
      },
      {
        label: 'Nhiệm vụ',
        icon: 'mission',
        route: { screen: 'missions' },
      },
      {
        label: 'Lịch nhiệm vụ',
        icon: 'schedule',
        route: { screen: 'schedule' },
      },
      { label: 'Giám sát realtime', icon: 'live', route: { screen: 'live' } },
    ],
  },
  {
    label: 'Hỗ trợ khách hàng',
    items: [
      {
        label: 'Trung tâm hỗ trợ',
        icon: 'reports',
        href: '#portal/manager/support',
      },
    ],
  },
  {
    label: 'Nguồn lực',
    items: [
      { label: 'Đội drone', icon: 'drones', route: { screen: 'drones' } },
      {
        label: 'Bảo trì',
        icon: 'maintenance',
        route: { screen: 'maintenance' },
        countKey: 'openMaintenance',
      },
      {
        label: 'Media và giao kết quả',
        icon: 'media',
        route: { screen: 'media' },
        countKey: 'mediaNeedsAction',
      },
    ],
  },
  {
    label: 'Phân tích',
    items: [
      { label: 'Báo cáo', icon: 'reports', route: { screen: 'reports' } },
    ],
  },
]

// Which nav item highlights as active for each parsed screen — screens that
// aren't reachable directly from the sidebar (order review, mission
// create/dispatch) highlight the item their flow started from.
const activeNavLabel: Record<ManagerScreen, string> = {
  dashboard: 'Dashboard',
  orderQueue: 'Đơn hàng',
  orderReview: 'Đơn hàng',
  missionCreate: 'Đơn hàng',
  missionDispatch: 'Nhiệm vụ',
  missionSetup: 'Nhiệm vụ',
  missionDetail: 'Nhiệm vụ',
  schedule: 'Lịch nhiệm vụ',
  live: 'Giám sát realtime',
  missions: 'Nhiệm vụ',
  drones: 'Đội drone',
  maintenance: 'Bảo trì',
  media: 'Media và giao kết quả',
  reports: 'Báo cáo',
  support: 'Trung tâm hỗ trợ',
  notFound: '',
}

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return '?'
  const words = fullName.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export type ManagerNavCounts = {
  pendingOrders?: number
  openMaintenance?: number
  mediaNeedsAction?: number
}

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
  const [menuOpen, setMenuOpen] = useState(false)
  const user = authSession.getUser()

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const activeLabel = activeNavLabel[route.screen]

  return (
    <div className="odm odm-mgr">
      <div className="odm-mgr-shell">
        <nav
          aria-label="Điều hướng chính"
          className={`odm-mgr-side ${menuOpen ? 'is-open' : ''}`}
        >
          <a
            className="odm-mgr-brand"
            href={managerHref({ screen: 'dashboard' })}
          >
            <img
              src="/images/logo-new.png"
              alt="OnDemand Monitor"
              className="odm-mgr-brand-mark"
            />
            <span className="odm-mgr-brand-name">
              <span className="odm-mgr-brand-primary">OnDemand</span>
              <span className="odm-mgr-brand-accent">Monitor</span>
            </span>
          </a>

          <div className="odm-mgr-nav-scroll">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="odm-mgr-navg">{group.label}</div>
                {group.items.map((item) => {
                  const active = item.label === activeLabel
                  const count = item.countKey
                    ? counts?.[item.countKey]
                    : undefined
                  return (
                    <a
                      key={item.label}
                      href={
                        item.href ||
                        (item.route ? managerHref(item.route) : '#')
                      }
                      className={`odm-mgr-navi ${active ? 'is-active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      <ManagerIcon name={item.icon} />
                      <span>{item.label}</span>
                      {typeof count === 'number' && count > 0 ? (
                        <span className="odm-mgr-navc">{count}</span>
                      ) : null}
                    </a>
                  )
                })}
              </div>
            ))}
          </div>

          <a
            href="#profile"
            className="odm-mgr-user"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            <span className="odm-mgr-avatar" aria-hidden="true">
              {initialsOf(user?.fullName)}
            </span>
            <span className="odm-mgr-user-text">
              <span className="odm-mgr-user-name">
                {user?.fullName ?? 'Staff'}
              </span>
              <span className="odm-mgr-user-email">{user?.email ?? ''}</span>
            </span>
          </a>
          <LogoutButton className="odm-mgr-logout" />
        </nav>

        {menuOpen ? (
          <button
            type="button"
            className="odm-mgr-scrim"
            aria-label="Đóng điều hướng"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <div className="odm-mgr-main">
          <header className="odm-mgr-topbar">
            <button
              type="button"
              className="odm-mgr-menu-toggle"
              aria-label="Mở điều hướng"
              onClick={() => setMenuOpen(true)}
            >
              <ManagerIcon name="menu" />
            </button>
            <div className="odm-mgr-breadcrumb">{breadcrumb}</div>
            <div className="odm-mgr-topbar-spacer" />
            <a
              href="#portal/manager/support"
              className="odm-btn odm-btn-gh"
              style={{
                fontSize: 13,
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginRight: 8,
              }}
            >
              🎧 Trung tâm hỗ trợ
            </a>
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-ic1"
              aria-label="Đổi giao diện sáng / tối"
              onClick={() => setDark((value) => !value)}
            >
              <ManagerIcon name={dark ? 'sun' : 'moon'} />
            </button>
          </header>
          <main className="odm-mgr-content">{children}</main>
        </div>
      </div>
    </div>
  )
}
