import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import { useI18n } from '../../shared/i18n'
import type { Language } from '../../shared/i18n/languageStore'
import { operatorHref, type OperatorRoute, type OperatorScreen } from './routes'
import { operatorSidebarMessages } from './OperatorSidebar.messages'

type Messages = (typeof operatorSidebarMessages)['vi']

type NavItem = {
  screen: OperatorScreen
  labelKey: keyof Messages['nav']
  icon: string
  route: OperatorRoute
  badge?: number
}
type NavGroup = { labelKey: keyof Messages['groups']; items: NavItem[] }

function buildGroups(
  pendingCount: number,
  notificationCount: number,
): NavGroup[] {
  return [
    {
      labelKey: 'work',
      items: [
        {
          screen: 'missions',
          labelKey: 'missions',
          icon: '✈',
          route: { screen: 'missions' },
          badge: pendingCount,
        },
        {
          screen: 'support',
          labelKey: 'support',
          icon: '☏',
          route: { screen: 'support' },
        },
        {
          screen: 'availability',
          labelKey: 'availability',
          icon: '🗓',
          route: { screen: 'availability' },
        },
      ],
    },
    {
      labelKey: 'technical',
      items: [
        {
          screen: 'technical',
          labelKey: 'technical',
          icon: '▦',
          route: { screen: 'technical' },
        },
        {
          screen: 'devices',
          labelKey: 'devices',
          icon: '◉',
          route: { screen: 'devices' },
        },
        {
          screen: 'maintenance',
          labelKey: 'maintenance',
          icon: '🛠',
          route: { screen: 'maintenance' },
        },
      ],
    },
    {
      labelKey: 'flight',
      items: [
        {
          screen: 'zoneMap',
          labelKey: 'zoneMap',
          icon: '⛶',
          route: { screen: 'zoneMap' },
        },
      ],
    },
    {
      labelKey: 'account',
      items: [
        {
          screen: 'notifications',
          labelKey: 'notifications',
          icon: '🔔',
          route: { screen: 'notifications' },
          badge: notificationCount,
        },
        {
          screen: 'profile',
          labelKey: 'profile',
          icon: '◉',
          route: { screen: 'profile' },
        },
      ],
    },
  ]
}

// Which nav item highlights as active for each parsed screen (missionDetail
// falls back to the "missions" item, same as the old label-based match).
const activeNavScreen: Record<OperatorScreen, OperatorScreen | null> = {
  missions: 'missions',
  missionDetail: 'missions',
  availability: 'availability',
  connect: null,
  handover: null,
  preflight: null,
  flight: null,
  upload: null,
  checklist: null,
  postflight: null,
  technical: 'technical',
  devices: 'devices',
  support: 'support',
  maintenance: 'maintenance',
  zoneMap: 'zoneMap',
  notifications: 'notifications',
  profile: 'profile',
  notFound: null,
}

/** Bilingual label for the current screen (used as breadcrumb / page title). */
export function operatorActiveLabel(
  screen: OperatorScreen,
  lang: Language,
): string {
  return operatorSidebarMessages[lang].activeScreen[screen]
}

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return '?'
  const words = fullName.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export function OperatorSidebar({
  route,
  pendingCount = 0,
  notificationCount = 0,
  open = false,
  onNavigate,
}: {
  route: OperatorRoute
  pendingCount?: number
  notificationCount?: number
  open?: boolean
  onNavigate?: () => void
}) {
  const user = authSession.getUser()
  const { t } = useI18n(operatorSidebarMessages)
  const activeScreen = activeNavScreen[route.screen]
  const groups = buildGroups(pendingCount, notificationCount)

  return (
    <nav
      aria-label={t.ariaNav}
      className={`odm-opr-side${open ? ' is-open' : ''}`}
    >
      <a
        className="odm-opr-brand"
        href={operatorHref({ screen: 'missions' })}
        onClick={onNavigate}
      >
        <img
          src="/images/logo-new.png"
          alt="OnDemand Monitor"
          className="odm-opr-brand-mark"
        />
        <span className="odm-opr-brand-name">
          <span className="odm-opr-brand-primary">OnDemand</span>
          <span className="odm-opr-brand-accent">Monitor</span>
        </span>
      </a>

      <div className="odm-opr-nav-scroll">
        {groups.map((group) => (
          <div key={group.labelKey}>
            <div className="odm-opr-navg">{t.groups[group.labelKey]}</div>
            {group.items.map((item) => {
              const isActive = item.screen === activeScreen
              return (
                <a
                  key={item.screen}
                  href={operatorHref(item.route)}
                  className={`odm-opr-navi ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={onNavigate}
                >
                  <span
                    aria-hidden="true"
                    style={{ minWidth: 16, textAlign: 'center' }}
                  >
                    {item.icon}
                  </span>
                  <span>{t.nav[item.labelKey]}</span>
                  {item.badge ? (
                    <span className="odm-opr-navc">{item.badge}</span>
                  ) : null}
                </a>
              )
            })}
          </div>
        ))}
      </div>

      <div className="odm-opr-user">
        <span className="odm-opr-avatar" aria-hidden="true">
          {initialsOf(user?.fullName)}
        </span>
        <span className="odm-opr-user-text">
          <span className="odm-opr-user-name">
            {user?.fullName ?? t.pilotFallback}
          </span>
          <span className="odm-opr-user-email">{user?.email ?? ''}</span>
        </span>
      </div>
      <LogoutButton className="odm-opr-logout" />
    </nav>
  )
}
