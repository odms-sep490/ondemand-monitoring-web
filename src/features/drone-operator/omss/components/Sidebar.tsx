import React, { useEffect, useState } from 'react'
import type { NavId, Screen, Role } from '../../types/omss'
import { authApi, authSession } from '../../../auth/api/authApi'
import { LanguageToggle } from '../../../../shared/components/LanguageToggle'
import { useI18n } from '../../../../shared/i18n'
import { sidebarMessages } from './Sidebar.messages'

interface Props {
  role: Role
  active: NavId
  onChange: (id: NavId, screen?: Screen) => void
  alerts: number
}
interface NavItem {
  id: NavId
  labelKey: string
  screen?: Screen
  icon: React.ReactNode
}

function operatorNav(): NavItem[] {
  return [
    {
      id: 'dashboard',
      labelKey: 'dashboard',
      screen: 'operator-overview',
      icon: <GridIcon />,
    },
    {
      id: 'my-missions',
      labelKey: 'myMissions',
      screen: 'mission-list',
      icon: <ListIcon />,
    },
    {
      id: 'mission-control',
      labelKey: 'missionControl',
      screen: 'in-flight',
      icon: <RadioIcon />,
    },
    {
      id: 'media',
      labelKey: 'media',
      screen: 'media-upload',
      icon: <MediaIcon />,
    },
    {
      id: 'history',
      labelKey: 'history',
      screen: 'mission-list',
      icon: <HistoryIcon />,
    },
    {
      id: 'zone-map',
      labelKey: 'zoneMap',
      screen: 'simulation-zones',
      icon: <MapIcon />,
    },
  ]
}
function customerNav(): NavItem[] {
  return [
    {
      id: 'dashboard',
      labelKey: 'dashboard',
      screen: 'customer-overview',
      icon: <GridIcon />,
    },
    { id: 'my-requests', labelKey: 'myRequests', icon: <ListIcon /> },
    {
      id: 'media-downloads',
      labelKey: 'mediaDownloads',
      icon: <MediaIcon />,
    },
    { id: 'billing', labelKey: 'billing', icon: <BillingIcon /> },
    { id: 'support', labelKey: 'support', icon: <SupportIcon /> },
  ]
}
function managerNav(): NavItem[] {
  return [
    {
      id: 'dashboard',
      labelKey: 'dashboard',
      screen: 'manager-overview',
      icon: <GridIcon />,
    },
    { id: 'team', labelKey: 'team', icon: <TeamIcon /> },
    { id: 'approvals', labelKey: 'approvals', icon: <CheckIcon /> },
    { id: 'fleet', labelKey: 'fleet', icon: <FleetIcon /> },
    { id: 'reports', labelKey: 'reports', icon: <ChartIcon /> },
  ]
}
function sysopNav(): NavItem[] {
  return [
    {
      id: 'dashboard',
      labelKey: 'dashboard',
      screen: 'sysop-overview',
      icon: <GridIcon />,
    },
    { id: 'fleet-health', labelKey: 'fleetHealth', icon: <FleetIcon /> },
    { id: 'maintenance', labelKey: 'maintenance', icon: <WrenchIcon /> },
    { id: 'systems', labelKey: 'systems', icon: <ServerIcon /> },
    { id: 'sys-alerts', labelKey: 'alerts', icon: <BellIcon /> },
  ]
}
function adminNav(): NavItem[] {
  return [
    {
      id: 'dashboard',
      labelKey: 'dashboard',
      screen: 'admin-overview',
      icon: <GridIcon />,
    },
    { id: 'users', labelKey: 'users', icon: <TeamIcon /> },
    { id: 'configuration', labelKey: 'configuration', icon: <SettingsIcon /> },
    { id: 'audit', labelKey: 'audit', icon: <HistoryIcon /> },
    { id: 'integrations', labelKey: 'integrations', icon: <ServerIcon /> },
  ]
}

const ROLE_NAV_BUILDER: Record<Role, () => NavItem[]> = {
  operator: operatorNav,
  customer: customerNav,
  manager: managerNav,
  sysop: sysopNav,
  admin: adminNav,
}

const ROLE_NAV_MESSAGE_KEY: Record<
  Role,
  'operatorNav' | 'customerNav' | 'managerNav' | 'sysopNav' | 'adminNav'
> = {
  operator: 'operatorNav',
  customer: 'customerNav',
  manager: 'managerNav',
  sysop: 'sysopNav',
  admin: 'adminNav',
}

export default function Sidebar({ role, active, onChange, alerts }: Props) {
  const { t } = useI18n(sidebarMessages)
  const nav = (ROLE_NAV_BUILDER[role] ?? ROLE_NAV_BUILDER['operator'])()
  const navLabels = t[ROLE_NAV_MESSAGE_KEY[role] ?? 'operatorNav'] as Record<
    string,
    string
  >
  const roleLabel = t.roleLabel[role] ?? t.roleLabel.operator

  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const logout = async () => {
    const token = authSession.getAccessToken()
    try {
      if (token) await authApi.logout(token)
    } finally {
      authSession.clear()
      window.location.hash = '#auth/login'
    }
  }

  return (
    <aside className="portal-sidebar">
      {/* Brand — identical to PortalLayout */}
      <a className="portal-brand" href="#portal/staff">
        <span className="brand-mark" aria-hidden="true">
          <span />
        </span>
        <span>FIELDWISE</span>
      </a>
      <div className="portal-role-label">{roleLabel}</div>

      {/* Nav */}
      <nav className="portal-nav" aria-label={t.nav}>
        {nav.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id, item.screen)}
            className={`portal-nav-btn${active === item.id ? ' portal-nav-btn--active' : ''}`}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              background:
                active === item.id ? 'var(--accent-bg)' : 'transparent',
              color: active === item.id ? 'var(--accent)' : 'var(--text-2)',
              fontFamily: 'var(--font-ui)',
              fontSize: 14,
              fontWeight: active === item.id ? 600 : 400,
              transition: 'background .1s, color .1s',
            }}
          >
            <span
              style={{
                color: active === item.id ? 'var(--accent)' : 'var(--text-3)',
                display: 'flex',
                flexShrink: 0,
              }}
            >
              {item.icon}
            </span>
            <span style={{ flex: 1 }}>{navLabels[item.labelKey]}</span>
            {item.id === 'notifications' && alerts > 0 ? (
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'var(--red)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {alerts}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {/* Footer — identical to PortalLayout */}
      <div className="portal-sidebar-footer">
        <LanguageToggle className="portal-utility-button" />
        <button
          type="button"
          className="portal-utility-button"
          onClick={() => setDark(!dark)}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
          <span>{dark ? t.lightMode : t.darkMode}</span>
        </button>
        <button
          type="button"
          className="portal-utility-button"
          onClick={logout}
        >
          <ArrowLeftIcon />
          <span>{t.signOut}</span>
        </button>
      </div>
    </aside>
  )
}

function GridIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" />
      <rect x="9.5" y="1" width="5.5" height="5.5" rx="1" />
      <rect x="1" y="9.5" width="5.5" height="5.5" rx="1" />
      <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1" />
    </svg>
  )
}
function ListIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <line x1="5" y1="4" x2="14" y2="4" />
      <line x1="5" y1="8" x2="14" y2="8" />
      <line x1="5" y1="12" x2="14" y2="12" />
      <circle cx="2" cy="4" r=".8" fill="currentColor" stroke="none" />
      <circle cx="2" cy="8" r=".8" fill="currentColor" stroke="none" />
      <circle cx="2" cy="12" r=".8" fill="currentColor" stroke="none" />
    </svg>
  )
}
function RadioIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="8" cy="8" r="2" />
      <path d="M4 4a5.66 5.66 0 0 0 0 8" />
      <path d="M12 4a5.66 5.66 0 0 1 0 8" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.5" />
      <rect
        x="1"
        y="1"
        width="14"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  )
}
function MediaIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="3" width="14" height="11" rx="1.5" />
      <circle cx="5.5" cy="7.5" r="1.5" />
      <path d="M9.5 9.5l2-2 3 3" />
    </svg>
  )
}
function HistoryIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M8 4v4l2.5 2.5" />
      <path d="M2 8a6 6 0 1 0 1.5-3.9" />
      <path d="M2 4v4h4" />
    </svg>
  )
}
function BellIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M8 1a5 5 0 0 1 5 5v3l1.5 2H1.5L3 9V6a5 5 0 0 1 5-5z" />
      <path d="M6.5 13a1.5 1.5 0 0 0 3 0" />
    </svg>
  )
}

function TeamIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1 13c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <circle cx="12" cy="5" r="2" />
      <path d="M14 13c0-2.2-1.6-4-3.5-4.5" />
    </svg>
  )
}
function BillingIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="3" width="14" height="11" rx="1.5" />
      <line x1="1" y1="7" x2="15" y2="7" />
    </svg>
  )
}
function SupportIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="8" cy="8" r="7" />
      <path d="M8 10v1" />
      <path d="M8 6a2 2 0 1 1 2 2c-.6.4-2 1-2 2" />
    </svg>
  )
}
function FleetIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M8 2l2 4H6L8 2z" />
      <circle cx="8" cy="9" r="3" />
      <line x1="8" y1="12" x2="8" y2="14" />
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <polyline points="2,12 6,7 10,9 14,4" />
    </svg>
  )
}
function WrenchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2a3 3 0 0 0-3 3c0 .4.1.8.2 1.1L3 12a1 1 0 0 0 0 1.4l.6.6a1 1 0 0 0 1.4 0l6.2-6.2c.3.1.7.2 1.1.2a3 3 0 0 0 0-6z" />
    </svg>
  )
}
function ServerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="2" width="14" height="5" rx="1" />
      <rect x="1" y="9" width="14" height="5" rx="1" />
      <circle cx="4" cy="4.5" r=".8" fill="currentColor" stroke="none" />
      <circle cx="4" cy="11.5" r=".8" fill="currentColor" stroke="none" />
    </svg>
  )
}
function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" />
    </svg>
  )
}
function MapIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M1.5 4.5l4-2 5 2 4-2v9l-4 2-5-2-4 2v-9z" />
      <path d="M5.5 2.5v9M10.5 4.5v9" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5z" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M10 3L5 8l5 5" />
    </svg>
  )
}
