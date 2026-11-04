import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import { RoleSidebar } from '../../shared/components/RoleSidebar'
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
    <aside className={`odm-opr-side${open ? ' is-open' : ''}`}>
      <RoleSidebar
        brandHref={operatorHref({ screen: 'missions' })}
        ariaLabel={t.ariaNav}
        groups={groups.map((group) => ({
          key: group.labelKey,
          label: t.groups[group.labelKey],
          items: group.items.map((item) => ({
            key: item.screen,
            label: t.nav[item.labelKey],
            icon: item.icon,
            href: operatorHref(item.route),
            active: item.screen === activeScreen,
            badge: item.badge,
            onClick: onNavigate,
          })),
        }))}
        profile={{
          name: user?.fullName ?? t.pilotFallback,
          description: user?.email,
        }}
        footer={<LogoutButton className="odm-opr-logout" />}
        onBrandClick={onNavigate}
      />
    </aside>
  )
}
